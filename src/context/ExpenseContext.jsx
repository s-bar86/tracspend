import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Listen for Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Helper to get ID token for current user
  const getIdToken = async () => {
    if (!user) throw new Error('Not authenticated');
    return user.getIdToken();
  };

  const fetchExpenses = useCallback(async () => {
    if (checkingAuth || !user) return; // Block until auth is ready
    setLoading(true);
    setError(null);
    try {
      const baseUrl = getBaseUrl();
      const token = await getIdToken();
      const url = `${baseUrl}/api/expenses`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch expenses: ${response.statusText}`);
      }
      const result = await response.json();
      if (!result.success || !Array.isArray(result.data)) {
        throw new Error(result.error || 'Invalid data format received from server');
      }
      setExpenses(result.data);
    } catch (err) {
      setError(err.message || 'An unknown error occurred');
      setExpenses([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch expenses when the user is authenticated
  useEffect(() => {
    if (!checkingAuth && user) {
      fetchExpenses();
    } else if (!checkingAuth && !user) {
      setExpenses([]);
    }
  }, [fetchExpenses, user, checkingAuth]);

  const addExpense = async (expenseData) => {
    if (checkingAuth || !user) return;
    if (!expenseData || !expenseData.amount || !expenseData.tag) {
      throw new Error('Invalid expense data');
    }
    setLoading(true);
    setError(null);
    try {
      const baseUrl = getBaseUrl();
      const token = await getIdToken();
      const response = await fetch(`${baseUrl}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(expenseData),
      });
      if (!response.ok) {
        throw new Error(`Failed to add expense: ${response.statusText}`);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to add expense');
      }
      setExpenses(prev => [result.data, ...prev]);
      // Always fetch canonical data from server after mutation
      await fetchExpenses();
      return result.data;
    } catch (err) {
      setError(err.message || 'An unknown error occurred while adding expense');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async (id, updateData) => {
    if (checkingAuth || !user) return;
    if (!id || !updateData) {
      throw new Error('Invalid update data');
    }
    setLoading(true);
    setError(null);
    const originalExpenses = [...expenses];
    try {
      const baseUrl = getBaseUrl();
      const token = await getIdToken();
      setExpenses(prev => prev.map(expense => expense._id === id ? { ...expense, ...updateData } : expense));
      const response = await fetch(`${baseUrl}/api/expenses`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id, ...updateData }),
      });
      if (!response.ok) {
        setExpenses(originalExpenses);
        throw new Error('Failed to update expense');
      }
      const result = await response.json();
      if (!result.success) {
        setExpenses(originalExpenses);
        throw new Error(result.error || 'Failed to update expense');
      }
      setExpenses(prev => prev.map(expense => expense._id === id ? result.data : expense));
      // Always fetch canonical data from server after mutation
      await fetchExpenses();
      return result.data;
    } catch (err) {
      setError('Unable to update expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id) => {
    if (checkingAuth || !user) return;
    if (!id) {
      setError('Invalid expense ID');
      return;
    }
    setLoading(true);
    setError(null);
    const originalExpenses = [...expenses];
    try {
      const baseUrl = getBaseUrl();
      const token = await getIdToken();
      setExpenses(prev => prev.filter(expense => expense._id !== id));
      // Always fetch canonical data from server after mutation
      await fetchExpenses();
      const response = await fetch(`${baseUrl}/api/expenses?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      let result;
      try {
        result = await response.json();
      } catch {
        setExpenses(originalExpenses);
        setError('Server response error');
        return;
      }
      if (!response.ok || !result.success) {
        setExpenses(originalExpenses);
        setError(result.error || 'Unable to delete expense');
        return;
      }
      setError(null);
    } catch (err) {
      setExpenses(originalExpenses);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset all data for the current user
  const resetData = async () => {
    if (checkingAuth || !user) return;
    setLoading(true);
    setError(null);
    try {
      const baseUrl = getBaseUrl();
      const token = await getIdToken();
      const response = await fetch(`${baseUrl}/api/expenses/reset`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to reset data');
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to reset data');
      }
      setExpenses([]);
    } catch (err) {
      setError('Unable to reset data. Please try again.');
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
        resetData,
        user,
        checkingAuth,
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