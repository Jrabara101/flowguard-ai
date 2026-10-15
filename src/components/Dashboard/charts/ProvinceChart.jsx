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
import { COPILOT_KNOWLEDGE } from '../../../data/mockData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const ProvinceChart = () => {
  const regions = COPILOT_KNOWLEDGE.get_region_trends;

  const data = {
    labels: regions.map(r => r.province),
    datasets: [
      {
        label: 'RTS Rate (%)',
        data: regions.map(r => r.rts_rate),
        backgroundColor: regions.map(r => 
          r.rts_rate >= 14 ? 'rgba(239, 68, 68, 0.8)' : 
          r.rts_rate >= 10 ? 'rgba(245, 158, 11, 0.8)' : 
          'rgba(16, 185, 129, 0.8)'
        ),
        borderColor: regions.map(r => 
          r.rts_rate >= 14 ? '#EF4444' : 
          r.rts_rate >= 10 ? '#F59E0B' : 
          '#10B981'
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
        backgroundColor: '#1C1F28',
        titleColor: '#FFFFFF',
        bodyColor: '#D4AF37',
        borderColor: '#2A303F',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => `RTS Rate: ${context.parsed.x}% (${regions[context.dataIndex].rts_orders} / ${regions[context.dataIndex].total_orders} orders)`
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
          callback: (val) => `${val}%`
        },
        max: 20
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: '#FFFFFF',
          font: {
            weight: '600'
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
