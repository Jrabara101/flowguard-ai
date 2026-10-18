import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const ProductChart = ({ products = [] }) => {

  const data = {
    labels: products.map(p => p.product_name.length > 18 ? p.product_name.substring(0, 16) + '...' : p.product_name),
    datasets: [
      {
        label: 'RTS Rate (%)',
        data: products.map(p => p.rts_rate),
        backgroundColor: '#D4AF37',
        borderColor: '#F5C542',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1C1F28',
        titleColor: '#FFFFFF',
        bodyColor: '#D4AF37',
        borderColor: '#2A303F',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: (items) => products[items[0].dataIndex].product_name,
          label: (context) => `RTS Rate: ${context.parsed.y}% (${products[context.dataIndex].rts_orders} failed out of ${products[context.dataIndex].total_orders})`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
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
      <Bar data={data} options={options} />
    </div>
  );
};
