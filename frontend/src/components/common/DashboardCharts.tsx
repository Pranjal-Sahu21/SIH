import React, { Component, useState, useEffect } from 'react';
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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ChartErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Chart.js Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 text-center">
          <p className="text-zinc-400 font-mono text-xs">Chart visualization unavailable in this browser session.</p>
        </Card>
      );
    }
    return this.props.children;
  }
}

const DashboardChartsContent: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#a1a1aa',
          font: {
            family: "system-ui, -apple-system, sans-serif",
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
            family: "system-ui, -apple-system, sans-serif",
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
            family: "system-ui, -apple-system, sans-serif",
            size: 10,
          },
        },
      },
    },
  };

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

  const pieChartData = {
    labels: ['Fatal (6)', 'Critical (5)', 'High (4)', 'Medium (3)', 'Low/Info (1-2)'],
    datasets: [
      {
        data: [4, 12, 28, 45, 110],
        backgroundColor: [
          '#a855f7',
          '#f43f5e',
          '#f97316',
          '#f59e0b',
          '#06b6d4',
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
            family: "system-ui, -apple-system, sans-serif",
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
      <Card className="lg:col-span-2 p-4 sm:p-5 flex flex-col justify-between shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800 pb-3 mb-4 gap-2">
          <div>
            <h3 className="text-sm sm:text-base text-white tracking-wide font-sans">
              Log Pipeline Processing Throughput (24h)
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-sans leading-relaxed">
              Real-time events/sec parsed via Deterministic Registry vs AI Fallback Engine
            </p>
          </div>
          <Badge variant="success" className="self-start sm:self-auto">
            99.98% Fast-Path Active
          </Badge>
        </div>

        <div className="h-56 sm:h-64 w-full relative">
          <Line data={lineChartData} options={commonOptions} redraw={true} />
        </div>
      </Card>

      <Card className="p-4 sm:p-5 flex flex-col justify-between shadow-xl">
        <div className="border-b border-zinc-800 pb-3 mb-4">
          <h3 className="text-sm sm:text-base text-white tracking-wide font-sans">
            OCSF Event Severity Taxonomy
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-sans leading-relaxed">
            Normalized event risk level classification (199 total)
          </p>
        </div>

        <div className="h-56 sm:h-64 w-full relative flex items-center justify-center p-2">
          <Pie data={pieChartData} options={pieOptions} redraw={true} />
        </div>
      </Card>
    </motion.div>
  );
};

export const DashboardCharts: React.FC = () => (
  <ChartErrorBoundary>
    <DashboardChartsContent />
  </ChartErrorBoundary>
);
