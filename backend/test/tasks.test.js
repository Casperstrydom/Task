const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
let app, mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  process.env.MONGO_URI = uri; // point the app to in-memory Mongo
  process.env.PORT = "0"; // random port

  // require AFTER envs set
  app = require("../src/app");
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

test("health endpoint", async () => {
  const res = await request(app).get("/health");
  expect(res.status).toBe(200);
  expect(res.body.status).toBe("ok");
});

test("CRUD task flow", async () => {
  // create
  let res = await request(app).post("/tasks").send({ title: "Write tests" });
  expect(res.status).toBe(201);
  const id = res.body._id;

  // list
  res = await request(app).get("/tasks");
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body[0]._id).toBe(id);

  // update
  res = await request(app).patch(`/tasks/${id}`).send({ completed: true });
  expect(res.status).toBe(200);
  expect(res.body.completed).toBe(true);

  // delete
  res = await request(app).delete(`/tasks/${id}`);
  expect(res.status).toBe(204);
});
