process.env.NODE_ENV = "test";
const chai = require("chai");
const { expect } = chai;
const chaiSorted = require("chai-sorted");
const request = require("supertest");
const app = require("../app");
const connection = require("../db/connection");

chai.use(chaiSorted);
beforeEach(() => connection.seed.run());
after(() => connection.destroy());
describe("/api", () => {
  describe("/bad-endpoint", () => {
    it("GET:404, error with bad endpoint", () => {
      return request(app)
        .get("/hello")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).to.equal("Page not found");
        });
    });
  });
  it("GET:200, returns JSON of all available endpoints in a JSON file", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body }) => {
        expect(body).to.be.an("object");
      });
  });
  it("INVALID:METHODS", () => {
    const invalidMethods = ["patch", "put", "post", "delete"];
    const methodPromises = invalidMethods.map(method => {
      return request(app)
        [method]("/api")
        .expect(405)
        .then(({ body: { msg } }) => {
          expect(msg).to.equal("Invalid Method");
        });
    });
    return Promise.all(methodPromises);
  });

  describe("/topics", () => {
    it("GET:200, returns all the topics", () => {
      return request(app)
        .get("/api/topics")
        .expect(200)
        .then(({ body: { topics } }) => {
          expect(topics).to.be.an("array");
          expect(topics[0]).to.contain.keys("slug", "description");
          expect(topics[0].slug).to.equal("mitch");
        });
    });
    it("GET:404, returns error if incorrect path", () => {
      return request(app)
        .get("/api/bad-path")
        .expect(404)
        .then(body => {
          expect(body.status).to.equal(404);
        });
    });
    it("POST:201, returns the posted topic", () => {
      return request(app)
        .post("/api/topics")
        .send({
          slug: "dogs",
          description: "Man's best friend"
        })
        .expect(201)
        .then(({body}) => {
          expect(body.topic).to.contain.keys("slug", "description");
          expect(body.topic.slug).to.equal("dogs");
        });
    });
    it("POST:400, returns an error if the slug already exists", () => {
      return request(app)
        .post("/api/topics")
        .send({
          slug: "cats",
          description: "Any description"
        })
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).to.include(
            "Bad Request - duplicate input"
          );
        });
    });
    it("POST:400, returns an error if no description is provided", () => {
      return request(app)
        .post("/api/topics")
        .send({
          slug: "dogs"
        })
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).to.contain(
            "Bad Request - Required input not provided"
          );
        });
    });
    it("POST:400, returns an error if no slug is provided", () => {
      return request(app)
        .post("/api/topics")
        .send({
          description: "Any description"
        })
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).to.contain(
            "Bad Request - Required input not provided"
          );
        });
    });
    it("POST:400, returns an error if no details are provided", () => {
      return request(app)
        .post("/api/topics")
        .send({})
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).to.include(
            "Bad Request - Required input not provided"
          );
        });
    });
    it("INVALID:METHODS", () => {
      const invalidMethods = ["patch", "put", "delete"];
      const methodPromises = invalidMethods.map(method => {
        return request(app)
          [method]("/api/topics")
          .expect(405)
          .then(body => {
            expect(body.status).to.equal(405);
            expect(body.body.msg).to.equal("Invalid Method");
          });
      });
      return Promise.all(methodPromises);
    });
  });
  describe("/users", () => {
    it("POST:201, displays the details of the new user", () => {
      return request(app)
        .post("/api/users")
        .send({
          username: "bobby71",
          avatar_url:
            "https://avatars2.githubusercontent.com/u/24394918?s=400&v=4",
          name: "Robert"
        })
        .expect(201)
        .then(({ body }) => {
          expect(body.user).to.contain.keys("username", "avatar_url", "name");
        });
    });
    it("POST:400, returns an error if appropriate details are not provided", () => {
      return request(app)
        .post("/api/users")
        .send({})
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).to.contain(
            "Bad Request - Required input not provided"
          );
        });
    });
    it("GET:200, displays all registered users", () => {
      return request(app)
        .get("/api/users")
        .expect(200)
        .then(({ body }) => {
          expect(body.users).to.be.an("array");
          expect(body.users[0]).to.contain.keys(
            "username",
            "name",
            "avatar_url"
          );
        });
    });
    describe("/:username", () => {
      it("GET:200, get user by username", () => {
        return request(app)
          .get("/api/users/butter_bridge")
          .expect(200)
          .then(({ body: { user } }) => {
            expect(user.username).to.equal("butter_bridge");
            expect(user).to.have.keys("username", "avatar_url", "name");
            expect(user).to.be.an("object");
          });
      });
      it("INVALID:METHODS", () => {
        const invalidMethods = ["patch", "put", "delete"];
        const methodPromises = invalidMethods.map(method => {
          return request(app)
            [method]("/api/users/butter_bridge")
            .expect(405)
            .then(body => {
              expect(body.status).to.equal(405);
              expect(body.body.msg).to.equal("Invalid Method");
            });
        });
        return Promise.all(methodPromises);
      });
      it("GET:404, input a username that does not exist", () => {
        return request(app)
          .get("/api/users/banana")
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).to.equal("Username not found");
          });
      });
    });
  });
  describe("/articles", () => {
    it("GET:200, get all the articles", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then(({ body: { articles, total_count } }) => {
          expect(articles[0]).to.contain.keys(
            "author",
            "title",
            "article_id",
            "topic",
            "created_at",
            "votes",
            "comment_count"
          );
          expect(articles).to.be.sortedBy("created_at", {
            descending: true
          });
          expect(articles).to.be.descendingBy("created_at");
          expect(articles.length).to.equal(10);
          expect(total_count).to.equal(12);
        });
    });
    it("POST:201 posts a new article", () => {
      return request(app)
        .post("/api/articles")
        .send({
          title: "A Critical Analysis of Cat Food Manufacturing",
          topic: "cats",
          author: "rogersop",
          body:
            "After many months of gruelling investigations, it emerges that the famous cat food, 'Catlent Green' is in fact comprised of cats."
        })
        .expect(201)
        .then(({ body }) => {
          expect(body.article.title).to.equal(
            "A Critical Analysis of Cat Food Manufacturing"
          );
        });
    });
    it("POST:400, no username or body included in sent body", () => {
      return request(app)
        .post("/api/articles")
        .send({})
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).to.contain("Bad Request - Required input not provided");
        });
    });
    it("GET:200, accepts the queries sort_by", () => {
      return request(app)
        .get("/api/articles?sort_by=author")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles[0]).to.contain.keys(
            "author",
            "title",
            "article_id",
            "topic",
            "created_at",
            "votes",
            "comment_count"
          );
          expect;
          expect(articles).to.be.descendingBy("author");
          expect(articles[0].author).to.equal("rogersop");
        });
    });
    it("GET:200, accepts the queries order", () => {
      return request(app)
        .get("/api/articles?order=asc")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles[0]).to.contain.keys(
            "author",
            "title",
            "article_id",
            "topic",
            "created_at",
            "votes",
            "comment_count"
          );
          expect(articles).to.be.ascendingBy("created_at");
        });
    });
    it("GET:200, filters the articles by author", () => {
      return request(app)
        .get("/api/articles?author=rogersop")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles[0]).to.contain.keys(
            "author",
            "title",
            "article_id",
            "topic",
            "created_at",
            "votes",
            "comment_count"
          );
          expect(articles[0].author).to.equal("rogersop");
          expect(articles[1].author).to.equal("rogersop");
        });
    });
    it("GET:200, filters the articles by topic", () => {
      return request(app)
        .get("/api/articles?topic=mitch")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles[0]).to.contain.keys(
            "author",
            "title",
            "article_id",
            "topic",
            "created_at",
            "votes",
            "comment_count"
          );
          expect(articles).to.be.descendingBy("topic");
        });
    });
    it("GET:400, error if provided with an invalid sort_by value", () => {
      return request(app)
        .get("/api/articles?sort_by=banana")
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).to.contain("Bad Request");
        });
    });
    it("GET:400, error if provided with an invalid order value", () => {
      return request(app)
        .get("/api/articles?order=banana")
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).to.contain("Bad Request");
        });
    });
    it("GET:404, error if provided with an invalid author", () => {
      return request(app)
        .get("/api/articles?author=banana")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).to.equal("Author Not Found");
        });
    });
    it("GET:404, error if provided with an invalid topic", () => {
      return request(app)
        .get("/api/articles?topic=banana")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).to.equal("Topic Not Found");
        });
    });
    it("GET:200, when add a limit returns limited number of articles ", () => {
      return request(app)
        .get("/api/articles?limit=2")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles.length).to.equal(2);
        });
    });
    it("GET:200, when a p returns limited number of items", () => {
      return request(app)
        .get("/api/articles?p=2")
        .expect(200)
        .then(({ body: { articles } }) => {
          expect(articles.length).to.equal(2);
        });
    });
    it("GET:200", () => {});
    describe("/:article_id", () => {
      it("GET:200, get article by id", () => {
        return request(app)
          .get("/api/articles/2")
          .expect(200)
          .then(({ body: { article } }) => {
            expect(article.article_id).to.equal(2);
            expect(article).to.have.keys(
              "article_id",
              "title",
              "body",
              "votes",
              "topic",
              "author",
              "created_at",
              "comment_count"
            );
            expect(article).to.be.an("object");
            expect(article.comment_count).to.equal("0");
          });
      });
      it("GET:404, a valid id that does not exist", () => {
        return request(app)
          .get("/api/articles/22222")
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).to.equal("Not Found");
          });
      });
      it("GET:400, an invalid id", () => {
        return request(app)
          .get("/api/articles/banana")
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).to.contain("Bad Request");
          });
      });
      it("PATCH:200, successfully increases votes in article ", () => {
        return request(app)
          .patch("/api/articles/2")
          .send({ inc_votes: 100 })
          .expect(200)
          .then(({ body: { article } }) => {
            expect(article.votes).to.equal(100);
            expect(article.article_id).to.equal(2);
            expect(article).to.be.an("object");
          });
      });
      it("PATCH:200, successfully decreases votes in article ", () => {
        return request(app)
          .patch("/api/articles/2")
          .send({ inc_votes: -50 })
          .expect(200)
          .then(({ body: { article } }) => {
            expect(article.votes).to.equal(-50);
            expect(article.article_id).to.equal(2);
            expect(article).to.be.an("object");
          });
      });
      it("PATCH:404, an invalid id", () => {
        return request(app)
          .patch("/api/articles/2222222")
          .send({ inc_votes: 100 })
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).to.equal("Not Found");
          });
      });

      it("PATCH:400, invalid inc_votes on request body", () => {
        return request(app)
          .patch("/api/articles/2")
          .send({ inc_votes: "banana" })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).to.contain("Bad Request");
          });
      });
      it("PATCH:200, no content request body", () => {
        return request(app)
          .patch("/api/articles/2")
          .send({})
          .expect(200)
          .then(({ body: { article } }) => {
            expect(article.votes).to.equal(0);
          });
      });
      it("DELETE: status 204", () => {
        return request(app)
          .delete("/api/articles/1")
          .expect(204)
      });
      it("DELETE: status 404, returns an error where an article that does not exist is provided", () => {
        return request(app)
          .delete("/api/articles/999999")
          .expect(404)
          .then(({ body }) => {
            expect(body.msg).to.equal("Article ID Not Found");
          });
      });
      it("DELETE: status 400, returns an error where an invalid article_id is provided", () => {
        return request(app)
          .delete("/api/articles/invalid")
          .expect(400)
          .then(({ body }) => {
            expect(body.msg).to.equal("Bad Request - invalid value");
          });
      });
      it("INVALID:METHODS", () => {
        const invalidMethods = ["put", "post"];
        const methodPromises = invalidMethods.map(method => {
          return request(app)
            [method]("/api/articles/2")
            .expect(405)
            .then(body => {
              expect(body.status).to.equal(405);
              expect(body.body.msg).to.equal("Invalid Method");
            });
        });
        return Promise.all(methodPromises);
      });
      describe("/comments", () => {
        it("POST:201, successfully posts a new comment to an article id", () => {
          return request(app)
            .post("/api/articles/2/comments")
            .send({
              username: "lurker",
              body: "Great article, I read it whilst I was lurking"
            })
            .expect(201)
            .then(({ body: { comment } }) => {
              expect(comment.author).to.equal("lurker");
              expect(comment).to.be.an("object");
              expect(comment).to.have.keys(
                "comment_id",
                "votes",
                "created_at",
                "author",
                "body",
                "article_id"
              );
              expect(comment.votes).to.equal(0);
            });
        });
        it("POST:400, no username or body included in sent body", () => {
          return request(app)
            .post("/api/articles/2/comments")
            .send({})
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).to.contain(
                "Bad Request - Required input not provided"
              );
            });
        });
        it("POST:404, article_id valid but does not exist", () => {
          return request(app)
            .post("/api/articles/22222/comments")
            .send({
              username: "lurker",
              body: "Great article, I read it whilst I was lurking"
            })
            .expect(404)
            .then(({ body: { msg } }) => {
              expect(msg).to.contain("Not Found");
            });
        });
        it("POST:400, article_id invalid", () => {
          return request(app)
            .post("/api/articles/banana/comments")
            .send({
              username: "lurker",
              body: "Great article, I read it whilst I was lurking"
            })
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).to.contain("Bad Request");
            });
        });
        it("POST:404, username does not exist", () => {
          return request(app)
            .post("/api/articles/2/comments")
            .send({
              username: "banana",
              body: "Great article, I read it whilst I was lurking"
            })
            .expect(404)
            .then(({ body: { msg } }) => {
              expect(msg).to.contain("Not Found");
            });
        });
        it("GET:200, get all the comments for article by id (sorted by created_at)", () => {
          return request(app)
            .get("/api/articles/1/comments")
            .expect(200)
            .then(({ body: { comments } }) => {
              expect(comments[0]).to.have.keys(
                "comment_id",
                "votes",
                "created_at",
                "author",
                "body",
                "article_id"
              );
              expect(comments[0].article_id).to.equal(1);
              expect(comments).to.be.an("array");
              expect(comments).to.be.sortedBy("created_at", {
                descending: true
              });
              expect(comments.length).to.equal(10);
            });
        });
        it("GET:200, when there is a limit returns no. of comments", () => {
          return request(app)
            .get("/api/articles/1/comments?limit=2")
            .expect(200)
            .then(({ body: { comments } }) => {
              expect(comments.length).to.equal(2);
            });
        });
        it("GET:200, if p is provided", () => {
          return request(app)
            .get("/api/articles/1/comments?p=1")
            .expect(200)
            .then(({ body: { comments } }) => {
              expect(comments.length).to.equal(10);
            });
        });
        it("GET:200, accepts sort_by and order queries", () => {
          return request(app)
            .get("/api/articles/1/comments?sort_by=votes&order=asc")
            .expect(200)
            .then(({ body: { comments } }) => {
              expect(comments).to.be.sortedBy("votes");
              expect(comments).to.be.ascendingBy("votes");
            });
        });
        it("GET:400, sort_by a column that does not exist", () => {
          return request(app)
            .get("/api/articles/1/comments?sort_by=banana&order=asc")
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).to.contain("Bad Request");
            });
        });
        it("GET:400, order isn't valid", () => {
          return request(app)
            .get("/api/articles/1/comments?sort_by=votes&order=banana")
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).to.contain("Bad Request");
            });
        });
        it("GET:404, id does not exist", () => {
          return request(app)
            .get("/api/articles/22222/comments")
            .expect(404)
            .then(({ body: { msg } }) => {
              expect(msg).to.contain("Not Found");
            });
        });
        it("GET:400, id invalid", () => {
          return request(app)
            .get("/api/articles/banana/comments")
            .expect(400)
            .then(({ body: { msg } }) => {
              expect(msg).to.contain("Bad Request");
            });
        });
        it("GET:200, valid id but no comments", () => {
          return request(app)
            .get("/api/articles/2/comments")
            .expect(200)
            .then(({ body: { comments } }) => {
              expect(comments).to.eql([]);
            });
        });
      });
    });
  });
  describe("/comments", () => {
    describe("/:comments", () => {
      it("INVALID:METHODS", () => {
        const invalidMethods = ["get", "put"];
        const methodPromises = invalidMethods.map(method => {
          return request(app)
            [method]("/api/comments/2")
            .expect(405)
            .then(body => {
              expect(body.status).to.equal(405);
              expect(body.body.msg).to.equal("Invalid Method");
            });
        });
        return Promise.all(methodPromises);
      });
      it("PATCH:200, successfully updates votes in article", () => {
        return request(app)
          .patch("/api/comments/2")
          .send({ inc_votes: 100 })
          .expect(200)
          .then(({ body: { comment } }) => {
            expect(comment.votes).to.equal(114);
            expect(comment.comment_id).to.equal(2);
            expect(comment).to.be.an("object");
          });
      });
      it("PATCH:200, decrements the vote count by the  number", () => {
        return request(app)
          .patch("/api/comments/2")
          .send({ inc_votes: -2 })
          .expect(200)
          .then(({ body: { comment } }) => {
            expect(comment.votes).to.equal(12);
          });
      });
      it("PATCH:200, ignores additional body elements", () => {
        return request(app)
          .patch("/api/comments/2")
          .send({ inc_votes: 100, face: "smiley" })
          .expect(200)
          .then(({ body: { comment } }) => {
            expect(comment.votes).to.equal(114);
          });
      });
      it("PATCH:200, when no body elements", () => {
        return request(app)
          .patch("/api/comments/2")
          .send({})
          .expect(200)
          .then(({ body: { comment } }) => {
            expect(comment.votes).to.equal(14);
          });
      });
      it("PATCH:200, when no inc_votes value, makes no changes", () => {
        return request(app)
          .patch("/api/comments/2")
          .send({})
          .expect(200)
          .then(({ body: { comment } }) => {
            expect(comment.votes).to.equal(14);
          });
      });
      it("PATCH:400, error where an invalid inc_votes value is provided", () => {
        return request(app)
          .patch("/api/comments/1")
          .send({ inc_votes: "hello" })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).to.contain("Bad Request");
          });
      });
      it("PATCH:404, error if provided a comment_id that does not exist", () => {
        return request(app)
          .patch("/api/comments/2222")
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).to.contain("Not Found");
          });
      });
      it("DELETE:204, successfully deletes comment ", () => {
        return request(app)
          .delete("/api/comments/1")
          .expect(204);
      });
      it("DELETE:404, error message if provided a valid comment_id that does not exist", () => {
        return request(app)
          .delete("/api/comments/2222")
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).to.equal("Comment ID Not Found");
          });
      });
      it("DELETE:400, error message if provided a invalid comment_id that does not exist", () => {
        return request(app)
          .delete("/api/comments/banana")
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).to.contain("Bad Request");
          });
      });
      it("INVALID:METHODS", () => {
        const invalidMethods = ["get", "put"];
        const methodPromises = invalidMethods.map(method => {
          return request(app)
            [method]("/api/comments/2")
            .expect(405)
            .then(body => {
              expect(body.status).to.equal(405);
              expect(body.body.msg).to.equal("Invalid Method");
            });
        });
        return Promise.all(methodPromises);
      });
    });
  });
});
