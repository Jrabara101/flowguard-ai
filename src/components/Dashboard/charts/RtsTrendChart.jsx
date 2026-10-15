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
import { DASHBOARD_STATS } from '../../../data/mockData';

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

export const RtsTrendChart = () => {
  const trend = DASHBOARD_STATS.weekly_rts_trend;

  const data = {
    labels: trend.labels,
    datasets: [
      {
        label: 'Baseline RTS Rate (Without FlowGuard)',
        data: trend.baseline,
        borderColor: '#8E98B0',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#8E98B0',
        tension: 0.3
      },
      {
        label: 'With FlowGuard AI Protection',
        data: trend.with_flowguard,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: '#10B981',
        fill: true,
        tension: 0.3
      }
    ]
  };

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
        min: 6,
        max: 20
      }
    }
  };

  return (
    <div className="h-64 w-full">
      <Line data={data} options={options} />
    </div>
  );
};
