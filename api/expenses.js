import { getSession } from 'next-auth/react';
import clientPromise from '../src/lib/db';

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await clientPromise;
  const db = client.db('tracspend');
  const expenses = db.collection('expenses');

  try {
    switch (req.method) {
      case 'GET':
        const userExpenses = await expenses
          .find({ userId: session.user.id })
          .sort({ date: -1 })
          .toArray();
        res.json(userExpenses);
        break;

      case 'POST':
        const newExpense = {
          ...req.body,
          userId: session.user.id,
          createdAt: new Date(),
        };
        const result = await expenses.insertOne(newExpense);
        res.status(201).json(result);
        break;

      case 'PUT':
        const { id, ...updateData } = req.body;
        const updateResult = await expenses.updateOne(
          { _id: id, userId: session.user.id },
          { $set: updateData }
        );
        res.json(updateResult);
        break;

      case 'DELETE':
        const { id: deleteId } = req.query;
        const deleteResult = await expenses.deleteOne({
          _id: deleteId,
          userId: session.user.id,
        });
        res.json(deleteResult);
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 