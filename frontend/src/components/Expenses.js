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

  return (
    <div className="expense-table" data-testid="expenses-container">
      <div className="table-header">
        <h2 className="chart-title">Expense List</h2>
        <button
          className="btn-add"
          onClick={() => setShowModal(true)}
          data-testid="add-expense-button"
        >
          + Add Expense
        </button>
      </div>

      <div className="expenses-list">
        {expenses.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#718096', padding: '40px' }}>
            No expenses yet. Add your first expense!
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: '#718096', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#718096', fontWeight: 600 }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'left', color: '#718096', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#718096', fontWeight: 600 }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'right', color: '#718096', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} style={{ borderBottom: '1px solid #e2e8f0' }} data-testid={`expense-row-${expense.id}`}>
                  <td style={{ padding: '16px', color: '#2d3748' }}>{expense.date}</td>
                  <td style={{ padding: '16px', color: '#2d3748' }}>{expense.description}</td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        background: '#f7fafc',
                        borderRadius: '12px',
                        fontSize: '14px',
                        color: '#4a5568',
                      }}
                    >
                      {expense.category}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: '#2d3748' }}>
                    ${expense.amount.toFixed(2)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleEdit(expense)}
                      style={{
                        marginRight: '8px',
                        padding: '6px 12px',
                        background: '#edf2f7',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#4a5568',
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
                        border: 'none',
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
                <button type="submit" className="btn-primary" data-testid="expense-submit-button" style={{ marginLeft: '12px' }}>
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