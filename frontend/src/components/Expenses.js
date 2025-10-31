import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchExpenses, createExpense, updateExpense, deleteExpense } from '../store/expenseSlice';
import { toast } from 'sonner';

function Expenses() {
  const dispatch = useDispatch();
  const { expenses, categories } = useSelector((state) => state.expense);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
  });
  
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort expenses
  const getFilteredAndSortedExpenses = () => {
    let filtered = [...expenses];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(exp => 
        exp.description.toLowerCase().includes(searchLower) ||
        exp.category.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(exp => exp.category === filters.category);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(exp => exp.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(exp => exp.date <= filters.dateTo);
    }

    // Amount range filter
    if (filters.amountMin) {
      filtered = filtered.filter(exp => exp.amount >= parseFloat(filters.amountMin));
    }
    if (filters.amountMax) {
      filtered = filtered.filter(exp => exp.amount <= parseFloat(filters.amountMax));
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch(sortBy) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const filteredExpenses = getFilteredAndSortedExpenses();

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalCount = filteredExpenses.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    if (editingExpense) {
      const result = await dispatch(updateExpense({ id: editingExpense.id, data }));
      if (updateExpense.fulfilled.match(result)) {
        toast.success('Expense updated successfully');
        setShowModal(false);
        setEditingExpense(null);
        resetForm();
        dispatch(fetchExpenses());
      }
    } else {
      const result = await dispatch(createExpense(data));
      if (createExpense.fulfilled.match(result)) {
        toast.success('Expense added successfully');
        setShowModal(false);
        resetForm();
        dispatch(fetchExpenses());
      }
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      const result = await dispatch(deleteExpense(id));
      if (deleteExpense.fulfilled.match(result)) {
        toast.success('Expense deleted successfully');
        dispatch(fetchExpenses());
      }
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    resetForm();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
    });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Amount'];
    const csvData = filteredExpenses.map(exp => [
      exp.date,
      exp.description,
      exp.category,
      exp.amount.toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Expenses exported to CSV');
  };

  return (
    <div className="expense-table" data-testid="expenses-container">
      <div className="table-header">
        <div>
          <h2 className="chart-title" style={{ marginBottom: '4px' }}>Expense Management</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {totalCount} expense{totalCount !== 1 ? 's' : ''} • Total: ${totalAmount.toFixed(2)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="toggle-filters-button"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            🔍 {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          {filteredExpenses.length > 0 && (
            <button
              className="btn-secondary"
              onClick={exportToCSV}
              data-testid="export-csv-button"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              📥 Export CSV
            </button>
          )}
          <button
            className="btn-add"
            onClick={() => setShowModal(true)}
            data-testid="add-expense-button"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div style={{ 
          marginBottom: '24px', 
          padding: '24px', 
          background: 'var(--bg-primary)', 
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Filters</h3>
            <button
              onClick={clearFilters}
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
              Clear All
            </button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* Search */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '13px' }}>Search</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search description or category..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{ padding: '10px 12px', fontSize: '14px' }}
              />
            </div>

            {/* Category */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '13px' }}>Category</label>
              <select
                className="form-select"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                style={{ padding: '10px 12px', fontSize: '14px' }}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '13px' }}>From Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                style={{ padding: '10px 12px', fontSize: '14px' }}
              />
            </div>

            {/* Date To */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '13px' }}>To Date</label>
              <input
                type="date"
                className="form-input"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                style={{ padding: '10px 12px', fontSize: '14px' }}
              />
            </div>

            {/* Amount Min */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '13px' }}>Min Amount</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="0.00"
                value={filters.amountMin}
                onChange={(e) => setFilters({ ...filters, amountMin: e.target.value })}
                style={{ padding: '10px 12px', fontSize: '14px' }}
              />
            </div>

            {/* Amount Max */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '13px' }}>Max Amount</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="999.99"
                value={filters.amountMax}
                onChange={(e) => setFilters({ ...filters, amountMax: e.target.value })}
                style={{ padding: '10px 12px', fontSize: '14px' }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="expenses-list">
        {filteredExpenses.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
            {expenses.length === 0 
              ? 'No expenses yet. Add your first expense!'
              : 'No expenses match your filters. Try adjusting them.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th 
                    onClick={() => handleSort('date')}
                    style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      color: 'var(--text-muted)', 
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('description')}
                    style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      color: 'var(--text-muted)', 
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    Description {sortBy === 'description' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('category')}
                    style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      color: 'var(--text-muted)', 
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    Category {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    onClick={() => handleSort('amount')}
                    style={{ 
                      padding: '12px', 
                      textAlign: 'right', 
                      color: 'var(--text-muted)', 
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} style={{ borderBottom: '1px solid var(--border-color)' }} data-testid={`expense-row-${expense.id}`}>
                    <td style={{ padding: '16px', color: 'var(--text-primary)' }}>{expense.date}</td>
                    <td style={{ padding: '16px', color: 'var(--text-primary)' }}>{expense.description}</td>
                    <td style={{ padding: '16px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          background: 'var(--card-hover)',
                          borderRadius: '12px',
                          fontSize: '14px',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleEdit(expense)}
                        style={{
                          marginRight: '8px',
                          padding: '6px 12px',
                          background: 'var(--card-hover)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)',
                          fontSize: '14px',
                        }}
                        data-testid={`edit-expense-${expense.id}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#fee',
                          border: '1px solid #fcc',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#c53030',
                          fontSize: '14px',
                        }}
                        data-testid={`delete-expense-${expense.id}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="expense-modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
              <button className="btn-close" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    data-testid="expense-amount-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    data-testid="expense-date-input"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  data-testid="expense-category-select"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  data-testid="expense-description-input"
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" data-testid="expense-submit-button" style={{ marginLeft: '12px', width: 'auto' }}>
                  {editingExpense ? 'Update' : 'Add'} Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Expenses;
