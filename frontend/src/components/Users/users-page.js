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
import { useTranslation } from 'react-i18next';
import { userAPI, authAPI } from '../../services/api';
import LoadingSpinner from '../UI/loading-spinner';
import ErrorMessage from '../UI/error-message';
import { Button } from '../UI/button';
import { Input } from '../UI/input';
import { Select } from '../UI/select';
import { Card, CardHeader, CardContent } from '../UI/card';
import { Badge } from '../UI/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../UI/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../UI/dialog';

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
  const { t } = useTranslation(['users', 'common']);
  
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

    // Validate required fields
    if (!formData.email) {
      toast.error(t('validation.emailRequired'));
      return;
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(t('validation.invalidEmail'));
      return;
    }

    // Validate name fields
    if (formData.firstName && formData.firstName.length < 2) {
      toast.error(t('validation.firstNameLength'));
      return;
    }

    if (formData.lastName && formData.lastName.length < 2) {
      toast.error(t('validation.lastNameLength'));
      return;
    }

    // Validate phone format if provided
    if (formData.phone && !/^[+]?[0-9\s-()]{7,}$/.test(formData.phone)) {
      toast.error(t('validation.invalidPhone'));
      return;
    }

    // Password validation for new users
    if (modalMode === 'create') {
      if (!formData.password) {
        toast.error(t('validation.passwordRequired'));
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error(t('auth.passwordsDoNotMatch'));
        return;
      }

      // Password strength validation
      if (formData.password.length < 6) {
        toast.error(t('auth.passwordRequirements'));
        return;
      }

      // Check for at least one number and one letter
      const hasNumber = /\d/.test(formData.password);
      const hasLetter = /[a-zA-Z]/.test(formData.password);
      
      if (!hasNumber || !hasLetter) {
        toast.error(t('auth.passwordComplexity'));
        return;
      }
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
      toast.success(t('users.createUserSuccess'));
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
      toast.error(err.response?.data?.message || t('error'));
      
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
        toast.success(t('users.createUserSuccess') + ' (Demo)');
      }
    }
  };

  // Handle Update User
  const handleUpdateUser = async e => {
    e.preventDefault();

    // Validate required fields
    if (!formData.email) {
      toast.error(t('validation.emailRequired'));
      return;
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error(t('validation.invalidEmail'));
      return;
    }

    // Validate name fields
    if (formData.firstName && formData.firstName.length < 2) {
      toast.error(t('validation.firstNameLength'));
      return;
    }

    if (formData.lastName && formData.lastName.length < 2) {
      toast.error(t('validation.lastNameLength'));
      return;
    }

    // Validate phone format if provided
    if (formData.phone && !/^[+]?[0-9\s-()]{7,}$/.test(formData.phone)) {
      toast.error(t('validation.invalidPhone'));
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

      toast.success(t('users.updateUserSuccess'));
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error(err.response?.data?.message || t('error'));
      
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
      toast.success(t('users.updateUserSuccess') + ' (Demo)');
    }
  };

  // Handle Change Password
  const handleChangePassword = async e => {
    e.preventDefault();

    // Validate password fields
    if (!passwordData.currentPassword) {
      toast.error(t('validation.currentPasswordRequired'));
      return;
    }

    if (!passwordData.newPassword) {
      toast.error(t('validation.newPasswordRequired'));
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('auth.passwordsDoNotMatch'));
      return;
    }

    // Password strength validation
    if (passwordData.newPassword.length < 6) {
      toast.error(t('auth.passwordRequirements'));
      return;
    }

    // Check for at least one number and one letter
    const hasNumber = /\d/.test(passwordData.newPassword);
    const hasLetter = /[a-zA-Z]/.test(passwordData.newPassword);
    
    if (!hasNumber || !hasLetter) {
      toast.error(t('auth.passwordComplexity'));
      return;
    }

    try {
      await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      toast.success(t('users.passwordChanged'));
      setShowPasswordModal(false);
      resetPasswordForm();
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error(err.response?.data?.message || t('error'));
      
      // For demo purposes, simulate successful password change
      if (passwordData.currentPassword === 'password123') {
        setShowPasswordModal(false);
        resetPasswordForm();
        toast.success(t('users.passwordChanged') + ' (Demo)');
      }
    }
  };

  // Handle Role Change
  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser?._id && newRole !== 'admin') {
      toast.error(t('users.cannotDeactivateOwn'));
      return;
    }

    try {
      await userAPI.updateRole(userId, newRole);
      toast.success(t('users.updateUserSuccess'));
      fetchUsers();
    } catch (err) {
      console.error('Error updating user role:', err);
      toast.error(err.response?.data?.message || t('error'));
    }
  };

  // Handle Deactivate User
  const handleDeactivateUser = async userId => {
    if (userId === currentUser?._id) {
      toast.error(t('users.cannotDeactivateOwn'));
      return;
    }

    if (!window.confirm(t('users.deactivateWarning'))) {
      return;
    }

    try {
      await userAPI.deactivate(userId);
      toast.success(t('users.userDeactivated'));
      fetchUsers();
    } catch (err) {
      console.error('Error deactivating user:', err);
      toast.error(err.response?.data?.message || t('error'));
    }
  };

  // Handle Delete User
  const handleDeleteUser = async userId => {
    if (userId === currentUser?._id) {
      toast.error(t('users.cannotDeleteOwn'));
      return;
    }

    if (
      !window.confirm(
        t('users.deleteWarning')
      )
    ) {
      return;
    }

    try {
      await userAPI.delete(userId);
      toast.success(t('users.userDeleted'));
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error(err.response?.data?.message || t('error'));
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

    const roleTranslations = {
      admin: t('admin'),
      user: t('user'),
      manager: t('manager'),
      deliverer: t('deliverer')
    };

    return (
      <Badge
        variant={variantMap[role] || 'secondary'}
        className='flex items-center gap-1'
      >
        {getRoleIcon(role)}
        {roleTranslations[role] || role.charAt(0).toUpperCase() + role.slice(1)}
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
            {t('title')}
          </h1>
          <p className='text-muted-foreground'>
            {t('subtitle')}
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
            {t('refresh', { ns: 'common' })}
          </Button>
          <Button
            onClick={handleCreateNewUser}
            size='sm'
            className='flex items-center gap-2'
          >
            <Plus className='h-4 w-4' />
            {t('newUser')}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div className='relative w-full md:max-w-md'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='text'
            placeholder={t('searchPlaceholder')}
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
            {t('filters', { ns: 'common' })}
          </Button>

          {roleFilter && (
            <Button
              variant='destructive'
              size='sm'
              className='flex items-center gap-2'
              onClick={() => setRoleFilter('')}
            >
              <X className='h-4 w-4' />
              {t('clear', { ns: 'common' })}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className='mb-6 rounded-xl bg-card p-6 shadow'>
          <div className='max-w-xs space-y-2'>
            <label className='text-sm font-medium'>{t('role', { ns: 'common' })}</label>
            <Select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value=''>{t('allRoles')}</option>
              <option value='admin'>{t('admin')}</option>
              <option value='manager'>{t('manager')}</option>
              <option value='user'>{t('user')}</option>
              <option value='deliverer'>{t('deliverer')}</option>
            </Select>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-3xl font-bold'>{totalDocs}</span>
            <span className='text-sm text-muted-foreground'>{t('totalUsers')}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-3xl font-bold'>{adminCount}</span>
            <span className='text-sm text-muted-foreground'>
              {t('administrators')}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-3xl font-bold'>{userCount}</span>
            <span className='text-sm text-muted-foreground'>{t('regularUsers')}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-3xl font-bold'>{activeCount}</span>
            <span className='text-sm text-muted-foreground'>{t('activeUsers')}</span>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className='mb-6 overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50'>
              <TableHead>{t('user', { ns: 'common' })}</TableHead>
              <TableHead>{t('contact', { ns: 'common' })}</TableHead>
              <TableHead>{t('role', { ns: 'common' })}</TableHead>
              <TableHead>{t('status', { ns: 'common' })}</TableHead>
              <TableHead>{t('created', { ns: 'common' })}</TableHead>
              <TableHead className='text-right'>{t('actionsHeader', { ns: 'common' })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user._id}>
                <TableCell>
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
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  {user._id === currentUser?._id ? (
                    getRoleBadge(user.role)
                  ) : (
                    <Select
                      value={user.role}
                      onChange={e => handleRoleChange(user._id, e.target.value)}
                      className='w-32'
                    >
                      <option value='user'>{t('users.user')}</option>
                      <option value='admin'>{t('users.admin')}</option>
                      <option value='manager'>{t('users.manager')}</option>
                      <option value='deliverer'>{t('users.deliverer')}</option>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.isActive ? 'success' : 'destructive'}
                    className='flex items-center gap-1'
                  >
                    {user.isActive ? (
                      <>
                        <CheckCircle className='h-3 w-3' />
                        {t('users.active')}
                      </>
                    ) : (
                      <>
                        <UserX className='h-3 w-3' />
                        {t('users.inactive')}
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className='flex items-center gap-1 text-sm'>
                    <Calendar className='h-3 w-3 text-muted-foreground' />
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {users.length === 0 && !loading && (
          <div className='flex flex-col items-center justify-center py-12'>
            <User className='mb-4 h-12 w-12 text-muted-foreground' />
                          <h3 className='mb-2 text-lg font-medium'>{t('noUsersFound')}</h3>
                          <p className='mb-4 text-sm text-muted-foreground'>
              {t('noUsersFoundDescription')}
            </p>
            <Button
              onClick={handleCreateNewUser}
              className='flex items-center gap-2'
            >
              <Plus className='h-4 w-4' />
              {t('addUser')}
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
            {t('common.previous')}
          </Button>

          <div className='text-sm text-muted-foreground'>
            {t('common.page')} {currentPage} {t('common.of')} {totalPages} ({totalDocs} {t('common.total')})
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
            {t('common.next')}
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      )}

      {/* Create/Edit User Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'>
          <div className='w-full max-w-lg rounded-lg bg-white text-black shadow-lg dark:bg-gray-800 dark:text-white'>
            <div className='flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700'>
                              <h2 className='text-xl font-semibold'>
                {modalMode === 'create' ? t('newUser') : t('editUser')}
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
                <h3 className='text-lg font-medium dark:text-gray-200'>{t('userDetails')}</h3>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium dark:text-gray-200'>{t('email')} *</label>
                    <Input
                      type='email'
                      value={formData.email}
                      onChange={e => handleFormChange('email', e.target.value)}
                      required
                      placeholder="user@example.com"
                      pattern="^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$"
                      title={t('validation.invalidEmail')}
                    />
                    <small className="text-xs text-muted-foreground">{t('validation.validEmailRequired')}</small>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium dark:text-gray-200'>{t('role')}</label>
                    <Select
                      value={formData.role}
                      onChange={e => handleFormChange('role', e.target.value)}
                    >
                      <option value='user'>{t('user')}</option>
                      <option value='admin'>{t('admin')}</option>
                      <option value='manager'>{t('manager')}</option>
                      <option value='deliverer'>{t('deliverer')}</option>
                    </Select>
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium dark:text-gray-200'>{t('firstName')}</label>
                    <Input
                      type='text'
                      value={formData.firstName}
                      onChange={e =>
                        handleFormChange('firstName', e.target.value)
                      }
                      minLength="2"
                      title={t('validation.firstNameLength')}
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium dark:text-gray-200'>{t('lastName')}</label>
                    <Input
                      type='text'
                      value={formData.lastName}
                      onChange={e =>
                        handleFormChange('lastName', e.target.value)
                      }
                      minLength="2"
                      title={t('validation.lastNameLength')}
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium dark:text-gray-200'>{t('phone')}</label>
                  <Input
                    type='tel'
                    value={formData.phone}
                    onChange={e => handleFormChange('phone', e.target.value)}
                    pattern="^[+]?[0-9\s-()]{7,}$"
                    title={t('validation.invalidPhone')}
                    placeholder="+1 (555) 123-4567"
                  />
                  <small className="text-xs text-muted-foreground">{t('validation.phoneFormat')}</small>
                </div>
              </div>

              {modalMode === 'create' && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium dark:text-gray-200'>{t('security', { ns: 'settings' })}</h3>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium dark:text-gray-200'>{t('password')} *</label>
                      <Input
                        type='password'
                        value={formData.password}
                        onChange={e =>
                          handleFormChange('password', e.target.value)
                        }
                        required
                        minLength={6}
                        pattern="^(?=.*[0-9])(?=.*[a-zA-Z]).{6,}$"
                        title={t('auth.passwordComplexity')}
                      />
                      <small className="text-xs text-muted-foreground">
                        {t('validation.passwordRequirements')}
                      </small>
                    </div>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium dark:text-gray-200'>
                        {t('confirmPassword')} *
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

              <div className='flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setShowModal(false)}
                >
                  {t('cancel', { ns: 'common' })}
                </Button>
                <Button type='submit'>
                  {modalMode === 'create' ? t('addUser') : t('save', { ns: 'common' })}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </Dialog>

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'>
            <div className='w-full max-w-lg rounded-lg bg-white text-black shadow-lg dark:bg-gray-800 dark:text-white'>
              <div className='flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700'>
                <h2 className='text-xl font-semibold'>{t('userDetails')}</h2>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={() => setShowViewModal(false)}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>

              <div className='space-y-6 p-6'>
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium dark:text-gray-200'>{t('userDetails')}</h3>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-1'>
                      <label className='text-sm font-medium text-muted-foreground'>{t('firstName')} {t('lastName')}</label>
                      <p>
                        {selectedUser.firstName && selectedUser.lastName
                          ? `${selectedUser.firstName} ${selectedUser.lastName}`
                          : selectedUser.firstName ||
                            selectedUser.lastName ||
                            t('common.noResults')}
                      </p>
                    </div>
                    <div className='space-y-1'>
                      <label className='text-sm font-medium text-muted-foreground'>{t('email')}</label>
                      <p>{selectedUser.email}</p>
                    </div>
                    <div className='space-y-1'>
                      <label className='text-sm font-medium text-muted-foreground'>{t('phone')}</label>
                      <p>{selectedUser.phone || t('noResults', { ns: 'common' })}</p>
                    </div>
                    <div className='space-y-1'>
                      <label className='text-sm font-medium text-muted-foreground'>{t('role')}</label>
                      <div>{getRoleBadge(selectedUser.role)}</div>
                    </div>
                  </div>
                </div>

                <div className='space-y-4'>
                  <h3 className='text-lg font-medium dark:text-gray-200'>{t('status', { ns: 'common' })}</h3>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-1'>
                      <label className='text-sm font-medium text-muted-foreground'>{t('status', { ns: 'common' })}</label>
                      <div>
                        <Badge
                          variant={selectedUser.isActive ? 'success' : 'destructive'}
                          className='flex items-center gap-1'
                        >
                          {selectedUser.isActive ? (
                            <>
                              <CheckCircle className='h-3 w-3' />
                              {t('active')}
                            </>
                          ) : (
                            <>
                              <UserX className='h-3 w-3' />
                              {t('inactive')}
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div className='space-y-1'>
                      <label className='text-sm font-medium text-muted-foreground'>{t('created', { ns: 'common' })}</label>
                      <p>
                        {new Date(selectedUser.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'>
            <div className='w-full max-w-lg rounded-lg bg-white text-black shadow-lg dark:bg-gray-800 dark:text-white'>
              <div className='flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700'>
                <h2 className='text-xl font-semibold'>{t('changePassword')}</h2>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={() => setShowPasswordModal(false)}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>

              <form onSubmit={handleChangePassword} className='space-y-6 p-6'>
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium dark:text-gray-200'>{t('security', { ns: 'settings' })}</h3>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium dark:text-gray-200'>{t('currentPassword')} *</label>
                    <Input
                      type='password'
                      value={passwordData.currentPassword}
                      onChange={e =>
                        handlePasswordChange('currentPassword', e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium dark:text-gray-200'>{t('newPassword')} *</label>
                      <Input
                        type='password'
                        value={passwordData.newPassword}
                        onChange={e =>
                          handlePasswordChange('newPassword', e.target.value)
                        }
                        required
                        minLength={6}
                        pattern="^(?=.*[0-9])(?=.*[a-zA-Z]).{6,}$"
                        title={t('auth.passwordComplexity')}
                      />
                      <small className="text-xs text-muted-foreground">
                        {t('validation.passwordRequirements')}
                      </small>
                    </div>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium dark:text-gray-200'>{t('confirmPassword')} *</label>
                      <Input
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

                <div className='flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setShowPasswordModal(false)}
                  >
                    {t('cancel', { ns: 'common' })}
                  </Button>
                  <Button type='submit'>
                    {t('changePassword')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default UsersPage;
