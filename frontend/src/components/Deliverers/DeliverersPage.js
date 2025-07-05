import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  Edit3,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Car,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserX,
  Award,
  Package,
  BarChart3,
  Link,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { delivererAPI } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';
import ErrorMessage from '../UI/ErrorMessage';
import { Button } from '../UI/button';
import { Input } from '../UI/input';
import { Select } from '../UI/select';
import { Card, CardContent } from '../UI/card';
import { Badge } from '../UI/badge';
import { Table, THead, TBody, TR, TH, TD } from '../UI/table';
import { Dialog } from '../UI/dialog';
import { cn } from '../../lib/utils';

const DeliverersPage = () => {
  // State Management
  const [deliverers, setDeliverers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDeliverer, setSelectedDeliverer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState('');
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit] = useState(10);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'Available',
    vehicleType: '',
    licenseNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
  });

  // Performance stats state
  const [delivererStats, setDelivererStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch Deliverers
  const fetchDeliverers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        ...(statusFilter && { status: statusFilter }),
        ...(vehicleTypeFilter && { vehicleType: vehicleTypeFilter }),
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await delivererAPI.getAll(params);
      setDeliverers(response.data.docs || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalDocs(response.data.totalDocs || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching deliverers:', err);
      setError('Failed to fetch deliverers');
      toast.error('Failed to fetch deliverers');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, statusFilter, vehicleTypeFilter, searchTerm]);

  // Fetch Deliverer Stats
  const fetchDelivererStats = async delivererId => {
    try {
      setStatsLoading(true);
      const response = await delivererAPI.getStats(delivererId);
      setDelivererStats(response.data);
    } catch (err) {
      console.error('Error fetching deliverer stats:', err);
      toast.error('Failed to fetch deliverer statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Available Deliveries
  const fetchAvailableDeliveries = async () => {
    try {
      setLoadingDeliveries(true);
      const response = await delivererAPI.getAvailableDeliveries();
      setAvailableDeliveries(response.data || []);
    } catch (err) {
      console.error('Error fetching available deliveries:', err);
      toast.error('Failed to fetch available deliveries');
    } finally {
      setLoadingDeliveries(false);
    }
  };

  // Handle Assign Delivery Modal
  const handleOpenAssignModal = deliverer => {
    setSelectedDeliverer(deliverer);
    setShowAssignModal(true);
    fetchAvailableDeliveries();
  };

  // Handle Assign Delivery
  const handleAssignDelivery = async e => {
    e.preventDefault();

    if (!selectedDelivery) {
      toast.error('Please select a delivery to assign');
      return;
    }

    try {
      await delivererAPI.assignDelivery(
        selectedDeliverer._id,
        selectedDelivery
      );
      toast.success('Delivery assigned successfully');
      setShowAssignModal(false);
      setSelectedDelivery('');
      fetchDeliverers();
    } catch (err) {
      console.error('Error assigning delivery:', err);
      toast.error(err.response?.data?.message || 'Failed to assign delivery');
    }
  };

  // Effects
  useEffect(() => {
    fetchDeliverers();

    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsAdmin(parsedUser.role?.toLowerCase() === 'admin');
    }
  }, [fetchDeliverers]);

  // Handle Form Changes
  const handleFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Reset Form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      status: 'Available',
      vehicleType: '',
      licenseNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA',
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: '',
      },
    });
  };

  // Handle Create/Edit Deliverer
  const handleSaveDeliverer = async e => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      if (modalMode === 'create') {
        await delivererAPI.create(formData);
        toast.success('Deliverer created successfully');
      } else {
        await delivererAPI.update(selectedDeliverer._id, formData);
        toast.success('Deliverer updated successfully');
      }

      setShowModal(false);
      resetForm();
      fetchDeliverers();
    } catch (err) {
      console.error('Error saving deliverer:', err);
      toast.error(err.response?.data?.message || 'Failed to save deliverer');
    }
  };

  // Handle Delete Deliverer
  const handleDeleteDeliverer = async delivererId => {
    if (!window.confirm('Are you sure you want to delete this deliverer?')) {
      return;
    }

    try {
      await delivererAPI.delete(delivererId);
      toast.success('Deliverer deleted successfully');
      fetchDeliverers();
    } catch (err) {
      console.error('Error deleting deliverer:', err);
      toast.error(err.response?.data?.message || 'Failed to delete deliverer');
    }
  };

  // Handle View Deliverer
  const handleViewDeliverer = async deliverer => {
    setSelectedDeliverer(deliverer);
    setShowViewModal(true);
  };

  // Handle View Stats
  const handleViewStats = async deliverer => {
    setSelectedDeliverer(deliverer);
    setShowStatsModal(true);
    await fetchDelivererStats(deliverer._id);
  };

  // Handle Edit Deliverer
  const handleEditDeliverer = deliverer => {
    setSelectedDeliverer(deliverer);
    setFormData({
      name: deliverer.name || '',
      email: deliverer.email || '',
      phone: deliverer.phone || '',
      status: deliverer.status || 'Available',
      vehicleType: deliverer.vehicleType || '',
      licenseNumber: deliverer.licenseNumber || '',
      address: {
        street: deliverer.address?.street || '',
        city: deliverer.address?.city || '',
        state: deliverer.address?.state || '',
        zipCode: deliverer.address?.zipCode || '',
        country: deliverer.address?.country || 'USA',
      },
      emergencyContact: {
        name: deliverer.emergencyContact?.name || '',
        phone: deliverer.emergencyContact?.phone || '',
        relationship: deliverer.emergencyContact?.relationship || '',
      },
    });
    setModalMode('edit');
    setShowModal(true);
  };

  // Handle Create New Deliverer
  const handleCreateDeliverer = () => {
    resetForm();
    setModalMode('create');
    setShowModal(true);
  };

  // Get Status Icon
  const getStatusIcon = status => {
    switch (status) {
      case 'Available':
        return <CheckCircle size={16} className='text-green-500' />;
      case 'Busy':
        return <Clock size={16} className='text-amber-500' />;
      case 'Offline':
        return <UserX size={16} className='text-slate-400' />;
      case 'On Delivery':
        return <Package size={16} className='text-amber-500' />;
      case 'Off Duty':
        return <UserX size={16} className='text-slate-400' />;
      case 'On Break':
        return <Clock size={16} className='text-blue-500' />;
      default:
        return <AlertTriangle size={16} className='text-gray-500' />;
    }
  };

  // Get Vehicle Icon
  const getVehicleIcon = vehicleType => {
    switch (vehicleType) {
      case 'Car':
        return <Car size={16} className='text-blue-500' />;
      case 'Van':
        return <Car size={16} className='text-indigo-500' />;
      case 'Truck':
        return <Car size={16} className='text-purple-500' />;
      case 'Motorcycle':
        return <Car size={16} className='text-orange-500' />;
      case 'Bicycle':
        return <Car size={16} className='text-green-500' />;
      default:
        return <Car size={16} className='text-gray-500' />;
    }
  };

  // Statistics calculations
  const availableCount = deliverers.filter(
    d => d.status === 'Available'
  ).length;
  const busyCount = deliverers.filter(d => d.status === 'Busy').length;
  const offlineCount = deliverers.filter(d => d.status === 'Offline').length;

  if (loading && deliverers.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDeliverers} />;

  return (
    <div className='px-4 py-6 max-w-7xl mx-auto'>
      <div className='flex flex-col gap-6 md:flex-row md:items-start md:justify-between mb-8 bg-card p-6 rounded-xl shadow'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-bold'>
            <Car className='h-6 w-6 text-primary' />
            Deliverers
          </h1>
          <p className='text-muted-foreground'>
            Manage deliverers and their assigned deliveries
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchDeliverers}
            disabled={loading}
            className='flex items-center gap-2'
          >
            <RefreshCw
              className={loading ? 'animate-spin h-4 w-4' : 'h-4 w-4'}
            />
            Refresh
          </Button>
          <Button
            onClick={handleCreateDeliverer}
            size='sm'
            className='flex items-center gap-2'
          >
            <Plus className='h-4 w-4' />
            Add Deliverer
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6'>
        <div className='relative w-full md:max-w-md'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
          <Input
            type='text'
            placeholder='Search by name, email, phone...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>

        <div className='flex gap-2 items-center'>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size='sm'
            className='flex items-center gap-2'
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className='h-4 w-4' />
            Filters
          </Button>

          {(statusFilter || vehicleTypeFilter) && (
            <Button
              variant='destructive'
              size='sm'
              className='flex items-center gap-2'
              onClick={() => {
                setStatusFilter('');
                setVehicleTypeFilter('');
              }}
            >
              <X className='h-4 w-4' />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className='p-6 mb-6 bg-card rounded-xl shadow'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Status</label>
              <Select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value=''>All Statuses</option>
                <option value='Available'>Available</option>
                <option value='On Delivery'>On Delivery</option>
                <option value='Off Duty'>Off Duty</option>
                <option value='On Break'>On Break</option>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>Vehicle Type</label>
              <Select
                value={vehicleTypeFilter}
                onChange={e => setVehicleTypeFilter(e.target.value)}
              >
                <option value=''>All Vehicles</option>
                <option value='Car'>Car</option>
                <option value='Motorcycle'>Motorcycle</option>
                <option value='Bicycle'>Bicycle</option>
                <option value='Van'>Van</option>
                <option value='Truck'>Truck</option>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        <Card>
          <CardContent className='pt-6 flex flex-col items-center justify-center'>
            <span className='text-3xl font-bold'>{totalDocs}</span>
            <span className='text-sm text-muted-foreground'>
              Total Deliverers
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6 flex flex-col items-center justify-center'>
            <span className='text-3xl font-bold text-green-600'>
              {availableCount}
            </span>
            <span className='text-sm text-muted-foreground'>Available</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6 flex flex-col items-center justify-center'>
            <span className='text-3xl font-bold text-amber-500'>
              {busyCount}
            </span>
            <span className='text-sm text-muted-foreground'>On Delivery</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6 flex flex-col items-center justify-center'>
            <span className='text-3xl font-bold text-slate-400'>
              {offlineCount}
            </span>
            <span className='text-sm text-muted-foreground'>Offline</span>
          </CardContent>
        </Card>
      </div>

      {/* Deliverers Table */}
      <Card className='mb-6 overflow-hidden'>
        <Table>
          <THead>
            <TR className='bg-muted/50'>
              <TH>Deliverer</TH>
              <TH>Contact</TH>
              <TH>Status</TH>
              <TH>Vehicle</TH>
              <TH>License</TH>
              <TH>Deliveries</TH>
              <TH className='text-right'>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {deliverers.map(deliverer => (
              <TR key={deliverer._id}>
                <TD>
                  <div className='flex flex-col'>
                    <span className='font-medium'>{deliverer.name}</span>
                    <span className='text-xs text-muted-foreground'>
                      {deliverer.email}
                    </span>
                  </div>
                </TD>
                <TD>
                  <div className='flex flex-col'>
                    {deliverer.phone && (
                      <div className='flex items-center gap-1 text-sm'>
                        <Phone className='h-3 w-3 text-muted-foreground' />
                        <span>{deliverer.phone}</span>
                      </div>
                    )}
                    {deliverer.address?.city && (
                      <div className='flex items-center gap-1 text-sm'>
                        <MapPin className='h-3 w-3 text-muted-foreground' />
                        <span>{deliverer.address.city}</span>
                      </div>
                    )}
                  </div>
                </TD>
                <TD>
                  <Badge
                    variant={
                      deliverer.status === 'Available'
                        ? 'success'
                        : deliverer.status === 'On Delivery' ||
                            deliverer.status === 'Busy'
                          ? 'warning'
                          : 'secondary'
                    }
                    className='flex items-center gap-1'
                  >
                    {getStatusIcon(deliverer.status)}
                    {deliverer.status}
                  </Badge>
                </TD>
                <TD>
                  <div className='flex items-center gap-1 text-sm'>
                    {getVehicleIcon(deliverer.vehicleType)}
                    <span>{deliverer.vehicleType || 'Not specified'}</span>
                  </div>
                </TD>
                <TD>
                  <span className='text-sm'>
                    {deliverer.licenseNumber || 'N/A'}
                  </span>
                </TD>
                <TD>
                  <div className='flex items-center gap-1 text-sm'>
                    <Package className='h-3 w-3 text-muted-foreground' />
                    <span>{deliverer.deliveries?.length || 0}</span>
                  </div>
                </TD>
                <TD>
                  <div className='flex items-center justify-end gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0'
                      onClick={() => handleViewDeliverer(deliverer)}
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0'
                      onClick={() => handleViewStats(deliverer)}
                    >
                      <BarChart3 className='h-4 w-4' />
                    </Button>
                    {deliverer.status === 'Available' && (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0 text-blue-500 hover:text-blue-600'
                        onClick={() => handleOpenAssignModal(deliverer)}
                      >
                        <Link className='h-4 w-4' />
                      </Button>
                    )}
                    {isAdmin && (
                      <>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0'
                          onClick={() => handleEditDeliverer(deliverer)}
                        >
                          <Edit3 className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 text-red-500 hover:text-red-600'
                          onClick={() => handleDeleteDeliverer(deliverer._id)}
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

        {deliverers.length === 0 && !loading && (
          <div className='flex flex-col items-center justify-center py-12'>
            <Car className='h-12 w-12 text-muted-foreground mb-4' />
            <h3 className='text-lg font-medium mb-2'>No deliverers found</h3>
            <p className='text-sm text-muted-foreground mb-4'>
              Get started by adding your first deliverer to the team.
            </p>
            {isAdmin && (
              <Button
                onClick={handleCreateDeliverer}
                className='flex items-center gap-2'
              >
                <Plus className='h-4 w-4' />
                Add Deliverer
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between py-4 mb-6'>
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h2>
                {modalMode === 'create'
                  ? 'Add New Deliverer'
                  : 'Edit Deliverer'}
              </h2>
              <button onClick={() => setShowModal(false)} className='btn-close'>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDeliverer} className='modal-form'>
              <div className='form-section'>
                <h3>Basic Information</h3>
                <div className='form-row'>
                  <div className='form-group'>
                    <label>Name *</label>
                    <input
                      type='text'
                      value={formData.name}
                      onChange={e => handleFormChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className='form-group'>
                    <label>Email *</label>
                    <input
                      type='email'
                      value={formData.email}
                      onChange={e => handleFormChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className='form-row'>
                  <div className='form-group'>
                    <label>Phone</label>
                    <input
                      type='tel'
                      value={formData.phone}
                      onChange={e => handleFormChange('phone', e.target.value)}
                    />
                  </div>
                  <div className='form-group'>
                    <label>Status</label>
                    <select
                      value={formData.status}
                      onChange={e => handleFormChange('status', e.target.value)}
                    >
                      <option value='Available'>Available</option>
                      <option value='Busy'>Busy</option>
                      <option value='Offline'>Offline</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className='form-section'>
                <h3>Vehicle Information</h3>
                <div className='form-row'>
                  <div className='form-group'>
                    <label>Vehicle Type</label>
                    <select
                      value={formData.vehicleType}
                      onChange={e =>
                        handleFormChange('vehicleType', e.target.value)
                      }
                    >
                      <option value=''>Select vehicle type</option>
                      <option value='Car'>Car</option>
                      <option value='Motorcycle'>Motorcycle</option>
                      <option value='Van'>Van</option>
                      <option value='Truck'>Truck</option>
                      <option value='Bicycle'>Bicycle</option>
                    </select>
                  </div>
                  <div className='form-group'>
                    <label>License Number</label>
                    <input
                      type='text'
                      value={formData.licenseNumber}
                      onChange={e =>
                        handleFormChange('licenseNumber', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className='form-section'>
                <h3>Address</h3>
                <div className='form-group'>
                  <label>Street</label>
                  <input
                    type='text'
                    value={formData.address.street}
                    onChange={e =>
                      handleFormChange('address.street', e.target.value)
                    }
                  />
                </div>
                <div className='form-row'>
                  <div className='form-group'>
                    <label>City</label>
                    <input
                      type='text'
                      value={formData.address.city}
                      onChange={e =>
                        handleFormChange('address.city', e.target.value)
                      }
                    />
                  </div>
                  <div className='form-group'>
                    <label>State</label>
                    <input
                      type='text'
                      value={formData.address.state}
                      onChange={e =>
                        handleFormChange('address.state', e.target.value)
                      }
                    />
                  </div>
                  <div className='form-group'>
                    <label>ZIP Code</label>
                    <input
                      type='text'
                      value={formData.address.zipCode}
                      onChange={e =>
                        handleFormChange('address.zipCode', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className='form-section'>
                <h3>Emergency Contact</h3>
                <div className='form-row'>
                  <div className='form-group'>
                    <label>Name</label>
                    <input
                      type='text'
                      value={formData.emergencyContact.name}
                      onChange={e =>
                        handleFormChange(
                          'emergencyContact.name',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className='form-group'>
                    <label>Phone</label>
                    <input
                      type='tel'
                      value={formData.emergencyContact.phone}
                      onChange={e =>
                        handleFormChange(
                          'emergencyContact.phone',
                          e.target.value
                        )
                      }
                    />
                  </div>
                  <div className='form-group'>
                    <label>Relationship</label>
                    <input
                      type='text'
                      value={formData.emergencyContact.relationship}
                      onChange={e =>
                        handleFormChange(
                          'emergencyContact.relationship',
                          e.target.value
                        )
                      }
                      placeholder='e.g., Spouse, Parent, Sibling'
                    />
                  </div>
                </div>
              </div>

              <div className='modal-actions'>
                <button
                  type='button'
                  onClick={() => setShowModal(false)}
                  className='btn btn-secondary'
                >
                  Cancel
                </button>
                <button type='submit' className='btn btn-primary'>
                  {modalMode === 'create'
                    ? 'Create Deliverer'
                    : 'Update Deliverer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedDeliverer && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h2>Deliverer Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className='btn-close'
              >
                <X size={20} />
              </button>
            </div>

            <div className='deliverer-details'>
              <div className='details-section'>
                <h3>Basic Information</h3>
                <div className='details-grid'>
                  <div className='detail-item'>
                    <label>Name</label>
                    <span>{selectedDeliverer.name}</span>
                  </div>
                  <div className='detail-item'>
                    <label>Email</label>
                    <span>{selectedDeliverer.email}</span>
                  </div>
                  <div className='detail-item'>
                    <label>Phone</label>
                    <span>{selectedDeliverer.phone || 'Not provided'}</span>
                  </div>
                  <div className='detail-item'>
                    <label>Status</label>
                    <span
                      className={`status-badge status-${selectedDeliverer.status.toLowerCase()}`}
                    >
                      {getStatusIcon(selectedDeliverer.status)}
                      {selectedDeliverer.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className='details-section'>
                <h3>Vehicle Information</h3>
                <div className='details-grid'>
                  <div className='detail-item'>
                    <label>Vehicle Type</label>
                    <span>
                      {selectedDeliverer.vehicleType || 'Not specified'}
                    </span>
                  </div>
                  <div className='detail-item'>
                    <label>License Number</label>
                    <span>
                      {selectedDeliverer.licenseNumber || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedDeliverer.address && (
                <div className='details-section'>
                  <h3>Address</h3>
                  <div className='address-info'>
                    {selectedDeliverer.address.street && (
                      <div>{selectedDeliverer.address.street}</div>
                    )}
                    <div>
                      {[
                        selectedDeliverer.address.city,
                        selectedDeliverer.address.state,
                        selectedDeliverer.address.zipCode,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                </div>
              )}

              {selectedDeliverer.emergencyContact && (
                <div className='details-section'>
                  <h3>Emergency Contact</h3>
                  <div className='details-grid'>
                    <div className='detail-item'>
                      <label>Name</label>
                      <span>
                        {selectedDeliverer.emergencyContact.name ||
                          'Not provided'}
                      </span>
                    </div>
                    <div className='detail-item'>
                      <label>Phone</label>
                      <span>
                        {selectedDeliverer.emergencyContact.phone ||
                          'Not provided'}
                      </span>
                    </div>
                    <div className='detail-item'>
                      <label>Relationship</label>
                      <span>
                        {selectedDeliverer.emergencyContact.relationship ||
                          'Not provided'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className='details-section'>
                <h3>Activity</h3>
                <div className='details-grid'>
                  <div className='detail-item'>
                    <label>Total Deliveries</label>
                    <span>{selectedDeliverer.deliveries?.length || 0}</span>
                  </div>
                  <div className='detail-item'>
                    <label>Member Since</label>
                    <span>
                      {new Date(
                        selectedDeliverer.createdAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatsModal && selectedDeliverer && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h2>Performance Statistics - {selectedDeliverer.name}</h2>
              <button
                onClick={() => setShowStatsModal(false)}
                className='btn-close'
              >
                <X size={20} />
              </button>
            </div>

            <div className='stats-content'>
              {statsLoading ? (
                <LoadingSpinner />
              ) : delivererStats ? (
                <div className='performance-stats'>
                  <div className='stats-grid'>
                    <div className='stat-card'>
                      <div className='stat-value'>
                        {delivererStats.totalDeliveries}
                      </div>
                      <div className='stat-label'>Total Deliveries</div>
                    </div>
                    <div className='stat-card'>
                      <div className='stat-value'>
                        {delivererStats.delivered}
                      </div>
                      <div className='stat-label'>Completed</div>
                    </div>
                    <div className='stat-card'>
                      <div className='stat-value'>{delivererStats.pending}</div>
                      <div className='stat-label'>Pending</div>
                    </div>
                    <div className='stat-card'>
                      <div className='stat-value'>
                        {delivererStats.inTransit}
                      </div>
                      <div className='stat-label'>In Transit</div>
                    </div>
                  </div>

                  <div className='performance-metrics'>
                    <div className='metric-item'>
                      <label>Success Rate</label>
                      <div className='metric-value'>
                        {delivererStats.totalDeliveries > 0
                          ? `${((delivererStats.delivered / delivererStats.totalDeliveries) * 100).toFixed(1)}%`
                          : 'N/A'}
                      </div>
                    </div>
                    <div className='metric-item'>
                      <label>Average Delivery Time</label>
                      <div className='metric-value'>
                        {delivererStats.avgDeliveryTime
                          ? `${delivererStats.avgDeliveryTime.toFixed(1)} days`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='no-stats'>
                  <BarChart3 size={48} className='no-stats-icon' />
                  <p>No statistics available for this deliverer</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Delivery Modal */}
      {showAssignModal && (
        <div className='modal-overlay'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h2>Assign Delivery to {selectedDeliverer?.name}</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className='btn-close'
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignDelivery} className='modal-form'>
              <div className='form-section'>
                <h3>Select Delivery</h3>

                {loadingDeliveries ? (
                  <LoadingSpinner />
                ) : availableDeliveries.length === 0 ? (
                  <div className='empty-message'>
                    No available deliveries found
                  </div>
                ) : (
                  <div className='form-group'>
                    <label htmlFor='deliverySelect'>Available Deliveries</label>
                    <select
                      id='deliverySelect'
                      value={selectedDelivery}
                      onChange={e => setSelectedDelivery(e.target.value)}
                      required
                    >
                      <option value=''>Select a delivery</option>
                      {availableDeliveries.map(delivery => (
                        <option key={delivery._id} value={delivery._id}>
                          {delivery.orderId || delivery._id} -{' '}
                          {delivery.deliveryAddress}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className='modal-footer'>
                <button
                  type='button'
                  onClick={() => setShowAssignModal(false)}
                  className='btn btn-secondary'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='btn btn-primary'
                  disabled={!selectedDelivery || loadingDeliveries}
                >
                  Assign Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliverersPage;
