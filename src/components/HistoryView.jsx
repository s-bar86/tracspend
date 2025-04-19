import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const FILTER_OPTIONS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

export default function HistoryView({ entries = [], onEdit = () => {}, onDelete = () => {} }) {
  const [activeFilter, setActiveFilter] = useState(FILTER_OPTIONS.DAILY);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editTag, setEditTag] = useState('');

  const groupedEntries = useMemo(() => {
    if (!entries || entries.length === 0) {
      return { groups: {}, total: 0 };
    }

    const now = new Date();
    let startDate = new Date(now);

    switch (activeFilter) {
      case FILTER_OPTIONS.WEEKLY:
        startDate.setDate(now.getDate() - 7);
        break;
      case FILTER_OPTIONS.MONTHLY:
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    const filtered = entries.filter(entry => {
      if (!entry || !entry.date) return false;
      const entryDate = new Date(entry.date);
      return entryDate >= startDate;
    });

    const groups = filtered.reduce((acc, entry) => {
      if (!entry || !entry.date || !entry.amount) return acc;
      const date = new Date(entry.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = {
          entries: [],
          total: 0
        };
      }
      acc[date].entries.push(entry);
      acc[date].total += entry.amount;
      return acc;
    }, {});

    const total = filtered.reduce((sum, entry) => {
      if (!entry || !entry.amount) return sum;
      return sum + entry.amount;
    }, 0);

    return { groups, total };
  }, [entries, activeFilter]);

  const tagTotals = useMemo(() => {
    if (!entries || entries.length === 0) return {};
    
    const totals = {};
    entries.forEach(entry => {
      if (!entry || !entry.tag || !entry.amount) return;
      totals[entry.tag] = (totals[entry.tag] || 0) + entry.amount;
    });
    return totals;
  }, [entries]);

  const handleEditClick = (entry) => {
    setEditingEntry(entry);
    setEditAmount(entry.amount.toString());
    setEditTag(entry.tag);
  };

  const handleSaveEdit = () => {
    if (!editAmount || !editTag) return;
    
    onEdit(editingEntry.id, {
      amount: parseFloat(editAmount),
      tag: editTag
    });
    setEditingEntry(null);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const handleDeleteClick = (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex space-x-2 sm:space-x-4 bg-white rounded-lg p-2 shadow-sm">
        {Object.values(FILTER_OPTIONS).map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`relative overflow-hidden px-3 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.1)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_12px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-t before:opacity-50 ${
              activeFilter === filter
                ? 'bg-gradient-to-br from-primary/80 via-primary to-primary/90 text-white before:from-transparent before:to-white/10'
                : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 text-gray-600 hover:from-gray-100 hover:via-gray-200 hover:to-gray-100 before:from-transparent before:to-white/20'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold mb-2">
          Total Spend: ${groupedEntries.total.toFixed(2)}
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {Object.entries(tagTotals).map(([tag, amount]) => (
            <div
              key={tag}
              className="bg-gray-50 p-2 sm:p-3 rounded-lg flex justify-between items-center"
            >
              <span className="text-sm text-gray-600">{tag}</span>
              <span className="text-sm font-medium">${amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {Object.entries(groupedEntries.groups).map(([date, group]) => (
          <div key={date} className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2 sm:mb-3">
              <h3 className="text-sm sm:text-base font-medium">{date}</h3>
              <div className="text-sm sm:text-base font-medium">
                ${group.total.toFixed(2)}
              </div>
            </div>
            <div className="space-y-2">
              {group.entries.map(entry => (
                <div key={entry.id}>
                  {editingEntry?.id === entry.id ? (
                    <div className="flex flex-col space-y-2 p-2 bg-gray-50 rounded-lg">
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded"
                        placeholder="Amount"
                        step="0.01"
                      />
                      <input
                        type="text"
                        value={editTag}
                        onChange={(e) => setEditTag(e.target.value)}
                        className="w-full px-2 py-1 text-sm border rounded"
                        placeholder="Category"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          className="relative overflow-hidden px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-primary/80 via-primary to-primary/90 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.1)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_12px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-t before:from-transparent before:to-white/10 before:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="relative overflow-hidden px-3 py-1.5 text-xs rounded-lg bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 text-gray-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.1)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_12px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-t before:from-transparent before:to-white/20 before:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs sm:text-sm text-gray-600">{entry.tag}</span>
                        <span className="text-sm sm:text-base font-medium">
                          ${entry.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <motion.button
                          onClick={() => handleEditClick(entry)}
                          className="relative overflow-hidden px-2 py-1 text-xs sm:text-sm rounded-lg bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 text-blue-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.1)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_12px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-t before:from-transparent before:to-white/20 before:opacity-50"
                          whileTap={{ scale: 0.95 }}
                        >
                          Edit
                        </motion.button>
                        <motion.button
                          onClick={() => handleDeleteClick(entry.id)}
                          className="relative overflow-hidden px-2 py-1 text-xs sm:text-sm rounded-lg bg-gradient-to-br from-red-50 via-red-100 to-red-50 text-red-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.1)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_12px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-t before:from-transparent before:to-white/20 before:opacity-50"
                          whileTap={{ scale: 0.95 }}
                        >
                          Delete
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
