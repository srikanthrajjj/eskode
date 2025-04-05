import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
    },
  },
};

const data = {
  labels: ['Patrol', 'Investigation', 'Community', 'Special Ops', 'Admin'],
  datasets: [
    {
      data: [35, 25, 20, 15, 5],
      backgroundColor: [
        'rgba(37, 99, 235, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(96, 165, 250, 0.8)',
        'rgba(147, 197, 253, 0.8)',
        'rgba(191, 219, 254, 0.8)',
      ],
      borderWidth: 1,
    },
  ],
};

export function ResourceChart() {
  return <Doughnut options={options} data={data} />;
}