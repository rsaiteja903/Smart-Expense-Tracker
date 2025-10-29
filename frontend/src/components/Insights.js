import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInsights } from '../store/expenseSlice';
import { toast } from 'sonner';

function Insights() {
  const dispatch = useDispatch();
  const { insights } = useSelector((state) => state.expense);
  const [loading, setLoading] = useState(false);

  const handleGenerateInsights = async () => {
    setLoading(true);
    try {
      await dispatch(fetchInsights()).unwrap();
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

  return (
    <div className="insights-container" data-testid="insights-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 className="chart-title">AI-Powered Financial Insights</h2>
        <button
          className="btn-add"
          onClick={handleGenerateInsights}
          disabled={loading}
          data-testid="generate-insights-button"
        >
          {loading ? 'Analyzing...' : '✨ Generate Insights'}
        </button>
      </div>

      {insights.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 40px', color: '#718096' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💡</div>
          <p style={{ fontSize: '16px', marginBottom: '8px', fontWeight: 500, color: '#2d3748' }}>
            Ready to unlock insights?
          </p>
          <p style={{ fontSize: '14px' }}>
            Click "Generate Insights" to get personalized financial insights based on your spending patterns.
          </p>
        </div>
      ) : (
        <div>
          {insights.map((insight, index) => {
            const cleanedInsight = cleanInsightText(insight);
            
            if (!cleanedInsight || cleanedInsight.length < 5) return null;
            
            return (
              <div 
                key={index} 
                className="insight-item" 
                data-testid={`insight-${index}`}
                style={{
                  padding: '20px 24px',
                  background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
                  borderLeft: '4px solid #667eea',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  fontSize: '15px',
                  color: '#2d3748',
                  lineHeight: '1.7',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ marginRight: '12px', fontSize: '20px', flexShrink: 0 }}>
                    {index === 0 ? '💰' : index === 1 ? '📊' : index === 2 ? '💡' : '✅'}
                  </span>
                  <span>{cleanedInsight}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Insights;