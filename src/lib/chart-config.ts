// Chart.js configuration and setup
// Functional programming style

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
} from 'chart.js'

// Register Chart.js components
export const registerChartComponents = () => {
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
  )
}

// Default chart options
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        font: {
          family: "'Inter', 'Hiragino Sans', sans-serif",
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: {
        size: 14,
        weight: 'bold' as const,
      },
      bodyFont: {
        size: 13,
      },
      cornerRadius: 4,
    },
  },
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
}

// Color palette for charts
export const chartColors = {
  primary: 'rgb(59, 130, 246)', // blue-500
  secondary: 'rgb(168, 85, 247)', // purple-500
  success: 'rgb(34, 197, 94)', // green-500
  warning: 'rgb(251, 146, 60)', // orange-500
  danger: 'rgb(239, 68, 68)', // red-500
  info: 'rgb(14, 165, 233)', // sky-500
}

export const chartColorsArray = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.success,
  chartColors.warning,
  chartColors.danger,
  chartColors.info,
]

// Generate RGBA color with opacity
export const rgbaColor = (rgb: string, alpha: number): string => {
  return rgb.replace('rgb', 'rgba').replace(')', `, ${alpha})`)
}
