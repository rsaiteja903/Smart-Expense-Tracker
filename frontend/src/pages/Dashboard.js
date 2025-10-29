import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { logout, getMe } from '../store/authSlice';
import { fetchExpenses, fetchCategories, fetchAnalytics, fetchInsights } from '../store/expenseSlice';
import { useTheme } from '../context/ThemeContext';
import Overview from '../components/Overview';
import Expenses from '../components/Expenses';
import Insights from '../components/Insights';
import ReceiptUpload from '../components/ReceiptUpload';
import Settings from './Settings';

function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    dispatch(getMe());
    dispatch(fetchExpenses());
    dispatch(fetchCategories());
    dispatch(fetchAnalytics());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="dashboard-container" data-testid="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-logo">Smart Expense Tracker</div>
        <div className="dashboard-user">
          <button
            className="theme-toggle-header"
            onClick={toggleTheme}
            data-testid="header-theme-toggle"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <span className="user-name" data-testid="user-name">{user?.name || 'User'}</span>
          <button className="btn-logout" onClick={handleLogout} data-testid="logout-button">
            Logout
          </button>
        </div>
      </div>
      
      <div className="dashboard-nav">
        <button
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          data-testid="nav-overview"
        >
          Overview
        </button>
        <button
          className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
          data-testid="nav-expenses"
        >
          Expenses
        </button>
        <button
          className={`nav-item ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
          data-testid="nav-insights"
        >
          Insights
        </button>
        <button
          className={`nav-item ${activeTab === 'receipt' ? 'active' : ''}`}
          onClick={() => setActiveTab('receipt')}
          data-testid="nav-receipt"
        >
          Upload Receipt
        </button>
        <button
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          data-testid="nav-settings"
        >
          Settings
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && <Overview />}
        {activeTab === 'expenses' && <Expenses />}
        {activeTab === 'insights' && <Insights />}
        {activeTab === 'receipt' && <ReceiptUpload />}
        {activeTab === 'settings' && <Settings />}
      </div>
    </div>
  );
}

export default Dashboard;