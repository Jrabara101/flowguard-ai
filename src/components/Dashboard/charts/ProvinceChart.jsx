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
import { C, tooltip, legendLabels } from './theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Route = city and province of the delivery address: this is courier performance on a route, not a trait of the buyers there.
export const ProvinceChart = ({ regions = [], average = 0 }) => {

  const data = {
    labels: regions.map(r => [r.city, r.province].filter(Boolean).join(', ')),
    datasets: [
      {
        label: 'RTS Rate (%)',
        data: regions.map(r => r.rts_rate),
        backgroundColor: regions.map(r => 
          r.rts_rate >= average * 1.2 ? 'rgba(255, 91, 92, 0.85)' : 
          r.rts_rate >= average ? 'rgba(253, 172, 65, 0.85)' : 
          'rgba(57, 218, 138, 0.85)'
        ),
        borderColor: regions.map(r => 
          r.rts_rate >= average * 1.2 ? C.high : 
          r.rts_rate >= average ? C.medium : 
          C.low
        ),
        borderWidth: 1.5,
        borderRadius: 8,
      }
    ]
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        ...tooltip,
        callbacks: {
          label: (context) => `RTS Rate: ${context.parsed.x}% (${regions[context.dataIndex].rts_orders} / ${regions[context.dataIndex].total_orders} orders)`
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
          callback: (val) => `${val}%`
        },
        beginAtZero: true
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: C.label,
          font: {
            weight: '500'
          }
        }
      }
    }
  };

  return (
    <div className="h-64 w-full">
      <Bar data={data} options={options} />
    </div>
  );
};
