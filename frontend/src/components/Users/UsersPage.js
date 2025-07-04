import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  Edit3,
  Trash2,
  Eye,
  Mail,
  Phone,
  Shield,
  User,
  UserX,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Crown,
  Key,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Settings,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { userAPI, authAPI } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import ErrorMessage from '../UI/ErrorMessage';
import './UsersPage.css';

const UsersPage = () => {
  // State Management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit] = useState(10);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'user',
    password: '',
    confirmPassword: '',
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Get current user info
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await userAPI.getProfile();
        setCurrentUser(response.data);
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        ...(roleFilter && { role: roleFilter }),
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await userAPI.getAll(params);
      setUsers(response.data.docs || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalDocs(response.data.totalDocs || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, roleFilter, searchTerm]);

  // Effects
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Form Changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle Password Form Changes
  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'user',
      password: '',
      confirmPassword: '',
    });
  };

  // Reset Password Form
  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  // Handle Create User (Admin Registration)
  const handleCreateUser = async e => {
    e.preventDefault();

    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: formData.role,
      };

      await authAPI.register(userData);
      toast.success('User created successfully');
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  // Handle Update User Profile
  const handleUpdateUser = async e => {
    e.preventDefault();

    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    try {
      const updateData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      };

      await userAPI.updateProfile(updateData);

      // If role changed, update role separately
      if (formData.role !== selectedUser.role) {
        await userAPI.updateRole(selectedUser._id, formData.role);
      }

      toast.success('User updated successfully');
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  // Handle Change Password
  const handleChangePassword = async e => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      resetPasswordForm();
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  // Handle Role Change
  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser?._id && newRole !== 'admin') {
      toast.error('You cannot change your own admin role');
      return;
    }

    try {
      await userAPI.updateRole(userId, newRole);
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  // Handle Deactivate User
  const handleDeactivateUser = async userId => {
    if (userId === currentUser?._id) {
      toast.error('You cannot deactivate your own account');
      return;
    }

    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      await userAPI.deactivate(userId);
      toast.success('User deactivated successfully');
      fetchUsers();
    } catch (err) {
      console.error('Error deactivating user:', err);
      toast.error(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async userId => {
    if (userId === currentUser?._id) {
      toast.error('You cannot delete your own account');
      return;
    }

    if (
      !window.confirm(
        'Are you sure you want to delete this user? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      await userAPI.delete(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Handle View User
  const handleViewUser = async user => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  // Handle Edit User
  const handleEditUser = user => {
    setSelectedUser(user);
    setFormData({
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      role: user.role || 'user',
      password: '',
      confirmPassword: '',
    });
    setModalMode('edit');
    setShowModal(true);
  };

  // Handle Create New User
  const handleCreateNewUser = () => {
    resetForm();
    setModalMode('create');
    setShowModal(true);
  };

  // Get Role Icon
  const getRoleIcon = role => {
    switch (role) {
      case 'admin':
        return <Crown size={16} className='text-yellow-500' />;
      case 'user':
        return <User size={16} className='text-blue-500' />;
      default:
        return <User size={16} className='text-gray-500' />;
    }
  };

  // Get Role Badge
  const getRoleBadge = role => (
    <span className={`role-badge role-${role}`}>
      {getRoleIcon(role)}
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );

  // Statistics calculations
  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;
  const activeCount = users.filter(u => u.isActive).length;

  if (loading && users.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchUsers} />;

  return (
    <div className='users-page'>
      {/* Header */}
      <div className='page-header'>
        <div className='header-content'>
          <h1 className='page-title'>User Management</h1>
          <p className='page-subtitle'>
            Manage system users and access controls
          </p>
        </div>
        <div className='header-actions'>
          <button
            onClick={() => setShowPasswordModal(true)}
            className='btn btn-outline'
          >
            <Key size={16} />
            Change Password
          </button>
          <button
            onClick={fetchUsers}
            className='btn btn-secondary'
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={handleCreateNewUser} className='btn btn-primary'>
            <Plus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='page-controls'>
        <div className='search-section'>
          <div className='search-bar'>
            <Search size={20} className='search-icon' />
            <input
              type='text'
              placeholder='Search by name, email...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-outline ${showFilters ? 'active' : ''}`}
          >
            <Filter size={16} />
            Filters
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className='filters-panel'>
          <div className='filter-group'>
            <label>Role</label>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value=''>All Roles</option>
              <option value='admin'>Administrator</option>
              <option value='user'>User</option>
            </select>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className='stats-grid'>
        <div className='stat-card'>
          <div className='stat-value'>{totalDocs}</div>
          <div className='stat-label'>Total Users</div>
        </div>
        <div className='stat-card admin'>
          <div className='stat-value'>{adminCount}</div>
          <div className='stat-label'>Administrators</div>
        </div>
        <div className='stat-card user'>
          <div className='stat-value'>{userCount}</div>
          <div className='stat-label'>Regular Users</div>
        </div>
        <div className='stat-card active'>
          <div className='stat-value'>{activeCount}</div>
          <div className='stat-label'>Active Users</div>
        </div>
      </div>

      {/* Users Table */}
      <div className='table-container'>
        <table className='users-table'>
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>
                  <div className='user-info'>
                    <div className='user-name'>
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.firstName || user.lastName || 'No Name'}
                    </div>
                    <div className='user-email'>{user.email}</div>
                  </div>
                </td>
                <td>
                  <div className='contact-info'>
                    <div className='contact-item'>
                      <Mail size={14} />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className='contact-item'>
                        <Phone size={14} />
                        {user.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className='role-selector'>
                    {user._id === currentUser?._id ? (
                      getRoleBadge(user.role)
                    ) : (
                      <select
                        value={user.role}
                        onChange={e =>
                          handleRoleChange(user._id, e.target.value)
                        }
                        className='role-select'
                      >
                        <option value='user'>User</option>
                        <option value='admin'>Admin</option>
                      </select>
                    )}
                  </div>
                </td>
                <td>
                  <span
                    className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}
                  >
                    {user.isActive ? (
                      <>
                        <CheckCircle size={14} />
                        Active
                      </>
                    ) : (
                      <>
                        <UserX size={14} />
                        Inactive
                      </>
                    )}
                  </span>
                </td>
                <td>
                  <div className='date-info'>
                    <Calendar size={14} />
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td>
                  <div className='actions'>
                    <button
                      onClick={() => handleViewUser(user)}
                      className='btn-icon'
                      title='View Details'
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleEditUser(user)}
                      className='btn-icon'
                      title='Edit'
                    >
                      <Edit3 size={16} />
                    </button>
                    {user._id !== currentUser?._id && (
                      <>
                        <button
                          onClick={() => handleDeactivateUser(user._id)}
                          className='btn-icon warning'
                          title='Deactivate'
                          disabled={!user.isActive}
                        >
                          <UserX size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className='btn-icon danger'
                          title='Delete'
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && !loading && (
          <div className='empty-state'>
            <User size={48} className='empty-icon' />
            <h3>No users found</h3>
            <p>Get started by adding your first user to the system.</p>
            <button onClick={handleCreateNewUser} className='btn btn-primary'>
              <Plus size={16} />
              Add User
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='pagination'>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className='btn btn-outline'
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <div className='page-info'>
            <span>
              Page {currentPage} of {totalPages} ({totalDocs} total)
            </span>
          </div>

          <button
            onClick={() =>
              setCurrentPage(prev => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className='btn btn-outline'
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h2>{modalMode === 'create' ? 'Add New User' : 'Edit User'}</h2>
              <button onClick={() => setShowModal(false)} className='btn-close'>
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                modalMode === 'create' ? handleCreateUser : handleUpdateUser
              }
              className='modal-form'
            >
              <div className='form-section'>
                <h3>User Information</h3>
                <div className='form-row'>
                  <div className='form-group'>
                    <label>Email *</label>
                    <input
                      type='email'
                      value={formData.email}
                      onChange={e => handleFormChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div className='form-group'>
                    <label>Role</label>
                    <select
                      value={formData.role}
                      onChange={e => handleFormChange('role', e.target.value)}
                    >
                      <option value='user'>User</option>
                      <option value='admin'>Administrator</option>
                    </select>
                  </div>
                </div>

                <div className='form-row'>
                  <div className='form-group'>
                    <label>First Name</label>
                    <input
                      type='text'
                      value={formData.firstName}
                      onChange={e =>
                        handleFormChange('firstName', e.target.value)
                      }
                    />
                  </div>
                  <div className='form-group'>
                    <label>Last Name</label>
                    <input
                      type='text'
                      value={formData.lastName}
                      onChange={e =>
                        handleFormChange('lastName', e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className='form-group'>
                  <label>Phone</label>
                  <input
                    type='tel'
                    value={formData.phone}
                    onChange={e => handleFormChange('phone', e.target.value)}
                  />
                </div>
              </div>

              {modalMode === 'create' && (
                <div className='form-section'>
                  <h3>Security</h3>
                  <div className='form-row'>
                    <div className='form-group'>
                      <label>Password *</label>
                      <input
                        type='password'
                        value={formData.password}
                        onChange={e =>
                          handleFormChange('password', e.target.value)
                        }
                        required
                        minLength={6}
                      />
                    </div>
                    <div className='form-group'>
                      <label>Confirm Password *</label>
                      <input
                        type='password'
                        value={formData.confirmPassword}
                        onChange={e =>
                          handleFormChange('confirmPassword', e.target.value)
                        }
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className='modal-actions'>
                <button
                  type='button'
                  onClick={() => setShowModal(false)}
                  className='btn btn-secondary'
                >
                  Cancel
                </button>
                <button type='submit' className='btn btn-primary'>
                  {modalMode === 'create' ? 'Create User' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h2>User Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className='btn-close'
              >
                <X size={20} />
              </button>
            </div>

            <div className='user-details'>
              <div className='details-section'>
                <h3>Basic Information</h3>
                <div className='details-grid'>
                  <div className='detail-item'>
                    <label>Full Name</label>
                    <span>
                      {selectedUser.firstName && selectedUser.lastName
                        ? `${selectedUser.firstName} ${selectedUser.lastName}`
                        : selectedUser.firstName ||
                          selectedUser.lastName ||
                          'Not provided'}
                    </span>
                  </div>
                  <div className='detail-item'>
                    <label>Email</label>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className='detail-item'>
                    <label>Phone</label>
                    <span>{selectedUser.phone || 'Not provided'}</span>
                  </div>
                  <div className='detail-item'>
                    <label>Role</label>
                    <span>{getRoleBadge(selectedUser.role)}</span>
                  </div>
                </div>
              </div>

              <div className='details-section'>
                <h3>Account Status</h3>
                <div className='details-grid'>
                  <div className='detail-item'>
                    <label>Status</label>
                    <span
                      className={`status-badge ${selectedUser.isActive ? 'active' : 'inactive'}`}
                    >
                      {selectedUser.isActive ? (
                        <>
                          <CheckCircle size={14} />
                          Active
                        </>
                      ) : (
                        <>
                          <UserX size={14} />
                          Inactive
                        </>
                      )}
                    </span>
                  </div>
                  <div className='detail-item'>
                    <label>Created Date</label>
                    <span>
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className='detail-item'>
                    <label>Last Updated</label>
                    <span>
                      {new Date(selectedUser.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h2>Change Password</h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className='btn-close'
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className='modal-form'>
              <div className='form-section'>
                <h3>Password Security</h3>
                <div className='form-group'>
                  <label>Current Password *</label>
                  <input
                    type='password'
                    value={passwordData.currentPassword}
                    onChange={e =>
                      handlePasswordChange('currentPassword', e.target.value)
                    }
                    required
                  />
                </div>
                <div className='form-row'>
                  <div className='form-group'>
                    <label>New Password *</label>
                    <input
                      type='password'
                      value={passwordData.newPassword}
                      onChange={e =>
                        handlePasswordChange('newPassword', e.target.value)
                      }
                      required
                      minLength={6}
                    />
                  </div>
                  <div className='form-group'>
                    <label>Confirm New Password *</label>
                    <input
                      type='password'
                      value={passwordData.confirmPassword}
                      onChange={e =>
                        handlePasswordChange('confirmPassword', e.target.value)
                      }
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className='modal-actions'>
                <button
                  type='button'
                  onClick={() => setShowPasswordModal(false)}
                  className='btn btn-secondary'
                >
                  Cancel
                </button>
                <button type='submit' className='btn btn-primary'>
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
