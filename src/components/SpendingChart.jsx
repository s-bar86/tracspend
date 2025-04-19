import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const CHART_COLORS = [
  '#4ECDC4', // accentTeal
  '#FF6B6B', // accentRed
  '#95E1D3',
  '#EAAFC8',
  '#A8E6CF',
  '#FFB6B9',
  '#B8F2E6',
  '#FFA07A',
  '#E2D1F9',
  '#FFE5D9'
];

const DEFAULT_DATA = {
  labels: ['No Data'],
  datasets: [{
    data: [100],
    backgroundColor: ['#E5E7EB'],
    borderColor: ['#FFFFFF'],
    borderWidth: 2,
  }]
};

export default function SpendingChart({ entries = [] }) {
  const chartData = useMemo(() => {
    if (!entries || entries.length === 0) {
      return DEFAULT_DATA;
    }

    const tagTotals = {};
    let total = 0;

    entries.forEach(entry => {
      if (entry && entry.tag && entry.amount) {
        tagTotals[entry.tag] = (tagTotals[entry.tag] || 0) + entry.amount;
        total += entry.amount;
      }
    });

    const sortedTags = Object.entries(tagTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Show top 10 categories

    if (sortedTags.length === 0) {
      return DEFAULT_DATA;
    }

    return {
      labels: sortedTags.map(([tag]) => tag),
      datasets: [
        {
          data: sortedTags.map(([, amount]) => ((amount / total) * 100).toFixed(1)),
          backgroundColor: CHART_COLORS.slice(0, sortedTags.length),
          borderColor: Array(sortedTags.length).fill('#FFFFFF'),
          borderWidth: 2,
        },
      ],
    };
  }, [entries]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12
          },
          padding: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}%`
        }
      }
    },
    maintainAspectRatio: false
  };

  return (
    <div className="w-full aspect-[4/3] sm:aspect-square max-w-md mx-auto">
      <Pie data={chartData} options={{
        ...options,
        plugins: {
          ...options.plugins,
          legend: {
            ...options.plugins.legend,
            labels: {
              ...options.plugins.legend.labels,
              font: {
                size: window.innerWidth < 640 ? 10 : 12
              }
            }
          }
        }
      }} />
    </div>
  );
}
