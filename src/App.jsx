import { useState, useEffect } from 'react';
import InputForm from './components/InputForm';
import HistoryView from './components/HistoryView';
import SpendingChart from './components/SpendingChart';
import LoginButton from './components/LoginButton';
import { useAuth } from './context/AuthContext';
import logo from './assets/logo.svg';

function App() {
  const { user, loading } = useAuth();
  const [isStarted, setIsStarted] = useState(() => {
    // If user is already logged in, start automatically
    const savedUser = localStorage.getItem('user');
    return savedUser ? true : false;
  });
  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem('tracspend-entries');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('tracspend-entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    // When user logs in, automatically start the app
    if (user) {
      setIsStarted(true);
    }
  }, [user]);

  const handleSave = (entry) => {
    setEntries(prev => [entry, ...prev]);
  };

  const handleEdit = (id, updatedEntry) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updatedEntry } : entry
    ));
  };

  const handleDelete = (id) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      setEntries([]);
      localStorage.removeItem('tracspend-entries');
    }
  };

  // Always render the same component tree, use conditional rendering inside JSX
  return (
    <div className="min-h-screen bg-tracspendBg">
      {loading ? (
        <div className="min-h-screen bg-tracspendBg flex items-center justify-center">
          <div className="text-2xl font-semibold">Loading...</div>
        </div>
      ) : !user ? (
        <div className="min-h-screen bg-tracspendBg flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-6 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold">
              Track Spending with Confidence
            </h1>
            <p className="text-lg md:text-xl text-gray-700">
              A simple, beautiful way to track your daily expenses.
              Keep your spending in check with smart categorization and insightful visualizations.
            </p>
            <LoginButton />
          </div>
        </div>
      ) : !isStarted ? (
        <div className="min-h-screen bg-tracspendBg flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-6 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold">
              Track Spending with Confidence
            </h1>
            <p className="text-lg md:text-xl text-gray-700">
              A simple, beautiful way to track your daily expenses.
              Keep your spending in check with smart categorization and insightful visualizations.
            </p>
            <button
              onClick={() => setIsStarted(true)}
              className="btn btn-primary text-lg"
            >
              Start using TracSpend
            </button>
          </div>
        </div>
      ) : (
        <>
          <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-3 py-3 sm:px-6 lg:px-8 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 sm:w-10">
                  <img src={logo} alt="TracSpend Logo" className="h-7 sm:h-9 object-contain" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-primary">TracSpend</h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleReset}
                  className="text-sm px-2 py-1 text-red-600 hover:text-red-800 transition-colors"
                  aria-label="Reset all data"
                >
                  Reset All
                </button>
                <LoginButton />
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
              <div className="space-y-6 sm:space-y-8">
                <section>
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Add New Expense</h2>
                  <InputForm onSave={handleSave} />
                </section>

                <section className="hidden sm:block">
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Spending Distribution</h2>
                  <SpendingChart entries={entries} />
                </section>
              </div>

              <section>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Spending History</h2>
                <HistoryView 
                  entries={entries} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </section>
              <section className="block sm:hidden">
                <h2 className="text-lg font-semibold mb-3">Spending Distribution</h2>
                <SpendingChart entries={entries} />
              </section>
            </div>
          </main>

          <footer className="bg-primary text-white mt-12">
            <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
                <div className="col-span-2">
                  <h3 className="text-lg font-semibold mb-4">TracSpend</h3>
                  <p className="text-primary-light/90">Track your spending with confidence.</p>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Product</h4>
                  <ul className="space-y-2 text-primary-light/90">
                    <li>Features</li>
                    <li>Use Cases</li>
                    <li>Docs</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Company</h4>
                  <ul className="space-y-2 text-primary-light/90">
                    <li>About</li>
                    <li>Blog</li>
                    <li>Careers</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Community</h4>
                  <ul className="space-y-2 text-primary-light/90">
                    <li>Twitter</li>
                    <li>Discord</li>
                    <li>GitHub</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Legal</h4>
                  <ul className="space-y-2 text-primary-light/90">
                    <li>Privacy</li>
                    <li>Terms</li>
                    <li>Cookies</li>
                  </ul>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;
