import { MongoClient } from 'mongodb';

// Immediately log that the file is being executed
console.log('API Route Module Loaded - Expenses Endpoint');

// Initialize MongoDB client
const uri = process.env.MONGODB_URI;
console.log('MongoDB URI configuration check:', {
  exists: !!uri,
  length: uri ? uri.length : 0,
  includes_protocol: uri ? uri.startsWith('mongodb') : false
});

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  console.log('Connect to Database function called');
  
  if (cachedClient && cachedDb) {
    console.log('Using cached database connection');
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    console.error('MONGODB_URI is not defined in environment');
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  try {
    // Log connection attempt with sanitized URI
    const sanitizedUri = uri.replace(/:[^@]*@/, ':****@');
    console.log('Attempting MongoDB connection with URI:', sanitizedUri);
    
    const client = await MongoClient.connect(uri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    
    const dbName = uri.split('/').pop().split('?')[0] || 'tracspend';
    console.log('Using database:', dbName);
    
    const db = client.db(dbName);
    
    // Test the connection
    await db.command({ ping: 1 });
    console.log('Successfully connected to MongoDB and verified connection');

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    throw error;
  }
}

export default async function handler(req, res) {
  // Set response headers first thing
  res.setHeader('Content-Type', 'application/json');
  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  console.log('Request received:', {
    method: req.method,
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body
  });

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return res.status(200).json({ ok: true });
  }

  try {
    console.log('Attempting database connection...');
    const { db } = await connectToDatabase();
    const expenses = db.collection('expenses');
    console.log('Database connection successful');

    if (req.method === 'GET') {
      try {
        console.log('Executing GET request...');
        // Get user ID from query parameter or header
        const userId = req.query.userId || req.headers['x-user-id'];
        console.log('Fetching expenses for user:', userId);
        
        const query = userId ? { userId } : {};
        const userExpenses = await expenses.find(query).sort({ date: -1 }).toArray();
        console.log(`Found ${userExpenses.length} expenses`);
        
        const response = {
          success: true,
          count: userExpenses.length,
          data: userExpenses
        };
        
        console.log('Sending successful response');
        return res.status(200).json(response);
      } catch (error) {
        console.error('Error in GET request:', {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch expenses',
          message: error.message,
          details: error.code
        });
      }
    }

    if (req.method === 'POST') {
      try {
        console.log('Handling POST request:', req.body);
        
        // Validate request body
        if (!req.body || !req.body.amount || !req.body.tag) {
          return res.status(400).json({
            success: false,
            error: 'Missing required fields',
            details: { received: req.body }
          });
        }

        // Get user ID from request
        const userId = req.body.userId || req.headers['x-user-id'];
        console.log('Adding expense for user:', userId);

        // Create new expense document
        const newExpense = {
          ...req.body,
          userId,
          amount: parseFloat(req.body.amount),
          date: new Date().toISOString(),
          createdAt: new Date()
        };

        // Insert into database
        const result = await expenses.insertOne(newExpense);
        console.log('Successfully added expense:', result.insertedId);

        // Return success response
        return res.status(201).json({
          success: true,
          data: { ...newExpense, _id: result.insertedId }
        });

      } catch (error) {
        console.error('Error in POST request:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to add expense',
          message: error.message,
          details: error.code
        });
      }
    }
    
    // Handle other methods...
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ 
      success: false,
      error: `Method ${req.method} Not Allowed` 
    });
    
  } catch (error) {
    console.error('Fatal error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      code: error.code || 'UNKNOWN'
    });
  }
} 