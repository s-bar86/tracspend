import { MongoClient } from 'mongodb';

// Initialize MongoDB client
const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  const client = await MongoClient.connect(uri, options);
  const db = client.db('tracspend');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
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
    const { db } = await connectToDatabase();
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
        try {
          const updateResult = await expenses.findOneAndUpdate(
            { _id: id },
            { $set: updateData },
            { returnDocument: 'after' }
          );
          if (!updateResult.value) {
            return res.status(404).json({ error: 'Expense not found' });
          }
          return res.json(updateResult.value);
        } catch (error) {
          console.error('Update error:', error);
          return res.status(500).json({ error: 'Failed to update expense', details: error.message });
        }

      case 'DELETE':
        const { id: deleteId } = req.query;
        if (!deleteId) {
          return res.status(400).json({ error: 'Missing ID' });
        }
        try {
          const deleteResult = await expenses.deleteOne({ _id: deleteId });
          if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ error: 'Expense not found' });
          }
          return res.json({ success: true });
        } catch (error) {
          console.error('Delete error:', error);
          return res.status(500).json({ error: 'Failed to delete expense', details: error.message });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 