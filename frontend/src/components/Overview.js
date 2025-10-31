import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnalytics } from '../store/expenseSlice';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Overview() {
  const dispatch = useDispatch();
  const { analytics, categories } = useSelector((state) => state.expense);

  useEffect(() => {
    dispatch(fetchAnalytics());
  }, [dispatch]);

  const categoryColors = {
    'Food': '#FF6B6B',
    'Transport': '#4ECDC4',
    'Shopping': '#95E1D3',
    'Entertainment': '#F38181',
    'Bills': '#AA96DA',
    'Healthcare': '#FCBAD3',
    'Education': '#A8D8EA',
    'Other': '#FFD93D'
  };

  const doughnutData = analytics?.category_breakdown ? {
    labels: Object.keys(analytics.category_breakdown),
    datasets: [
      {
        data: Object.values(analytics.category_breakdown),
        backgroundColor: Object.keys(analytics.category_breakdown).map(
          cat => categoryColors[cat] || '#CBD5E0'
        ),
        borderWidth: 0,
      },
    ],
  } : null;

  const lineData = analytics?.monthly_trend ? {
    labels: analytics.monthly_trend.map(item => item.month),
    datasets: [
      {
        label: 'Monthly Expenses',
        data: analytics.monthly_trend.map(item => item.amount),
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div data-testid="overview-container">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value" data-testid="total-expenses">
            ${analytics?.total_expenses?.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Transactions</div>
          <div className="stat-value" data-testid="total-transactions">
            {analytics?.expense_count || 0}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average per Transaction</div>
          <div className="stat-value" data-testid="average-transaction">
            ${analytics?.expense_count
              ? (analytics.total_expenses / analytics.expense_count).toFixed(2)
              : '0.00'}
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-container" style={{ flex: 1, marginRight: '16px' }}>
          <h3 className="chart-title">Category Breakdown</h3>
          {doughnutData ? (
            <div style={{ height: '300px' }}>
              <Doughnut data={doughnutData} options={chartOptions} />
            </div>
          ) : (
            <p>No data available</p>
          )}
        </div>

        <div className="chart-container" style={{ flex: 1, marginLeft: '16px' }}>
          <h3 className="chart-title">Monthly Trend</h3>
          {lineData ? (
            <div style={{ height: '300px' }}>
              <Line data={lineData} options={chartOptions} />
            </div>
          ) : (
            <p>No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Overview;