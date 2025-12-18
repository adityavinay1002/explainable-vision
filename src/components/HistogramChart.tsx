import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { HistogramData, normalizeHistogram } from '../utils/histogram';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HistogramChartProps {
  histData: HistogramData;
  title: string;
}

export function HistogramChart({ histData, title }: HistogramChartProps) {
  const labels = Array.from({ length: 256 }, (_, i) => i.toString());

  const datasets = [];

  if (histData.gray) {
    datasets.push({
      label: 'Intensity',
      data: normalizeHistogram(histData.gray),
      borderColor: 'rgb(75, 75, 75)',
      backgroundColor: 'rgba(75, 75, 75, 0.2)',
      borderWidth: 1,
      pointRadius: 0,
    });
  } else {
    if (histData.red) {
      datasets.push({
        label: 'Red',
        data: normalizeHistogram(histData.red),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 1,
        pointRadius: 0,
      });
    }
    if (histData.green) {
      datasets.push({
        label: 'Green',
        data: normalizeHistogram(histData.green),
        borderColor: 'rgb(75, 192, 75)',
        backgroundColor: 'rgba(75, 192, 75, 0.2)',
        borderWidth: 1,
        pointRadius: 0,
      });
    }
    if (histData.blue) {
      datasets.push({
        label: 'Blue',
        data: normalizeHistogram(histData.blue),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderWidth: 1,
        pointRadius: 0,
      });
    }
  }

  const data = {
    labels,
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        display: true,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Pixel Intensity',
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Normalized Frequency',
        },
      },
    },
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      <div className="h-64 bg-white border border-gray-300 rounded-lg p-4">
        <Line options={options} data={data} />
      </div>
    </div>
  );
}
