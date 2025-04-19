const handler = async (req, res) => {
  const client = await clientPromise;
  const db = client.db('tracspend');
  const expenses = db.collection('expenses');

  try {
    switch (req.method) {
      case 'GET':
        const userExpenses = await expenses
          .find({})
          .sort({ date: -1 })
          .toArray();
        res.json(userExpenses);
        break;

      case 'POST':
        const newExpense = {
          ...req.body,
          createdAt: new Date(),
        };
        const result = await expenses.insertOne(newExpense);
        res.status(201).json(result);
        break;

      case 'PUT':
        const { id, ...updateData } = req.body;
        const updateResult = await expenses.updateOne(
          { _id: id },
          { $set: updateData }
        );
        res.json(updateResult);
        break;

      case 'DELETE':
        const { id: deleteId } = req.query;
        const deleteResult = await expenses.deleteOne({
          _id: deleteId
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

export default handler; 