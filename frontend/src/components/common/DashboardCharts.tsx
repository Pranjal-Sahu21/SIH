import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { motion } from 'framer-motion';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const DashboardCharts: React.FC = () => {
  // Chart.js Dark SIEM Global Options Defaults
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#a1a1aa',
          font: {
            family: "'General Sans', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
            size: 11,
          },
          boxWidth: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#09090b',
        titleColor: '#f4f4f5',
        bodyColor: '#e4e4e7',
        borderColor: '#27272a',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          color: '#18181b',
        },
        ticks: {
          color: '#71717a',
          font: {
            family: "'General Sans', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: '#18181b',
        },
        ticks: {
          color: '#71717a',
          font: {
            family: "'General Sans', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
            size: 10,
          },
        },
      },
    },
  };

  // Line Chart Data: Log Pipeline Throughput
  const lineChartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'],
    datasets: [
      {
        label: 'Deterministic Registry (0.12ms)',
        data: [1200, 1900, 3100, 5400, 4800, 6200, 7800],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
      {
        label: 'AI Model Inferred (12s)',
        data: [300, 450, 600, 850, 720, 940, 1100],
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
      },
      {
        label: 'Quarantine / Human Review',
        data: [40, 25, 60, 90, 45, 80, 55],
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.05)',
        fill: true,
        tension: 0.35,
        borderWidth: 1.5,
        pointRadius: 3,
      },
    ],
  };

  // Pie Chart Data: Log Severity Breakdown
  const pieChartData = {
    labels: ['Fatal (6)', 'Critical (5)', 'High (4)', 'Medium (3)', 'Low/Info (1-2)'],
    datasets: [
      {
        data: [4, 12, 28, 45, 110],
        backgroundColor: [
          '#a855f7', // Fatal
          '#f43f5e', // Critical
          '#f97316', // High
          '#f59e0b', // Medium
          '#06b6d4', // Low/Info
        ],
        borderColor: '#09090b',
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#a1a1aa',
          font: {
            family: "'General Sans', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif",
            size: 10,
          },
          boxWidth: 10,
          usePointStyle: true,
          padding: 12,
        },
      },
      tooltip: commonOptions.plugins.tooltip,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-4"
    >
      {/* 2 Cols: Ingestion Throughput Line Chart */}
      <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-lg p-4 sm:p-5 flex flex-col justify-between shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800 pb-3 mb-4 gap-2">
          <div>
            <h3 className="text-sm sm:text-base text-white tracking-wide font-sans">
              Log Pipeline Processing Throughput (24h)
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-sans leading-relaxed">
              Real-time events/sec parsed via Deterministic Registry vs AI Fallback Engine
            </p>
          </div>
          <span className="text-[10px] sm:text-[11px] font-sans px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 self-start sm:self-auto flex-shrink-0">
            99.98% Fast-Path Active
          </span>
        </div>

        <div className="h-56 sm:h-64 w-full">
          <Line data={lineChartData} options={commonOptions} />
        </div>
      </div>

      {/* 1 Col: Severity Distribution Pie Chart */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg p-4 sm:p-5 flex flex-col justify-between shadow-xl">
        <div className="border-b border-zinc-800 pb-3 mb-4">
          <h3 className="text-sm sm:text-base text-white tracking-wide font-sans">
            OCSF Event Severity Taxonomy
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-sans leading-relaxed">
            Normalized event risk level classification (199 total)
          </p>
        </div>

        <div className="h-56 sm:h-64 w-full relative flex items-center justify-center p-2">
          <Pie data={pieChartData} options={pieOptions} />
        </div>
      </div>
    </motion.div>
  );
};
