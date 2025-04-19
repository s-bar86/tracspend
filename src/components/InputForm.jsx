import { useState } from 'react';
import { motion } from 'framer-motion';

const PRESET_TAGS = [
  'Food', 'Gas', 'Emergency Repair', 'Auto', 'Home', 'Leisure',
  'Bills', 'Groceries', 'Entertainment', 'Health'
];

// Get the current user ID (you'll need to implement your own user management)
const getCurrentUserId = () => {
  // For now, we'll use a mock user ID. Replace this with your actual user management
  return localStorage.getItem('userId') || 'default-user';
};

export default function InputForm({ onSave = () => {} }) {
  const [amount, setAmount] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [isCustomTag, setIsCustomTag] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission started', { amount, selectedTag, customTag, isCustomTag });
    
    if (!amount || !(selectedTag || customTag)) {
      console.log('Form validation failed', { amount, selectedTag, customTag });
      return;
    }

    try {
      setIsSubmitting(true);
      const userId = getCurrentUserId();
      const entry = {
        userId,
        amount: parseFloat(amount),
        tag: isCustomTag ? customTag : selectedTag,
        date: new Date().toISOString()
      };

      console.log('Submitting expense:', entry);
      await onSave(entry);
      console.log('Expense saved successfully');
      
      // Reset form
      setAmount('');
      setSelectedTag('');
      setCustomTag('');
      setIsCustomTag(false);
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagChange = (e) => {
    const value = e.target.value;
    console.log('Tag changed:', value);
    if (value === 'custom') {
      setIsCustomTag(true);
      setSelectedTag('');
    } else {
      setIsCustomTag(false);
      setSelectedTag(value);
    }
  };

  // Debug current form state
  console.log('Current form state:', {
    amount,
    selectedTag,
    customTag,
    isCustomTag,
    isSubmitting,
    isValid: Boolean(amount && (selectedTag || customTag))
  });

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4 sm:space-y-5 w-full max-w-md p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <label htmlFor="amount" className="block text-sm sm:text-base font-medium text-gray-700">
          Amount ($)
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => {
            console.log('Amount changed:', e.target.value);
            setAmount(e.target.value);
          }}
          step="0.01"
          min="0"
          required
          className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow duration-200 focus:shadow-lg outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
          placeholder="0.00"
          aria-label="Enter spend amount"
        />
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <label className="block text-sm sm:text-base font-medium text-gray-700">Category</label>
        {!isCustomTag ? (
          <select
            id="tag"
            value={selectedTag}
            onChange={handleTagChange}
            required={!isCustomTag}
            className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow duration-200 focus:shadow-lg outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Select a category</option>
            {PRESET_TAGS.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
            <option value="custom">+ Add custom category</option>
          </select>
        ) : (
          <input
            type="text"
            id="customTag"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            required={isCustomTag}
            className="w-full p-2.5 sm:p-3 text-sm sm:text-base border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow duration-200 focus:shadow-lg outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
            placeholder="Enter custom category"
            aria-label="Enter custom category"
          />
        )}
      </div>

      <div className="space-y-1.5 sm:space-y-2 flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting || !amount || !(selectedTag || customTag)}
          className="w-full relative overflow-hidden bg-gradient-to-br from-primary/80 via-primary to-primary/90 text-white py-2 sm:py-2.5 px-4 sm:px-5 text-sm sm:text-base rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.1)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_12px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-t before:from-transparent before:to-white/10 before:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
        {isCustomTag && (
          <button
            type="button"
            onClick={() => {
              console.log('Canceling custom tag');
              setIsCustomTag(false);
              setCustomTag('');
            }}
            className="w-full relative overflow-hidden bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 text-gray-700 py-2 sm:py-2.5 px-4 sm:px-5 text-sm sm:text-base rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.1)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_12px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transform hover:-translate-y-0.5 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-t before:from-transparent before:to-white/20 before:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </motion.form>
  );
}
