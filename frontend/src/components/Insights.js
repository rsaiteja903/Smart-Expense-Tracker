import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInsights } from '../store/expenseSlice';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

function Insights() {
  const dispatch = useDispatch();
  const { insights } = useSelector((state) => state.expense);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleGenerateInsights = async () => {
    setLoading(true);
    try {
      await dispatch(fetchInsights()).unwrap();
      toast.success('Insights generated successfully!');
    } catch (error) {
      toast.error('Failed to generate insights.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = {
      type: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMessage]);
    setQuestion('');
    setSendingMessage(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/analytics/chat`,
        { question: question },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiMessage = {
        type: 'ai',
        text: response.data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error('Failed to get response. Please try again.');
      const errorMessage = {
        type: 'ai',
        text: 'Sorry, I encountered an error. Please make sure you have expenses tracked and your OpenAI API key is configured.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setSendingMessage(false);
    }
  };

  const suggestedQuestions = [
    "What's my biggest spending category?",
    "How much did I spend this month?",
    "Give me tips to save money",
    "What are my spending patterns?",
    "Compare my food and transport expenses",
    "How can I reduce my expenses?"
  ];

  const handleSuggestedQuestion = (q) => {
    setQuestion(q);
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  return (
    <div data-testid="insights-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="chart-title" style={{ marginBottom: '4px' }}>AI Financial Insights</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Get personalized insights and ask questions about your expenses
          </p>
        </div>
        <button
          className="btn-add"
          onClick={handleGenerateInsights}
          disabled={loading}
          data-testid="generate-insights-button"
        >
          {loading ? '🔄 Analyzing...' : '✨ Auto Insights'}
        </button>
      </div>

      {/* Auto-generated Insights */}
      {insights && insights.length > 0 && (
        <div className="insights-container" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
            📊 Quick Insights
          </h3>
          <div>
            {insights.map((insight, index) => (
              <div
                key={index}
                style={{
                  padding: '14px 18px',
                  background: 'var(--card-hover)',
                  borderLeft: '3px solid var(--primary)',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  lineHeight: '1.6',
                }}
                data-testid={`insight-${index}`}
              >
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className="insights-container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
            💬 Ask Me Anything
          </h3>
          {chatMessages.length > 0 && (
            <button
              onClick={clearChat}
              style={{
                padding: '6px 12px',
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              Clear Chat
            </button>
          )}
        </div>

        {/* Chat Messages */}
        <div style={{
          minHeight: '400px',
          maxHeight: '500px',
          overflowY: 'auto',
          marginBottom: '20px',
          padding: '16px',
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          {chatMessages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              color: 'var(--text-muted)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💡</div>
              <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                Start a Conversation
              </h4>
              <p style={{ fontSize: '14px', marginBottom: '24px' }}>
                Ask me anything about your expenses and spending patterns
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '600px', margin: '0 auto' }}>
                {suggestedQuestions.slice(0, 4).map((q, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuestion(q)}
                    style={{
                      padding: '8px 16px',
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '20px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.borderColor = 'var(--primary)';
                      e.target.style.color = 'var(--primary)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.borderColor = 'var(--border-color)';
                      e.target.style.color = 'var(--text-secondary)';
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: '16px'
                  }}
                >
                  <div style={{
                    maxWidth: '75%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: message.type === 'user' 
                      ? 'var(--primary-gradient)'
                      : 'var(--card-bg)',
                    color: message.type === 'user' ? 'white' : 'var(--text-primary)',
                    boxShadow: 'var(--shadow-sm)',
                    border: message.type === 'ai' ? '1px solid var(--border-color)' : 'none'
                  }}>
                    <div style={{ 
                      fontSize: '14px', 
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {message.text}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      marginTop: '6px',
                      opacity: 0.7,
                      textAlign: message.type === 'user' ? 'right' : 'left'
                    }}>
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))}
              {sendingMessage && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--card-bg)',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <span className="typing-indicator">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Suggested Questions (when chat is active) */}
        {chatMessages.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Suggested questions:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {suggestedQuestions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(q)}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--card-hover)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'var(--card-bg)';
                    e.target.style.borderColor = 'var(--primary)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'var(--card-hover)';
                    e.target.style.borderColor = 'var(--border-color)';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSendQuestion} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ask a question about your expenses..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={sendingMessage}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={sendingMessage || !question.trim()}
            style={{ width: 'auto', padding: '0 32px' }}
          >
            {sendingMessage ? '⏳' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Insights;
