import { useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { toast } from 'sonner';
import { createExpense, fetchExpenses } from '../store/expenseSlice';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

function ReceiptUpload() {
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
    } else {
      toast.error('Please upload an image file');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/receipts/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setExtractedData(response.data);
      toast.success('Receipt processed successfully!');
    } catch (error) {
      toast.error('Failed to process receipt');
    } finally {
      setUploading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!extractedData) return;

    const expenseData = {
      amount: extractedData.amount || 0,
      category: extractedData.category || 'Other',
      description: extractedData.merchant || 'Receipt upload',
      date: new Date().toISOString().split('T')[0],
    };

    const result = await dispatch(createExpense(expenseData));
    if (createExpense.fulfilled.match(result)) {
      toast.success('Expense added from receipt!');
      setFile(null);
      setExtractedData(null);
      dispatch(fetchExpenses());
    }
  };

  return (
    <div className="insights-container" data-testid="receipt-upload-container">
      <h2 className="chart-title">Upload Receipt</h2>

      <div
        className={`upload-area ${dragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
        data-testid="upload-area"
      >
        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          data-testid="file-input"
        />
        <div>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>📄</p>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#2d3748', marginBottom: '8px' }}>
            {file ? file.name : 'Drop receipt image here'}
          </p>
          <p style={{ fontSize: '14px', color: '#718096' }}>or click to browse</p>
        </div>
      </div>

      {file && !extractedData && (
        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={uploading}
          data-testid="upload-receipt-button"
          style={{ marginTop: '24px' }}
        >
          {uploading ? 'Processing...' : 'Process Receipt'}
        </button>
      )}

      {extractedData && (
        <div style={{ marginTop: '32px', padding: '24px', background: '#f7fafc', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Extracted Information</h3>
          <div style={{ marginBottom: '12px' }}>
            <strong>Merchant:</strong> {extractedData.merchant || 'Not detected'}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Amount:</strong> ${extractedData.amount?.toFixed(2) || 'Not detected'}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <strong>Category:</strong> {extractedData.category}
          </div>
          <button
            className="btn-primary"
            onClick={handleAddExpense}
            data-testid="add-expense-from-receipt"
            style={{ marginTop: '16px' }}
          >
            Add as Expense
          </button>
        </div>
      )}
    </div>
  );
}

export default ReceiptUpload;