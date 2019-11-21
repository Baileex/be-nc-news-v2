process.env.NODE_ENV = "test";
const chai = require("chai");
const { expect } = chai;
const chaiSorted = require("chai-sorted");
const request = require("supertest");
const app = require("../app");
const connection = require("../db/connection");

chai.use(chaiSorted);

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
  beforeEach(() => connection.seed.run());
  after(() => connection.destroy());
  describe("/topics", () => {
    it("GET:200, returns all the topics", () => {
      return request(app)
        .get("/api/topics")
        .expect(200)
        .then(({ body }) => {
          // console.log(body.topics);
          expect(body.topics).to.be.an("array");
          expect(body.topics[0]).to.contain.keys("slug", "description");
          expect(body.topics[0].slug).to.equal("mitch");
        });
    });
    it("GET:404, returns error if incorrect path", () => {
      return request(app)
        .get("/api/bad-path")
        .expect(404)
        .then(body => {
          //console.log(body);
          expect(body.status).to.equal(404);
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
    describe("/:username", () => {
      it("GET:200, get user by username", () => {
        return request(app)
          .get("/api/users/butter_bridge")
          .expect(200)
          .then(({ body }) => {
            expect(body.user[0].username).to.equal("butter_bridge");
            expect(body.user[0]).to.have.keys("username", "avatar_url", "name");
            expect(body.user.length).to.equal(1);
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
          .then(({ body }) => {
            expect(body.msg).to.equal("Username not found");
          });
      });
    });
  });
  describe("/articles", () => {
    it("GET:200, get all the articles", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then(({ body }) => {
          // console.log(body)
          expect(body.articles[0]).to.contain.keys(
            "author",
            "title",
            "article_id",
            "topic",
            "created_at",
            "votes",
            "comment_count"
          );
          expect(body.articles).to.be.sortedBy("created_at", {
            descending: true
          });
        });
    });
    it("GET:200, accepts the queries sort_by, order", () => {
      return request(app)
        .get("/api/articles?sort_by=votes&order=asc")
        .expect(200)
        .then(({ body }) => {
          expect(body.articles[0]).to.contain.keys(
            "author",
            "title",
            "article_id",
            "topic",
            "created_at",
            "votes",
            "comment_count"
          );
          expect(body.articles).to.be.sortedBy("votes");
          expect(body.articles).to.be.ascendingBy("votes");
        });
    });
    it("GET:200, filters the articles by author", () => {
      return request(app)
        .get("/api/articles?author=butter_bridge")
        .expect(200)
        .then(({ body }) => {
          expect(body.articles[0]).to.contain.keys(
            "author",
            "title",
            "article_id",
            "topic",
            "created_at",
            "votes",
            "comment_count"
          );
          expect(body.articles).to.be.descendingBy("author");
        });
    });
    it("GET:200, filters the articles by topic", () => {
      return request(app)
        .get("/api/articles?topic=mitch")
        .expect(200)
        .then(({ body }) => {
          expect(body.articles[0]).to.contain.keys(
            "author",
            "title",
            "article_id",
            "topic",
            "created_at",
            "votes",
            "comment_count"
          );
          expect(body.articles).to.be.descendingBy("topic");
        });
    });
    it("GET:400, error if provided with an invalid sort_by value", () => {
      return request(app)
        .get("/api/articles?sort_by=banana")
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).to.contain("Bad Request");
        });
    });
    it("GET:400, error if provided with an invalid order value", () => {
      return request(app)
        .get("/api/articles?order=banana")
        .expect(400)
        .then(({ body }) => {
          expect(body.msg).to.contain("Bad Request");
        });
    });
    it("GET:404, error if provided with an invalid author", () => {
      return request(app)
        .get("/api/articles?author=banana")
        .expect(404)
        .then(({ body }) => {
          expect(body.msg).to.equal("Author Not Found");
        });
    });
    it("GET:404, error if provided with an invalid topic", () => {
      return request(app)
        .get("/api/articles?topic=banana")
        .expect(404)
        .then(({ body }) => {
          expect(body.msg).to.equal("Topic Not Found");
        });
    });
    describe("/:article_id", () => {
      it("GET:200, get article by id", () => {
        return request(app)
          .get("/api/articles/2")
          .expect(200)
          .then(({ body: { article } }) => {
            expect(article[0].article_id).to.equal(2);
            expect(article[0]).to.have.keys(
              "article_id",
              "title",
              "body",
              "votes",
              "topic",
              "author",
              "created_at",
              "comment_count"
            );
          });
      });
      it("GET:404, a valid id that does not exist", () => {
        return request(app)
          .get("/api/articles/22222")
          .expect(404)
          .then(({ body }) => {
            expect(body.msg).to.equal("Not Found");
          });
      });
      it("GET:400, an invalid id", () => {
        return request(app)
          .get("/api/articles/banana")
          .expect(400)
          .then(({ body }) => {
            expect(body.msg).to.contain("Bad Request");
          });
      });
      it("PATCH:200, successfully updates votes in article ", () => {
        return request(app)
          .patch("/api/articles/2")
          .send({ inc_votes: 100 })
          .expect(200)
          .then(({ body }) => {
            expect(body.article[0].votes).to.equal(100);
            expect(body.article[0].article_id).to.equal(2);
          });
      });
      it("PATCH:404, an invalid id", () => {
        return request(app)
          .patch("/api/articles/2222222")
          .send({ inc_votes: 100 })
          .expect(404)
          .then(({ body }) => {
            expect(body.msg).to.equal("Not Found");
          });
      });
      it("PATCH:400, no inc_votes on request body", () => {
        return request(app)
          .patch("/api/articles/2")
          .send({ banana: 100 })
          .expect(400)
          .then(({ body }) => {
            expect(body.msg).to.contain("Bad Request");
          });
      });
      it("PATCH:400, invalid inc_votes on request body", () => {
        return request(app)
          .patch("/api/articles/2")
          .send({ inc_votes: "banana" })
          .expect(400)
          .then(({ body }) => {
            expect(body.msg).to.contain("Bad Request");
          });
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
            .then(({ body }) => {
              expect(body.article.article_id).to.equal(2);
              expect(body.article.author).to.equal("lurker");
            });
        });
        it("POST:400, no username or body included in sent body", () => {
          return request(app)
            .post("/api/articles/2/comments")
            .send({})
            .expect(400)
            .then(({ body }) => {
              expect(body.msg).to.contain(
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
            .then(({ body }) => {
              expect(body.msg).to.contain("Not Found");
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
            .then(({ body }) => {
              expect(body.msg).to.contain("Bad Request");
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
            .then(({ body }) => {
              expect(body.msg).to.contain("Not Found");
            });
        });
        it("GET:200, get all the comments for article by id (sorted by created_at)", () => {
          return request(app)
            .get("/api/articles/1/comments")
            .expect(200)
            .then(({ body }) => {
              // console.log(body);
              expect(body.comments[0]).to.have.keys(
                "comment_id",
                "votes",
                "created_at",
                "author",
                "body",
                "article_id"
              );
              expect(body.comments[0].article_id).to.equal(1);
              expect(body.comments).to.be.an("array");
              expect(body.comments).to.be.sortedBy("created_at", {
                descending: true
              });
            });
        });
        it("GET:200, accepts sort_by and order queries", () => {
          return request(app)
            .get("/api/articles/1/comments?sort_by=votes&order=asc")
            .expect(200)
            .then(({ body }) => {
              expect(body.comments).to.be.sortedBy("votes");
              expect(body.comments).to.be.ascendingBy("votes");
            });
        });
        it("GET:400, sort_by a column that does not exist", () => {
          return request(app)
            .get("/api/articles/1/comments?sort_by=banana&order=asc")
            .expect(400)
            .then(({ body }) => {
              expect(body.msg).to.contain("Bad Request");
            });
        });
        it("GET:400, order isn't valid", () => {
          return request(app)
            .get("/api/articles/1/comments?sort_by=votes&order=banana")
            .expect(400)
            .then(({ body }) => {
              expect(body.msg).to.contain("Bad Request");
            });
        });
        it("GET:404, id does not exist", () => {
          return request(app)
            .get("/api/articles/22222/comments?sort_by=votes&order=asc")
            .expect(404)
            .then(({ body }) => {
              expect(body.msg).to.contain("Not Found");
            });
        });
        it("GET:400, id invalid", () => {
          return request(app)
            .get("/api/articles/banana/comments?sort_by=votes&order=asc")
            .expect(400)
            .then(({ body }) => {
              expect(body.msg).to.contain("Bad Request");
            });
        });
      });
    });
  });
  describe("/comments", () => {
    describe("/:comments", () => {
      it("INVALID:METHODS", () => {
        const invalidMethods = ["get", "post", "put"];
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
          .then(({ body }) => {
            //console.log(body.comment);
            expect(body.comment[0].votes).to.equal(114);
            expect(body.comment[0].comment_id).to.equal(2);
          });
      });
      it("PATCH:200, decrements the vote count by the  number", () => {
        return request(app)
          .patch("/api/comments/2")
          .send({ inc_votes: -2 })
          .expect(200)
          .then(({ body }) => {
            expect(body.comment[0].votes).to.equal(12);
          });
      });
      it("PATCH:200, ignores additional body elements", () => {
        return request(app)
          .patch("/api/comments/2")
          .send({ inc_votes: 100, face: "smiley" })
          .expect(200)
          .then(({ body }) => {
            expect(body.comment[0].votes).to.equal(114);
          });
      });
      it("PATCH:200, when no inc_votes value, makes no changes", () => {
        return request(app)
          .patch("/api/comments/2")
          .send({})
          .expect(200)
          .then(({ body }) => {
            expect(body.comment[0].votes).to.equal(15);
          });
      });
      it("PATCH:400, error where an invalid inc_votes value is provided", () => {
        return request(app)
          .patch("/api/comments/1")
          .send({ inc_votes: "hello" })
          .expect(400)
          .then(({ body }) => {
            expect(body.msg).to.contain("Bad Request");
          });
      });
      it("PATCH:404, error if provided a comment_id that does not exist", () => {
        return request(app)
          .patch("/api/comments/2222")
          .expect(404)
          .then(({ body }) => {
            expect(body.msg).to.contain("Not Found");
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
          .then(({ body }) => {
            expect(body.msg).to.equal("Comment ID Not Found");
          });
      });
      it("DELETE:400, error message if provided a invalid comment_id that does not exist", () => {
        return request(app)
          .delete("/api/comments/banana")
          .expect(400)
          .then(({ body }) => {
            expect(body.msg).to.contain("Bad Request");
          });
      });
      it("INVALID:METHODS", () => {
        const invalidMethods = ["get", "post", "put"];
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
