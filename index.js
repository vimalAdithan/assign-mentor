import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import { MongoClient } from "mongodb";
const app = express();
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;
const client = new MongoClient(MONGO_URL); // dial
// Top level await
await client.connect(); // call
console.log("Mongo is connected !!!  ");

// to get all student
app.get("/", express.json(), async function (request, response) {
  const result = await client
    .db("assign")
    .collection("student")
    .find({}, { _id: 0, id: 1, name: 1 })
    .toArray();
  response.send(result);
});

// to create student
app.post("/student", express.json(), async function (request, response) {
  const data = request.body;
  const result = await client
    .db("assign")
    .collection("student")
    .insertOne(data);
  response.send(result);
});

// to create mentor
app.post("/mentor", express.json(), async function (request, response) {
  const data = request.body;
  const result = await client.db("assign").collection("mentor").insertOne(data);
  response.send(result);
});

// to get all mentor
app.get("/mentor", express.json(), async function (request, response) {
  const result = await client
    .db("assign")
    .collection("mentor")
    .find({})
    .toArray();
  response.send(result);
});

// to get all students without mentor
app.get("/unassign", async function (request, response) {
  const result = await client
    .db("assign")
    .collection("student")
    .find({ mentor: false }, { id: 1, name: 1, _id: 0 })
    .toArray();
  result.length > 0
    ? response.send(result)
    : response
        .status(404)
        .send({ message: "all students are assigned to a mentor" });
});

// show all students with particular mentor
app.get("/mentor/:id", async function (request, response) {
  const { id } = request.params;
  var result;
  const mentor = await client
    .db("assign")
    .collection("mentor")
    .findOne({ id: id });
  if (mentor) {
    result = await client
      .db("assign")
      .collection("student")
      .find({ mentor_name: mentor.name }, { _id: 0, name: 1 })
      .toArray();
    if (result.length > 0) {
      response.send(result);
    } else {
      response
        .status(404)
        .send({ message: `no students are assigned for this mentor id:${id}` });
    }
  } else {
    response.status(404).send({ message: `no mentor with this id:${id}` });
  }
});

// to assign or reassign a mentor to a student
app.put("/assign/:id", express.json(), async function (request, response) {
  const { id } = request.params;
  const data = request.body;
  var result;
  const find = await client
    .db("assign")
    .collection("student")
    .findOne({ id: id });
  if (find == null) {
    response.status(404).send({ message: `No student with this id:${id}` });
  } else if (find.mentor == true) {
    result =
      (await client.db("assign").collection("student").updateOne(
        { id: id },
        {
          $set: data,
        }
      )) &&
      (await client
        .db("assign")
        .collection("student")
        .updateOne(
          { id: id },
          {
            $set: { previous_mentor: find.mentor_name },
          }
        )) &&
      response.send({ message: "Student is reassigned with new mentor" });
  } else {
    result =
      (await client
        .db("assign")
        .collection("student")
        .updateOne({ id: id }, { $set: data })) &&
      (await client
        .db("assign")
        .collection("student")
        .updateOne({ id: id }, { $set: { mentor: true } })) &&
      response.send({ message: "Student is assigned with new mentor" });
  }
});

// to get previously assigned mentor details of a student
app.get("/student/:id", express.json(), async function (request, response) {
  const { id } = request.params;
  const find = await client
    .db("assign")
    .collection("student")
    .findOne({ id: id });
  if (!find) {
    response.status(404).send({ message: `No student with this id:${id}` });
  } else if (find.previous_mentor.length > 0) {
    response.send(find);
  } else {
    response
      .status(404)
      .send({ message: "there is no previously assigned mentor" });
  }
});

app.listen(PORT, () => console.log(`The server started in: ${PORT} ✨✨`));