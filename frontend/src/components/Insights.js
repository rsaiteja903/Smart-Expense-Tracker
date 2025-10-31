import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInsights } from '../store/expenseSlice';
import { toast } from 'sonner';
import { Line, Bar } from 'react-chartjs-2';

function Insights() {
  const dispatch = useDispatch();
  const { insights } = useSelector((state) => state.expense);
  const [loading, setLoading] = useState(false);
  const [insightsData, setInsightsData] = useState(null);

  const handleGenerateInsights = async () => {
    setLoading(true);
    try {
      const result = await dispatch(fetchInsights()).unwrap();
      setInsightsData(result);
      toast.success('Insights generated successfully!');
    } catch (error) {
      toast.error('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cleanInsightText = (text) => {
    if (typeof text !== 'string') return String(text);
    
    return text
      .replace(/^[-•*]\s*/, '')
      .replace(/^\d+\.\s*/, '')
      .replace(/^["']\s*/, '')
      .replace(/\s*["']$/, '')
      .trim();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'good': return '#48bb78';
      case 'warning': return '#ed8936';
      case 'normal': return '#4299e1';
      default: return '#718096';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'good': return '✅';
      case 'warning': return '⚠️';
      case 'normal': return 'ℹ️';
      default: return '📊';
    }
  };

  // Prepare chart data for spending trends
  const trendChartData = insightsData?.spending_trends ? {
    labels: insightsData.spending_trends.map(t => t.month),
    datasets: [{
      label: 'Monthly Spending',
      data: insightsData.spending_trends.map(t => t.total),
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      tension: 0.4,
      fill: true,
    }]
  } : null;

  // Prepare chart data for category analysis
  const categoryChartData = insightsData?.category_analysis?.breakdown ? {
    labels: Object.keys(insightsData.category_analysis.breakdown),
    datasets: [{
      label: 'Spending by Category',
      data: Object.values(insightsData.category_analysis.breakdown),
      backgroundColor: [
        '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181',
        '#AA96DA', '#FCBAD3', '#A8D8EA', '#FFD93D'
      ],
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: 'var(--text-primary)',
          font: {
            size: 12
          }
        }
      }
    },
    scales: {
      y: {
        ticks: { color: 'var(--text-muted)' },
        grid: { color: 'var(--border-color)' }
      },
      x: {
        ticks: { color: 'var(--text-muted)' },
        grid: { color: 'var(--border-color)' }
      }
    }
  };

  return (
    <div data-testid="insights-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 className="chart-title" style={{ marginBottom: '4px' }}>AI-Powered Financial Insights</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Comprehensive analysis of your spending patterns
          </p>
        </div>
        <button
          className="btn-add"
          onClick={handleGenerateInsights}
          disabled={loading}
          data-testid="generate-insights-button"
        >
          {loading ? '🔄 Analyzing...' : '✨ Generate Insights'}
        </button>
      </div>

      {!insightsData ? (
        <div className="insights-container" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>💡</div>
          <h3 style={{ fontSize: '20px', marginBottom: '8px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Ready to unlock deep insights?
          </h3>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Get AI-powered analysis of your spending patterns, trends, and personalized recommendations
          </p>
          <ul style={{ 
            textAlign: 'left', 
            display: 'inline-block', 
            color: 'var(--text-secondary)',
            lineHeight: '1.8',
            fontSize: '14px'
          }}>
            <li>📊 Spending trend analysis</li>
            <li>💰 Budget health assessment</li>
            <li>📈 Monthly predictions</li>
            <li>🎯 Category-wise breakdown</li>
            <li>💡 Personalized recommendations</li>
          </ul>
        </div>
      ) : (
        <div>
          {/* Summary Cards */}
          {insightsData.summary && (
            <div className="stats-grid" style={{ marginBottom: '32px' }}>
              <div className="stat-card">
                <div className="stat-label">Total Spending</div>
                <div className="stat-value">${insightsData.summary.total.toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Transactions</div>
                <div className="stat-value">{insightsData.summary.count}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Average Transaction</div>
                <div className="stat-value">${insightsData.summary.average.toFixed(2)}</div>
              </div>
              {insightsData.predictions?.next_month_estimate && (
                <div className="stat-card">
                  <div className="stat-label">Next Month Estimate</div>
                  <div className="stat-value">${insightsData.predictions.next_month_estimate.toFixed(2)}</div>
                </div>
              )}
            </div>
          )}

          {/* Budget Health */}
          {insightsData.budget_health && (
            <div className="insights-container" style={{ marginBottom: '32px' }}>
              <div style={{ 
                padding: '20px', 
                background: `${getStatusColor(insightsData.budget_health.status)}15`,
                borderLeft: `4px solid ${getStatusColor(insightsData.budget_health.status)}`,
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{getStatusIcon(insightsData.budget_health.status)}</span>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Budget Health: {insightsData.budget_health.status.replace('_', ' ').toUpperCase()}
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {insightsData.budget_health.message}
                    </p>
                  </div>
                </div>
                {insightsData.budget_health.recommendation && (
                  <p style={{ 
                    fontSize: '14px', 
                    color: 'var(--text-primary)', 
                    fontWeight: 500,
                    marginTop: '8px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    💡 {insightsData.budget_health.recommendation}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Charts Row */}
          {(trendChartData || categoryChartData) && (
            <div className="charts-row" style={{ marginBottom: '32px' }}>
              {trendChartData && (
                <div className="chart-container" style={{ flex: 1, marginRight: categoryChartData ? '16px' : '0' }}>
                  <h3 className="chart-title">Spending Trend Over Time</h3>
                  <div style={{ height: '300px' }}>
                    <Line data={trendChartData} options={chartOptions} />
                  </div>
                </div>
              )}
              
              {categoryChartData && (
                <div className="chart-container" style={{ flex: 1, marginLeft: trendChartData ? '16px' : '0' }}>
                  <h3 className="chart-title">Category Distribution</h3>
                  <div style={{ height: '300px' }}>
                    <Bar data={categoryChartData} options={chartOptions} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Insights */}
          {insights && insights.length > 0 && (
            <div className="insights-container">
              <h3 className="chart-title">AI-Generated Insights</h3>
              <div>
                {insights.map((insight, index) => {
                  const cleanedInsight = cleanInsightText(insight);
                  
                  if (!cleanedInsight || cleanedInsight.length < 5) return null;
                  
                  const icons = ['💰', '📊', '💡', '✅', '🎯', '📈'];
                  
                  return (
                    <div 
                      key={index} 
                      className="insight-item" 
                      data-testid={`insight-${index}`}
                      style={{
                        padding: '20px 24px',
                        background: 'var(--card-hover)',
                        borderLeft: '4px solid var(--primary)',
                        borderRadius: '12px',
                        marginBottom: '16px',
                        fontSize: '15px',
                        color: 'var(--text-primary)',
                        lineHeight: '1.7',
                        boxShadow: 'var(--shadow-sm)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ 
                          marginRight: '16px', 
                          fontSize: '24px', 
                          flexShrink: 0,
                          marginTop: '2px'
                        }}>
                          {icons[index % icons.length]}
                        </span>
                        <span style={{ flex: 1 }}>{cleanedInsight}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Monthly Trends Table */}
          {insightsData.spending_trends && insightsData.spending_trends.length > 0 && (
            <div className="insights-container" style={{ marginTop: '32px' }}>
              <h3 className="chart-title">Monthly Breakdown</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Month</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Total</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Transactions</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Average</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px' }}>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insightsData.spending_trends.map((trend, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{trend.month}</td>
                        <td style={{ padding: '14px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>
                          ${trend.total.toFixed(2)}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {trend.count}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          ${trend.average.toFixed(2)}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          {trend.change_percent !== undefined ? (
                            <span style={{ 
                              color: trend.trend === 'up' ? '#f56565' : trend.trend === 'down' ? '#48bb78' : 'var(--text-muted)',
                              fontWeight: 600
                            }}>
                              {trend.trend === 'up' ? '↑' : trend.trend === 'down' ? '↓' : '→'} {Math.abs(trend.change_percent)}%
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Insights;
