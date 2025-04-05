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

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
};

const officers = [
  'DC Morgan',
  'DS Thompson',
  'DC Chen',
  'DC Patel',
  'DCI Rodriguez'
];

const data = {
  labels: officers,
  datasets: [
    {
      label: 'Cases Solved',
      data: [65, 59, 80, 81, 56],
      backgroundColor: 'rgba(37, 99, 235, 0.8)',
    },
    {
      label: 'Active Cases',
      data: [28, 32, 25, 29, 35],
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
    },
  ],
};

export function PerformanceChart() {
  return <Bar options={options} data={data} />;
}