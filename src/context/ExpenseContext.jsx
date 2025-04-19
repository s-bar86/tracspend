import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ExpenseContext = createContext();

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/expenses');
      if (!response.ok) {
        throw new Error(`Failed to fetch expenses: ${response.statusText}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received from server');
      }
      setExpenses(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching expenses:', err);
      setExpenses([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch expenses when the component mounts
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async (expenseData) => {
    if (!expenseData || !expenseData.amount || !expenseData.tag) {
      throw new Error('Invalid expense data');
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });
      if (!response.ok) {
        throw new Error(`Failed to add expense: ${response.statusText}`);
      }
      const newExpense = await response.json();
      setExpenses(prev => [newExpense, ...prev]);
      return newExpense;
    } catch (err) {
      setError(err.message);
      console.error('Error adding expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async (id, updateData) => {
    if (!id || !updateData) {
      throw new Error('Invalid update data');
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updateData }),
      });
      if (!response.ok) {
        throw new Error(`Failed to update expense: ${response.statusText}`);
      }
      const updatedExpense = await response.json();
      setExpenses(prev => 
        prev.map(expense => 
          expense._id === id ? { ...expense, ...updateData } : expense
        )
      );
      return updatedExpense;
    } catch (err) {
      setError(err.message);
      console.error('Error updating expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id) => {
    if (!id) {
      throw new Error('Invalid expense ID');
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Failed to delete expense: ${response.statusText}`);
      }
      setExpenses(prev => prev.filter(expense => expense._id !== id));
    } catch (err) {
      setError(err.message);
      console.error('Error deleting expense:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        loading,
        error,
        fetchExpenses,
        addExpense,
        updateExpense,
        deleteExpense,
      }}
    >
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
} 