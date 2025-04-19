import { useState } from 'react';
import InputForm from './components/InputForm';
import HistoryView from './components/HistoryView';
import SpendingChart from './components/SpendingChart';
import ErrorBoundary from './components/ErrorBoundary';
import { useExpenses } from './context/ExpenseContext';
import logo from './assets/logo.svg';

function App() {
  const { expenses, loading: expensesLoading, error } = useExpenses();
  const [isStarted, setIsStarted] = useState(false);

  if (!isStarted) {
    return (
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
            className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
          >
            Enter TracSpend
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tracspendBg">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 py-3 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 sm:w-10">
              <img src={logo} alt="TracSpend Logo" className="h-7 sm:h-9 object-contain" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary">TracSpend</h1>
          </div>
          <button
            onClick={() => setIsStarted(false)}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            Exit
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
          <div className="space-y-6 sm:space-y-8">
            <ErrorBoundary>
              <section>
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Add New Expense</h2>
                <InputForm />
              </section>
            </ErrorBoundary>

            <ErrorBoundary>
              <section className="hidden sm:block">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Spending Distribution</h2>
                {expensesLoading ? (
                  <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
                ) : (
                  <SpendingChart expenses={expenses} />
                )}
              </section>
            </ErrorBoundary>
          </div>

          <ErrorBoundary>
            <section>
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Spending History</h2>
              {expensesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
                  ))}
                </div>
              ) : (
                <HistoryView expenses={expenses} />
              )}
            </section>
          </ErrorBoundary>

          <ErrorBoundary>
            <section className="block sm:hidden">
              <h2 className="text-lg font-semibold mb-3">Spending Distribution</h2>
              {expensesLoading ? (
                <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
              ) : (
                <SpendingChart expenses={expenses} />
              )}
            </section>
          </ErrorBoundary>
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
    </div>
  );
}

export default App;
