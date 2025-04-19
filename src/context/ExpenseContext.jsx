import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ExpenseContext = createContext();

// Get the base URL from the current window location
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // In production, use the current origin
    const origin = window.location.origin;
    console.log('Current origin:', origin);
    return origin;
  }
  console.warn('Window is not defined, falling back to empty string');
  return '';
};

// Get or create a persistent user ID
const getUserId = () => {
  if (typeof window !== 'undefined') {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      // Generate a random user ID if none exists
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
      console.log('Created new user ID:', userId);
    } else {
      console.log('Using existing user ID:', userId);
    }
    return userId;
  }
  return 'default-user';
};

export function ExpenseProvider({ children }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId] = useState(getUserId); // Initialize userId once when component mounts

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = getBaseUrl();
      const url = `${baseUrl}/api/expenses?userId=${encodeURIComponent(userId)}`;
      console.log('Fetching expenses from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch response not OK:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Failed to fetch expenses: ${response.statusText}. ${errorText}`);
      }

      const result = await response.json();
      console.log('Fetch result:', result);
      
      if (!result.success || !Array.isArray(result.data)) {
        console.error('Invalid response format:', result);
        throw new Error(result.error || 'Invalid data format received from server');
      }
      
      setExpenses(result.data);
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred';
      console.error('Error fetching expenses:', {
        message: errorMessage,
        error: err
      });
      setError(errorMessage);
      setExpenses([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch expenses when the component mounts or userId changes
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses, userId]);

  const addExpense = async (expenseData) => {
    console.log('Adding expense:', expenseData);
    
    if (!expenseData || !expenseData.amount || !expenseData.tag) {
      const error = new Error('Invalid expense data');
      console.error('Validation failed:', { expenseData, error });
      throw error;
    }

    setLoading(true);
    setError(null);
    
    try {
      const baseUrl = getBaseUrl();
      console.log('Sending POST request to:', `${baseUrl}/api/expenses`);
      
      // Add userId to the expense data
      const expenseWithUser = {
        ...expenseData,
        userId // Use the userId from state
      };
      
      const response = await fetch(`${baseUrl}/api/expenses`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(expenseWithUser),
      });

      console.log('POST response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('POST response not OK:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Failed to add expense: ${response.statusText}. ${errorText}`);
      }

      const result = await response.json();
      console.log('POST result:', result);
      
      if (!result.success) {
        console.error('Server reported failure:', result);
        throw new Error(result.error || 'Failed to add expense');
      }

      const newExpense = result.data;
      console.log('Successfully added expense:', newExpense);
      
      setExpenses(prev => [newExpense, ...prev]);
      return newExpense;
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred while adding expense';
      console.error('Error adding expense:', {
        message: errorMessage,
        error: err,
        expenseData
      });
      setError(errorMessage);
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
      console.log('Sending PUT request to:', `${baseUrl}/api/expenses`, {
        id,
        ...updateData
      });

      const response = await fetch(`${baseUrl}/api/expenses`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ id, ...updateData }),
      });

      console.log('PUT response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PUT response not OK:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Failed to update expense: ${response.statusText}. ${errorText}`);
      }

      const result = await response.json();
      console.log('PUT result:', result);
      
      if (!result.success) {
        console.error('Server reported failure:', result);
        throw new Error(result.error || 'Failed to update expense');
      }

      const updatedExpense = result.data;
      console.log('Successfully updated expense:', updatedExpense);
      
      // Update the expenses state immediately
      setExpenses(prev => 
        prev.map(expense => 
          expense._id === id ? updatedExpense : expense
        )
      );

      // Refresh the expenses list to ensure we have the latest data
      await fetchExpenses();

      return updatedExpense;
    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred while updating expense';
      console.error('Error updating expense:', {
        message: errorMessage,
        error: err,
        id,
        updateData
      });
      setError(errorMessage);
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
      console.log('Sending DELETE request for expense:', {
        id,
        url: `${baseUrl}/api/expenses?id=${id}`
      });

      // Update the expenses state immediately (optimistic update)
      setExpenses(prev => prev.filter(expense => expense._id !== id));

      const response = await fetch(`${baseUrl}/api/expenses?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('DELETE response status:', {
        status: response.status,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('DELETE response not OK:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        
        // Revert the optimistic update
        await fetchExpenses();
        
        throw new Error(`Failed to delete expense: ${response.statusText}. ${errorText}`);
      }

      const result = await response.json();
      console.log('DELETE result:', result);
      
      if (!result.success) {
        console.error('Server reported failure:', result);
        
        // Revert the optimistic update
        await fetchExpenses();
        
        throw new Error(result.error || 'Failed to delete expense');
      }

      console.log('Successfully deleted expense:', {
        id,
        result
      });

      // Wait a short moment before refreshing to ensure the delete has propagated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh the expenses list to ensure we have the latest data
      await fetchExpenses();

    } catch (err) {
      const errorMessage = err.message || 'An unknown error occurred while deleting expense';
      console.error('Error deleting expense:', {
        message: errorMessage,
        error: err,
        id
      });
      setError(errorMessage);
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