import { MongoClient } from 'mongodb';

// Initialize MongoDB client
const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const client = await clientPromise;
    const db = client.db('tracspend');
    const expenses = db.collection('expenses');

    switch (req.method) {
      case 'GET':
        const userExpenses = await expenses
          .find({})
          .sort({ date: -1 })
          .toArray();
        return res.json(userExpenses);

      case 'POST':
        if (!req.body || !req.body.amount || !req.body.tag) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        const newExpense = {
          ...req.body,
          amount: parseFloat(req.body.amount),
          date: new Date().toISOString(),
          createdAt: new Date()
        };
        const result = await expenses.insertOne(newExpense);
        return res.status(201).json({ ...newExpense, _id: result.insertedId });

      case 'PUT':
        const { id, ...updateData } = req.body;
        if (!id) {
          return res.status(400).json({ error: 'Missing ID' });
        }
        const updateResult = await expenses.findOneAndUpdate(
          { _id: id },
          { $set: updateData },
          { returnDocument: 'after' }
        );
        return res.json(updateResult.value);

      case 'DELETE':
        const { id: deleteId } = req.query;
        if (!deleteId) {
          return res.status(400).json({ error: 'Missing ID' });
        }
        const deleteResult = await expenses.deleteOne({ _id: deleteId });
        return res.json(deleteResult);

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 