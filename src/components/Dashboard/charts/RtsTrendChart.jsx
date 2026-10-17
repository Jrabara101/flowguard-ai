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
import { C, tooltip, legendLabels } from './theme';

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
      borderColor: C.high,
      backgroundColor: 'rgba(255, 91, 92, 0.10)',
      borderWidth: 3,
      pointRadius: 4,
      pointBackgroundColor: C.high,
      fill: true,
      tension: 0.3
    }
  ];
  if (shippedRate !== null) {
    datasets.push({
      label: 'Backtest: orders FlowGuard would ship',
      data: weekly.map(() => shippedRate),
      borderColor: C.low,
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
        labels: legendLabels
      },
      tooltip: {
        ...tooltip,
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}%`
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: C.grid
        },
        ticks: {
          color: C.tick,
          font: {
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: C.grid
        },
        ticks: {
          color: C.tick,
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
