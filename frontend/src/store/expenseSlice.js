import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const fetchExpenses = createAsyncThunk('expense/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_URL}/expenses`, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch expenses');
  }
});

export const createExpense = createAsyncThunk('expense/create', async (expenseData, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_URL}/expenses`, expenseData, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to create expense');
  }
});

export const updateExpense = createAsyncThunk('expense/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await axios.put(`${API_URL}/expenses/${id}`, data, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to update expense');
  }
});

export const deleteExpense = createAsyncThunk('expense/delete', async (id, { rejectWithValue }) => {
  try {
    await axios.delete(`${API_URL}/expenses/${id}`, getAuthHeader());
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to delete expense');
  }
});

export const fetchCategories = createAsyncThunk('expense/fetchCategories', async () => {
  const response = await axios.get(`${API_URL}/categories`);
  return response.data;
});

export const fetchAnalytics = createAsyncThunk('expense/fetchAnalytics', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_URL}/analytics/summary`, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch analytics');
  }
});

export const fetchInsights = createAsyncThunk('expense/fetchInsights', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${API_URL}/analytics/insights`, getAuthHeader());
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to fetch insights');
  }
});

const expenseSlice = createSlice({
  name: 'expense',
  initialState: {
    expenses: [],
    categories: [],
    analytics: null,
    insights: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        const index = state.expenses.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(e => e.id !== action.payload);
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })
      .addCase(fetchInsights.fulfilled, (state, action) => {
        state.insights = action.payload.insights;
      });
  },
});

export const { clearError } = expenseSlice.actions;
export default expenseSlice.reducer;