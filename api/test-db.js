import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  const uri = process.env.MONGODB_URI;
  
  // Log connection attempt (without sensitive data)
  console.log('Test endpoint called', {
    hasUri: !!uri,
    uriLength: uri ? uri.length : 0,
    method: req.method,
    headers: req.headers
  });

  if (!uri) {
    return res.status(500).json({
      success: false,
      error: 'MONGODB_URI is not configured'
    });
  }

  try {
    const client = await MongoClient.connect(uri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });

    const db = client.db();
    
    // Test the connection
    await db.command({ ping: 1 });
    
    await client.close();

    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      database: db.databaseName
    });
    
  } catch (error) {
    console.error('Database test failed:', {
      name: error.name,
      message: error.message,
      code: error.code
    });

    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: {
        name: error.name,
        message: error.message,
        code: error.code
      }
    });
  }
} 