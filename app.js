// app.js

const express = require('express');
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const uploadFileToS3 = require("./s3/uploadFile");
const docClient = require('./db');

const app = express();
app.use(express.json()); 
app.use(cors())

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// S3 Route
app.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send("No file uploaded.");

  const result = await uploadFileToS3(file);
  if (result.success) {
    res.status(200).json({ message: "Upload successful", key: result.key });
  } else {
    res.status(500).json({ error: "Upload failed", details: result.error });
  }
});

//DynamoDB Routes

// POST /users — add a user
app.post('/add_user', async (req, res) => {
  let { userId, name, email, age } = req.body;

   userId = Number(userId);
  age = Number(age); 

  const params = {
    TableName: 'Users',
    Item: { userId, name, email, age},
  }; 

  try {
    await docClient.put(params).promise();
    res.json({ message: 'User added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add user' });
  }
});

// GET /users/:id — get a user
app.get('/users/:id', async (req, res) => {
  const userId = Number(req.params.id);

  const params = {
    TableName: 'Users',
    Key: { userId },
  };
 
  try {
    const data = await docClient.get(params).promise();
    res.json(data.Item || { error: 'User not found' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not get user' });
  }
});

// GET /users — get all users
app.get('/users', async (req, res) => { 
  const params = {
    TableName: 'Users',
  };

  try {
    const data = await docClient.scan(params).promise();
    res.json(data.Items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not get users' });
  }
});

// DELETE /users/:id — delete a user
app.delete('/users/:id', async (req, res) => {
  const userId = Number(req.params.id);

  const params = {
    TableName: 'Users',
    Key: { userId },
  };

  try {
    await docClient.delete(params).promise();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete user' });
  }
});

app.get("/", (req, res) => res.send("Server is running"));
// Start server
app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
 