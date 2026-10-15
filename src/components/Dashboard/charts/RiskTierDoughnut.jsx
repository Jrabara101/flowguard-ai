import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

export const RiskTierDoughnut = () => {
  const data = {
    labels: ['Low Risk (Ship Now)', 'Medium Risk (Confirm First)', 'High Risk (Hold)'],
    datasets: [
      {
        data: [68, 21, 11],
        backgroundColor: [
          '#10B981', // green
          '#F59E0B', // amber
          '#EF4444'  // red
        ],
        borderColor: '#121316',
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
          label: (context) => ` ${context.label}: ${context.parsed}% of orders`
        }
      }
    },
    cutout: '70%'
  };

  return (
    <div className="h-64 w-full relative flex items-center justify-center">
      <Doughnut data={data} options={options} />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
        <span className="text-2xl font-heading font-extrabold text-white">1,250</span>
        <span className="text-[10px] text-charcoal-400 font-medium">Orders Scored</span>
      </div>
    </div>
  );
};
