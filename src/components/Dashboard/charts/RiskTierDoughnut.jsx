import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { C, tooltip, legendLabels } from './theme';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export const RiskTierDoughnut = ({ counts = { LOW: 0, MEDIUM: 0, HIGH: 0 }, label = 'Orders Scored' }) => {
  const total = counts.LOW + counts.MEDIUM + counts.HIGH;
  const data = {
    labels: ['Low Risk (Ship Now)', 'Medium Risk (Confirm First)', 'High Risk (Hold)'],
    datasets: [
      {
        data: [counts.LOW, counts.MEDIUM, counts.HIGH],
        backgroundColor: [
          C.low, // green
          C.medium, // amber
          C.high  // red
        ],
        borderColor: '#FFFFFF',
        borderWidth: 3,
        hoverOffset: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: legendLabels
      },
      tooltip: {
        ...tooltip,
        callbacks: {
          label: (context) => ` ${context.label}: ${context.parsed} orders (${total ? Math.round(context.parsed / total * 100) : 0}%)`
        }
      }
    },
    cutout: '70%'
  };

  return (
    <div className="h-64 w-full relative flex items-center justify-center">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
        <span className="text-2xl font-heading font-medium text-ink">{total.toLocaleString()}</span>
        <span className="text-xs text-muted">{label}</span>
      </div>
    </div>
  );
};
