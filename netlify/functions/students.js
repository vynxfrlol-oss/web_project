const { MongoClient } = require('mongodb');

let client;
let db;

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(body)
  };
}

async function getDb() {
  if (db) return db;

  let mongoUri = (process.env.MONGODB_URI || '').trim();
  if (!mongoUri) throw new Error('MONGODB_URI is not configured');

  if ((mongoUri.startsWith('"') && mongoUri.endsWith('"')) ||
      (mongoUri.startsWith("'") && mongoUri.endsWith("'"))) {
    mongoUri = mongoUri.slice(1, -1).trim();
  }

  if (!/^mongodb(?:\+srv)?:\/\//i.test(mongoUri)) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }

  client = client || new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 10000
  });
  await client.connect();
  db = client.db('studentRegistrationDB');
  return db;
}

function sanitizeStudent(input) {
  const student = {};
  const fields = ['firstName', 'middleName', 'lastName', 'dob', 'contact', 'address'];

  for (const field of fields) {
    if (input[field]) student[field] = String(input[field]).trim();
  }

  return student;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  try {
    const database = await getDb();
    const collection = database.collection('students');

    if (event.httpMethod === 'GET') {
      const search = (event.queryStringParameters?.search || '').trim();
      const numericSearch = Number(search);
      const filter = search
        ? {
            $or: [
              ...(Number.isInteger(numericSearch) && !Number.isNaN(numericSearch)
                ? [{ registrationNumber: numericSearch }]
                : []),
              { firstName: { $regex: search, $options: 'i' } },
              { middleName: { $regex: search, $options: 'i' } },
              { lastName: { $regex: search, $options: 'i' } },
              { contact: { $regex: search, $options: 'i' } },
              { address: { $regex: search, $options: 'i' } }
            ]
          }
        : {};

      const students = await collection.find(filter).sort({ createdAt: -1 }).toArray();
      return json(200, students);
    }

    if (event.httpMethod === 'POST') {
      const student = sanitizeStudent(JSON.parse(event.body || '{}'));

      if (!student.firstName || !student.lastName || !student.contact || !student.address) {
        return json(400, {
          message: 'firstName, lastName, contact, and address are required.'
        });
      }

      const highest = await collection.find().sort({ registrationNumber: -1 }).limit(1).toArray();
      const registrationNumber = (highest[0]?.registrationNumber || 0) + 1;

      const result = await collection.insertOne({
        ...student,
        registrationNumber,
        createdAt: new Date()
      });

      return json(201, {
        message: 'Student registered successfully',
        student: {
          ...student,
          registrationNumber,
          _id: result.insertedId
        }
      });
    }

    return json(405, { message: 'Method not allowed' });
  } catch (error) {
    return json(500, { message: 'Database error', error: error.message });
  }
};
