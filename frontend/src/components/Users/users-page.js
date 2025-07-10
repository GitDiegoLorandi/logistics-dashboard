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
  User,
  UserX,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Crown,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { userAPI, authAPI } from '../../services/api';
import LoadingSpinner from '../UI/loading-spinner';
import ErrorMessage from '../UI/error-message';
import { Button } from '../UI/button';
import { Input } from '../UI/input';
import { Select } from '../UI/select';
import { Card, CardContent } from '../UI/card';
import { Badge } from '../UI/badge';
import { Table, TableHeader as THead, TableRow as TR, TableHead as TH, TableBody as TBody, TableCell as TD } from '../UI/table';
import { Dialog } from '../UI/dialog';

// Fallback data for development/demo purposes
const fallbackUsers = [
  {
    _id: 'user1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    phone: '555-123-4567',
    createdAt: '2025-01-15T10:30:00Z',
    isActive: true
  },
  {
    _id: 'user2',
    email: 'manager@example.com',
    firstName: 'Manager',
    lastName: 'User',
    role: 'manager',
    phone: '555-234-5678',
    createdAt: '2025-02-20T14:45:00Z',
    isActive: true
  },
  {
    _id: 'user3',
    email: 'user@example.com',
    firstName: 'Regular',
    lastName: 'User',
    role: 'user',
    phone: '555-345-6789',
    createdAt: '2025-03-10T09:15:00Z',
    isActive: true
  },
  {
    _id: 'user4',
    email: 'inactive@example.com',
    firstName: 'Inactive',
    lastName: 'User',
    role: 'user',
    phone: '555-456-7890',
    createdAt: '2025-04-05T16:20:00Z',
    isActive: false
  }
];

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
        setCurrentUser(response); // Remove .data
      } catch (err) {
        console.error('Error fetching current user:', err);
        
        // Use stored user data as fallback
        const userData = localStorage.getItem('user');
        if (userData) {
          setCurrentUser(JSON.parse(userData));
        }
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
      setUsers(response.docs || []);
      setTotalPages(response.totalPages || 1);
      setTotalDocs(response.totalDocs || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
      toast.error('Failed to fetch users. Using demo data instead.');
      
      // Use fallback data when API fails
      setUsers(fallbackUsers);
      setTotalPages(1);
      setTotalDocs(fallbackUsers.length);
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
      
      // For demo purposes, simulate successful creation with fallback data
      if (!err.response?.data?.message?.includes('already exists')) {
        const newUser = {
          _id: `demo-${Date.now()}`,
          ...formData,  // Use formData instead of userData
          createdAt: new Date().toISOString(),
          isActive: true
        };
        
        setUsers(prev => [newUser, ...prev]);
        setShowModal(false);
        resetForm();
        toast.success('Demo mode: User created successfully');
      }
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
      
      // For demo purposes, simulate successful update with fallback data
      setUsers(prev => 
        prev.map(u => u._id === selectedUser._id ? { 
          ...u, 
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: formData.role
        } : u)
      );
      setShowModal(false);
      resetForm();
      toast.success('Demo mode: User updated successfully');
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
      
      // For demo purposes, simulate successful password change
      if (passwordData.currentPassword === 'password123') {
        setShowPasswordModal(false);
        resetPasswordForm();
        toast.success('Demo mode: Password changed successfully');
      }
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
    if (role === 'admin') {
      return <Crown size={16} className='text-status-pending' />;
    } else {
      return <User size={16} className='text-status-in-transit' />;
    }
  };

  // Get Role Badge
  const getRoleBadge = role => {
    const variantMap = {
      admin: 'warning',
      user: 'secondary',
      manager: 'info',
      deliverer: 'outline',
    };

    return (
      <Badge
        variant={variantMap[role] || 'secondary'}
        className='flex items-center gap-1'
      >
        {getRoleIcon(role)}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  // Statistics calculations
  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;
  const activeCount = users.filter(u => u.isActive).length;

  if (loading && users.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchUsers} />;

  return (
    <div className='mx-auto max-w-7xl px-4 py-6'>
      {/* Header */}
      <div className='mb-8 flex flex-col gap-6 rounded-xl bg-card p-6 shadow md:flex-row md:items-start md:justify-between'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-bold'>
            <User className='h-6 w-6 text-primary' />
            User Management
          </h1>
          <p className='text-muted-foreground'>
            Manage system users and permissions
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchUsers}
            disabled={loading}
            className='flex items-center gap-2'
          >
            <RefreshCw
              className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
            />
            Refresh
          </Button>
          <Button
            onClick={handleCreateNewUser}
            size='sm'
            className='flex items-center gap-2'
          >
            <Plus className='h-4 w-4' />
            New User
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div className='relative w-full md:max-w-md'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Search by name or email...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>

        <div className='flex items-center gap-2'>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size='sm'
            className='flex items-center gap-2'
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className='h-4 w-4' />
            Filters
          </Button>

          {roleFilter && (
            <Button
              variant='destructive'
              size='sm'
              className='flex items-center gap-2'
              onClick={() => setRoleFilter('')}
            >
              <X className='h-4 w-4' />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className='mb-6 rounded-xl bg-card p-6 shadow'>
          <div className='max-w-xs space-y-2'>
            <label className='text-sm font-medium'>Role</label>
            <Select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value=''>All Roles</option>
              <option value='admin'>Admin</option>
              <option value='manager'>Manager</option>
              <option value='user'>User</option>
              <option value='deliverer'>Deliverer</option>
            </Select>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-3xl font-bold'>{totalDocs}</span>
            <span className='text-sm text-muted-foreground'>Total Users</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-3xl font-bold'>{adminCount}</span>
            <span className='text-sm text-muted-foreground'>
              Administrators
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-3xl font-bold'>{userCount}</span>
            <span className='text-sm text-muted-foreground'>Regular Users</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-3xl font-bold'>{activeCount}</span>
            <span className='text-sm text-muted-foreground'>Active Users</span>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className='mb-6 overflow-hidden'>
        <Table>
          <THead>
            <TR className='bg-muted/50'>
              <TH>User</TH>
              <TH>Contact</TH>
              <TH>Role</TH>
              <TH>Status</TH>
              <TH>Created</TH>
              <TH className='text-right'>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {users.map(user => (
              <TR key={user._id}>
                <TD>
                  <div className='flex flex-col'>
                    <span className='font-medium'>
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.firstName || user.lastName || 'No Name'}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {user.email}
                    </span>
                  </div>
                </TD>
                <TD>
                  <div className='flex flex-col'>
                    <div className='flex items-center gap-1 text-sm'>
                      <Mail className='h-3 w-3 text-muted-foreground' />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className='flex items-center gap-1 text-sm'>
                        <Phone className='h-3 w-3 text-muted-foreground' />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </div>
                </TD>
                <TD>
                  {user._id === currentUser?._id ? (
                    getRoleBadge(user.role)
                  ) : (
                    <Select
                      value={user.role}
                      onChange={e => handleRoleChange(user._id, e.target.value)}
                      className='w-32'
                    >
                      <option value='user'>User</option>
                      <option value='admin'>Admin</option>
                      <option value='manager'>Manager</option>
                      <option value='deliverer'>Deliverer</option>
                    </Select>
                  )}
                </TD>
                <TD>
                  <Badge
                    variant={user.isActive ? 'success' : 'destructive'}
                    className='flex items-center gap-1'
                  >
                    {user.isActive ? (
                      <>
                        <CheckCircle className='h-3 w-3' />
                        Active
                      </>
                    ) : (
                      <>
                        <UserX className='h-3 w-3' />
                        Inactive
                      </>
                    )}
                  </Badge>
                </TD>
                <TD>
                  <div className='flex items-center gap-1 text-sm'>
                    <Calendar className='h-3 w-3 text-muted-foreground' />
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </TD>
                <TD>
                  <div className='flex items-center justify-end gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0'
                      onClick={() => handleViewUser(user)}
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0'
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit3 className='h-4 w-4' />
                    </Button>
                    {user._id !== currentUser?._id && (
                      <>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 text-amber-500 hover:text-amber-600'
                          onClick={() => handleDeactivateUser(user._id)}
                          disabled={!user.isActive}
                        >
                          <UserX className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 text-destructive hover:text-destructive/80'
                          onClick={() => handleDeleteUser(user._id)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>

        {users.length === 0 && !loading && (
          <div className='flex flex-col items-center justify-center py-12'>
            <User className='mb-4 h-12 w-12 text-muted-foreground' />
            <h3 className='mb-2 text-lg font-medium'>No users found</h3>
            <p className='mb-4 text-sm text-muted-foreground'>
              Get started by adding your first user to the system.
            </p>
            <Button
              onClick={handleCreateNewUser}
              className='flex items-center gap-2'
            >
              <Plus className='h-4 w-4' />
              Add User
            </Button>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='mb-6 flex items-center justify-between py-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className='flex items-center gap-1'
          >
            <ChevronLeft className='h-4 w-4' />
            Previous
          </Button>

          <div className='text-sm text-muted-foreground'>
            Page {currentPage} of {totalPages} ({totalDocs} total)
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              setCurrentPage(prev => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className='flex items-center gap-1'
          >
            Next
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      )}

      {/* Create/Edit User Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='w-full max-w-lg rounded-lg bg-card shadow-lg'>
            <div className='flex items-center justify-between border-b p-6'>
              <h2 className='text-xl font-semibold'>
                {modalMode === 'create' ? 'Add New User' : 'Edit User'}
              </h2>
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0'
                onClick={() => setShowModal(false)}
              >
                <X className='h-4 w-4' />
              </Button>
            </div>

            <form
              onSubmit={
                modalMode === 'create' ? handleCreateUser : handleUpdateUser
              }
              className='space-y-6 p-6'
            >
              <div className='space-y-4'>
                <h3 className='text-lg font-medium'>User Information</h3>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Email *</label>
                    <Input
                      type='email'
                      value={formData.email}
                      onChange={e => handleFormChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Role</label>
                    <Select
                      value={formData.role}
                      onChange={e => handleFormChange('role', e.target.value)}
                    >
                      <option value='user'>User</option>
                      <option value='admin'>Administrator</option>
                      <option value='manager'>Manager</option>
                      <option value='deliverer'>Deliverer</option>
                    </Select>
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>First Name</label>
                    <Input
                      type='text'
                      value={formData.firstName}
                      onChange={e =>
                        handleFormChange('firstName', e.target.value)
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Last Name</label>
                    <Input
                      type='text'
                      value={formData.lastName}
                      onChange={e =>
                        handleFormChange('lastName', e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Phone</label>
                  <Input
                    type='tel'
                    value={formData.phone}
                    onChange={e => handleFormChange('phone', e.target.value)}
                  />
                </div>
              </div>

              {modalMode === 'create' && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium'>Security</h3>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>Password *</label>
                      <Input
                        type='password'
                        value={formData.password}
                        onChange={e =>
                          handleFormChange('password', e.target.value)
                        }
                        required
                        minLength={6}
                      />
                    </div>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>
                        Confirm Password *
                      </label>
                      <Input
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

              <div className='flex justify-end gap-2 border-t pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>
                  {modalMode === 'create' ? 'Create User' : 'Update User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>

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
