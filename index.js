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

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const usersCollection = client.db("taskDB").collection("users");


    // JWT Authentication API
    app.post("/jwt", async (req, res) => {
        const user = req.body;
        const token = jwt.sign(user,  process.env.JWT_SECRET, {
          expiresIn: "365d",
        });
        res.send({ token });
      });
  
      // middle aware
      const verifyToken = (req, res, next) => {
        if (!req.headers.authorization) {
          return res.status(401).send("Forbidden Access");
        }
        const token = req.headers.authorization.split(" ")[1];
        jwt.verify(token,  process.env.JWT_SECRET, (err, decoded) => {
          if (err) return res.status(403).send("Invalid or Expired Token");
          req.decoded = decoded;
          next();
        });
      };


    // Add Task API
    //Get
    app.get("/task",verifyToken, async (req, res) => {
        try {
            const result = await addTaskCollection.find().toArray();
            res.send(result);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    // Post
    app.post("/tasks", async(req , res) => {
        const task = req.body;
        const result = await addTaskCollection.insertOne(task);
        res.send(result);
    }) 

    //  Put
    app.put("/putTask/:id",verifyToken, async(req, res) => {
        const id = req.params.id;
        const query  =  {_id: new ObjectId(id)}
        const updateDoc = {
            $set: {
                title: req.body.title,
                status: req.body.status,
                description: req.body.description,
                category: req.body.category,

            },
        }
        const result = await addTaskCollection.updateOne( query,updateDoc);
        console.log("Id", id, query)
        res.send(result);
    })
    //Delete
    app.delete("/deleteTask/:id",verifyToken, async(req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id)}
        const result = await addTaskCollection.deleteOne(query);
        res.send(result);
    })

    // User API
    app.post("/users", async (req, res) => {
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await usersCollection.findOne(query);
        if (existingUser) {
          return res.status(409).send({ message: "User already exists" });
        }
        const result = await usersCollection.insertOne(user);
        res.send(result);
      });

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