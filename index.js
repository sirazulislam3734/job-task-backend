require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));

// MongoDB Connection

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jkpu6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const addTaskCollection = client.db("taskDB").collection("tasks");


    // Add Task API
    app.get("/task", async (req, res) => {
        const result = await addTaskCollection.find().toArray();
        res.send(result)
    })

    app.post("/tasks", async(req , res) => {
        const task = req.body;
        const result = await addTaskCollection.insertOne(task);
        res.send(result);
    }) 

    app.patch("/patchTask/:id", async(req, res) => {
        const id = req.params.id;
        const query = { _id: new Object(id)}
        const updateDoc = {
            $set: req.body,
        }
        const result = await addTaskCollection.updateOne( query,updateDoc);
        res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


// Routes
app.get("/", (req, res) => {
  res.send("Task Management Backend is running!");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});