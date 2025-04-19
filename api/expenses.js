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

  try {
    console.log('Connecting to MongoDB...');
    const client = await MongoClient.connect(uri, options);
    const db = client.db('tracspend');
    console.log('Successfully connected to MongoDB');

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  console.log('API Request:', {
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body
  });

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('Connecting to database...');
    const { db } = await connectToDatabase();
    const expenses = db.collection('expenses');
    console.log('Connected to database');

    switch (req.method) {
      case 'GET':
        console.log('Fetching expenses...');
        const userExpenses = await expenses
          .find({})
          .sort({ date: -1 })
          .toArray();
        console.log(`Found ${userExpenses.length} expenses`);
        return res.status(200).json(userExpenses);

      case 'POST':
        console.log('Creating new expense:', req.body);
        if (!req.body || !req.body.amount || !req.body.tag) {
          console.log('Missing required fields');
          return res.status(400).json({ error: 'Missing required fields' });
        }
        const newExpense = {
          ...req.body,
          amount: parseFloat(req.body.amount),
          date: new Date().toISOString(),
          createdAt: new Date()
        };
        const result = await expenses.insertOne(newExpense);
        console.log('Created expense:', result.insertedId);
        return res.status(201).json({ ...newExpense, _id: result.insertedId });

      case 'PUT':
        console.log('Updating expense:', req.body);
        const { id, ...updateData } = req.body;
        if (!id) {
          console.log('Missing ID');
          return res.status(400).json({ error: 'Missing ID' });
        }
        try {
          const updateResult = await expenses.findOneAndUpdate(
            { _id: id },
            { $set: updateData },
            { returnDocument: 'after' }
          );
          if (!updateResult.value) {
            console.log('Expense not found');
            return res.status(404).json({ error: 'Expense not found' });
          }
          console.log('Updated expense:', updateResult.value);
          return res.status(200).json(updateResult.value);
        } catch (error) {
          console.error('Update error:', error);
          return res.status(500).json({ error: 'Failed to update expense', details: error.message });
        }

      case 'DELETE':
        console.log('Deleting expense:', req.query);
        const { id: deleteId } = req.query;
        if (!deleteId) {
          console.log('Missing ID');
          return res.status(400).json({ error: 'Missing ID' });
        }
        try {
          const deleteResult = await expenses.deleteOne({ _id: deleteId });
          if (deleteResult.deletedCount === 0) {
            console.log('Expense not found');
            return res.status(404).json({ error: 'Expense not found' });
          }
          console.log('Deleted expense');
          return res.status(200).json({ success: true });
        } catch (error) {
          console.error('Delete error:', error);
          return res.status(500).json({ error: 'Failed to delete expense', details: error.message });
        }

      default:
        console.log('Method not allowed:', req.method);
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 