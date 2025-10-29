import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import axios from 'axios';
import { getMe } from '../store/authSlice';
import { useTheme } from '../context/ThemeContext';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

function Settings() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const updateData = {
        name: formData.name,
      };

      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error('New passwords do not match');
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 6) {
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        updateData.current_password = formData.currentPassword;
        updateData.new_password = formData.newPassword;
      }

      await axios.put(`${API_URL}/auth/update`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      dispatch(getMe());
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container" data-testid="settings-container">
      <h2 className="chart-title" style={{ marginBottom: '32px' }}>Account Settings</h2>

      <div className="settings-grid">
        {/* Profile Settings */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3 className="settings-card-title">Profile Information</h3>
            {!isEditing && (
              <button
                className="btn-edit"
                onClick={() => setIsEditing(true)}
                data-testid="edit-profile-button"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="name-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  disabled
                  style={{ background: 'var(--input-disabled-bg)', cursor: 'not-allowed' }}
                />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Email cannot be changed
                </p>
              </div>

              <div className="form-divider"></div>

              <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                Change Password (Optional)
              </h4>

              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  data-testid="current-password-input"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  data-testid="new-password-input"
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  data-testid="confirm-password-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  data-testid="save-profile-button"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData((prev) => ({
                      ...prev,
                      name: user.name,
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    }));
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-item">
                <span className="info-label">Name</span>
                <span className="info-value" data-testid="display-name">{user?.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value" data-testid="display-email">{user?.email}</span>
              </div>
            </div>
          )}
        </div>

        {/* Theme Settings */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3 className="settings-card-title">Appearance</h3>
          </div>

          <div className="theme-selector">
            <div className="theme-option">
              <div>
                <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>Theme</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  Choose your preferred theme
                </div>
              </div>
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                data-testid="theme-toggle-button"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <span style={{ fontSize: '24px' }}>🌙</span>
                ) : (
                  <span style={{ fontSize: '24px' }}>☀️</span>
                )}
              </button>
            </div>
            <div style={{ 
              padding: '12px 16px', 
              background: 'var(--card-bg)', 
              borderRadius: '8px', 
              marginTop: '16px',
              border: '1px solid var(--border-color)'
            }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Current theme: <strong style={{ color: 'var(--text-primary)' }}>{theme === 'light' ? 'Light' : 'Dark'}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;