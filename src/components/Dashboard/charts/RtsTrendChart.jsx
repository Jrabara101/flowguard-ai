import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Actual weekly RTS rate of past orders, with the backtest result drawn as a flat reference line:
// the RTS rate of the orders FlowGuard would have shipped straight away (LOW and MEDIUM).
export const RtsTrendChart = ({ weekly = [], shippedRate = null }) => {
  const fmt = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

  const datasets = [
    {
      label: 'Actual RTS rate (all orders shipped)',
      data: weekly.map(w => w.rts_rate),
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderWidth: 3,
      pointRadius: 4,
      pointBackgroundColor: '#EF4444',
      fill: true,
      tension: 0.3
    }
  ];
  if (shippedRate !== null) {
    datasets.push({
      label: 'Backtest: orders FlowGuard would ship',
      data: weekly.map(() => shippedRate),
      borderColor: '#10B981',
      backgroundColor: 'transparent',
      borderDash: [6, 4],
      borderWidth: 2,
      pointRadius: 0,
      tension: 0
    });
  }

  const data = { labels: weekly.map(w => `Wk of ${fmt(w.week_start)}`), datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#CBD2E1',
          font: {
            size: 11
          },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: '#1C1F28',
        titleColor: '#FFFFFF',
        bodyColor: '#D4AF37',
        borderColor: '#2A303F',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: '#242832'
        },
        ticks: {
          color: '#8E98B0',
          font: {
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: '#242832'
        },
        ticks: {
          color: '#8E98B0',
          callback: (val) => `${val}%`
        },
        beginAtZero: true
      }
    }
  };

  return (
    <div className="h-64 w-full">
      <Line data={data} options={options} />
    </div>
  );
};
