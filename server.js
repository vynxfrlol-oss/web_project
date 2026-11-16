require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const client = new MongoClient(mongoUri);
let db;

async function connectMongo() {
  try {
    await client.connect();
    db = client.db('studentRegistrationDB');
    console.log('Connected to MongoDB at', mongoUri);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
  }
}

connectMongo();

function sanitizeStudent(input) {
  const student = {};

  if (input.firstName) {
    student.firstName = String(input.firstName).trim();
  }
  if (input.middleName) {
    student.middleName = String(input.middleName).trim();
  }
  if (input.lastName) {
    student.lastName = String(input.lastName).trim();
  }
  if (input.dob) {
    student.dob = String(input.dob).trim();
  }
  if (input.contact) {
    student.contact = String(input.contact).trim();
  }
  if (input.address) {
    student.address = String(input.address).trim();
  }

  return student;
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/api/students', async (req, res) => {
  if (!db) {
    return res.status(500).json({
      message: 'Database is not connected. Start MongoDB or set MONGODB_URI.'
    });
  }

  const search = (req.query.search || '').trim();
  const filter = search
    ? {
        $or: [
          { registrationNumber: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ]
      }
    : {};

  try {
    const students = await db
      .collection('students')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

app.post('/api/students', async (req, res) => {
  if (!db) {
    return res.status(500).json({
      message: 'Database is not connected. Start MongoDB or set MONGODB_URI.'
    });
  }

  const student = sanitizeStudent(req.body);

  if (
    !student.firstName ||
    !student.lastName ||
    !student.contact ||
    !student.address
  ) {
    return res.status(400).json({
      message: 'firstName, lastName, contact, and address are required.'
    });
  }

  try {
    const totalStudents = await db.collection('students').countDocuments();
    const registrationNumber = totalStudents + 1;

    const result = await db.collection('students').insertOne({
      ...student,
      registrationNumber,
      createdAt: new Date()
    });

    res.status(201).json({
      message: 'Student registered successfully',
      student: { ...student, registrationNumber, _id: result.insertedId }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error saving student', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
