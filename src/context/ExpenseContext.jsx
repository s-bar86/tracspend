import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ExpenseContext = createContext();

// Get the base URL from the current window location
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/expenses`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch expenses: ${response.statusText}. ${errorText}`);
      }
      const result = await response.json();
      if (!result.success || !Array.isArray(result.data)) {
        throw new Error(result.error || 'Invalid data format received from server');
      }
      setExpenses(result.data);
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
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add expense: ${response.statusText}. ${errorText}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to add expense');
      }
      const newExpense = result.data;
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
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/expenses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updateData }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update expense: ${response.statusText}. ${errorText}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update expense');
      }
      const updatedExpense = result.data;
      setExpenses(prev => 
        prev.map(expense => 
          expense._id === id ? updatedExpense : expense
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
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/expenses?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete expense: ${response.statusText}. ${errorText}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete expense');
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