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
    console.log('Connecting to MongoDB...', { uri: uri.split('@')[1] }); // Log partial URI for debugging
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
  // Always set content type to JSON
  res.setHeader('Content-Type', 'application/json');

  console.log('API Request:', {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers,
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
    return res.status(200).json({ ok: true });
  }

  try {
    console.log('Connecting to database...');
    const { db } = await connectToDatabase();
    const expenses = db.collection('expenses');
    console.log('Connected to database');

    switch (req.method) {
      case 'GET':
        try {
          console.log('Fetching expenses...');
          const userExpenses = await expenses
            .find({})
            .sort({ date: -1 })
            .toArray();
          console.log(`Found ${userExpenses.length} expenses`);
          return res.status(200).json(userExpenses);
        } catch (error) {
          console.error('Error fetching expenses:', error);
          return res.status(500).json({ 
            error: 'Failed to fetch expenses',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          });
        }

      case 'POST':
        try {
          console.log('Creating new expense:', req.body);
          if (!req.body || !req.body.amount || !req.body.tag) {
            console.log('Missing required fields:', req.body);
            return res.status(400).json({ error: 'Missing required fields', receivedBody: req.body });
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
        } catch (error) {
          console.error('Error creating expense:', error);
          return res.status(500).json({ 
            error: 'Failed to create expense',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          });
        }

      case 'PUT':
        try {
          console.log('Updating expense:', req.body);
          const { id, ...updateData } = req.body;
          if (!id) {
            console.log('Missing ID in update request');
            return res.status(400).json({ error: 'Missing ID', receivedBody: req.body });
          }
          const updateResult = await expenses.findOneAndUpdate(
            { _id: id },
            { $set: updateData },
            { returnDocument: 'after' }
          );
          if (!updateResult.value) {
            console.log('Expense not found for update:', id);
            return res.status(404).json({ error: 'Expense not found', id });
          }
          console.log('Updated expense:', updateResult.value);
          return res.status(200).json(updateResult.value);
        } catch (error) {
          console.error('Error updating expense:', error);
          return res.status(500).json({ 
            error: 'Failed to update expense',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          });
        }

      case 'DELETE':
        try {
          console.log('Deleting expense:', req.query);
          const { id: deleteId } = req.query;
          if (!deleteId) {
            console.log('Missing ID in delete request');
            return res.status(400).json({ error: 'Missing ID', receivedQuery: req.query });
          }
          const deleteResult = await expenses.deleteOne({ _id: deleteId });
          if (deleteResult.deletedCount === 0) {
            console.log('Expense not found for deletion:', deleteId);
            return res.status(404).json({ error: 'Expense not found', id: deleteId });
          }
          console.log('Successfully deleted expense:', deleteId);
          return res.status(200).json({ success: true, id: deleteId });
        } catch (error) {
          console.error('Error deleting expense:', error);
          return res.status(500).json({ 
            error: 'Failed to delete expense',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          });
        }

      default:
        console.log('Method not allowed:', req.method);
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 