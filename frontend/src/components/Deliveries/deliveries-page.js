import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  Edit3,
  Clock,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Truck,
  XCircle,
  Package,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { deliveryAPI, delivererAPI } from '../../services/api';
import LoadingSpinner from '../UI/loading-spinner';
import ErrorMessage from '../UI/error-message';
import AddressAutocomplete from '../UI/address-autocomplete';
import { Badge } from '../UI/badge';
import { DeliveriesTable } from './deliveries-table';
import { Button } from '../UI/button';
import { Input } from '../UI/input';
import { Select } from '../UI/select';
import { Card, CardContent } from '../UI/card';

const DeliveriesPage = () => {
  // State Management
  const [deliveries, setDeliveries] = useState([]);
  const [deliverers, setDeliverers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [limit] = useState(10);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [delivererFilter, setDelivererFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    orderId: '',
    customer: '',
    deliveryAddress: '',
    status: 'Pending',
    priority: 'Medium',
    estimatedDeliveryDate: '',
    notes: '',
    deliverer: '',
  });

  // Get user role from localStorage
  const [userRole, setUserRole] = useState('user');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role || 'user');
    }
  }, []);

  // Fetch Deliveries
  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(delivererFilter && { deliverer: delivererFilter }),
      };

      const response = await deliveryAPI.getAll(params);
      setDeliveries(response.data.docs || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalDocs(response.data.totalDocs || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError('Failed to fetch deliveries');
      toast.error('Failed to fetch deliveries');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, statusFilter, priorityFilter, delivererFilter]);

  // Fetch Deliverers for Assignment
  const fetchDeliverers = useCallback(async () => {
    try {
      const response = await delivererAPI.getAll();
      setDeliverers(response.data.docs || response.data || []);
    } catch (err) {
      console.error('Error fetching deliverers:', err);
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  useEffect(() => {
    fetchDeliverers();
  }, [fetchDeliverers]);

  // Filtered deliveries for search
  const filteredDeliveries = deliveries.filter(
    delivery =>
      delivery.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.deliveryAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle Form Submission
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.customer.trim()) {
        toast.error('Customer name is required');
        setLoading(false);
        return;
      }

      if (!formData.deliveryAddress.trim()) {
        toast.error('Delivery address is required');
        setLoading(false);
        return;
      }

      // Validate estimated delivery date
      const estimatedDate = new Date(formData.estimatedDeliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

      if (estimatedDate < today) {
        toast.error('Estimated delivery date must be in the future');
        setLoading(false);
        return;
      }

      // Create submission data - omit orderId for new deliveries
      const submissionData =
        modalMode === 'create'
          ? {
              customer: formData.customer,
              deliveryAddress: formData.deliveryAddress,
              status: formData.status,
              priority: formData.priority,
              estimatedDeliveryDate: formData.estimatedDeliveryDate
                ? new Date(formData.estimatedDeliveryDate).toISOString()
                : undefined,
              notes: formData.notes,
              deliverer: formData.deliverer || undefined,
            }
          : {
              ...formData,
              estimatedDeliveryDate: formData.estimatedDeliveryDate
                ? new Date(formData.estimatedDeliveryDate).toISOString()
                : undefined,
              deliverer: formData.deliverer || undefined,
            };

      // Store previous deliverer ID if we're editing
      const previousDelivererId =
        modalMode === 'edit' ? selectedDelivery.deliverer?._id : null;

      if (modalMode === 'create') {
        console.log('Creating delivery with data:', submissionData);
        try {
          const response = await deliveryAPI.create(submissionData);
          console.log('Created delivery:', response.data);
          toast.success('Delivery created successfully!');
          setShowModal(false);
          resetForm();

          // Force refresh deliveries with a slight delay to ensure backend has updated
          setTimeout(() => {
            fetchDeliveries();
          }, 300);
        } catch (err) {
          console.error('Error creating delivery:', err);
          console.error('Error response data:', err.response?.data);

          if (
            err.response?.data?.errors &&
            Array.isArray(err.response.data.errors)
          ) {
            // Handle validation errors array
            err.response.data.errors.forEach(error => {
              toast.error(`${error.field}: ${error.message}`);
            });
          } else if (err.response?.data?.message) {
            // Handle single error message
            toast.error(err.response.data.message);
          } else {
            toast.error(
              'Failed to create delivery. Please check your input and try again.'
            );
          }
        }
        setLoading(false);
        return;
      } else {
        // Handle edit mode
        console.log('Updating delivery with data:', submissionData);
        try {
          await deliveryAPI.update(selectedDelivery._id, submissionData);
          toast.success('Delivery updated successfully!');

          // Update deliverer status if assigned
          if (
            formData.deliverer &&
            formData.deliverer !== previousDelivererId
          ) {
            try {
              await delivererAPI.updateStatus(formData.deliverer, 'Busy');
              console.log(
                `Updated deliverer ${formData.deliverer} status to Busy`
              );
            } catch (err) {
              console.error('Error updating deliverer status:', err);
            }
          }

          // If previous deliverer was unassigned, update their status to Available
          if (
            previousDelivererId &&
            previousDelivererId !== formData.deliverer
          ) {
            try {
              await delivererAPI.updateStatus(previousDelivererId, 'Available');
              console.log(
                `Updated previous deliverer ${previousDelivererId} status to Available`
              );
            } catch (err) {
              console.error('Error updating previous deliverer status:', err);
            }
          }

          setShowModal(false);
          resetForm();

          // Force refresh deliveries with a slight delay to ensure backend has updated
          setTimeout(() => {
            fetchDeliveries();
          }, 300);
        } catch (err) {
          console.error('Error updating delivery:', err);
          console.error('Error response data:', err.response?.data);

          if (
            err.response?.data?.errors &&
            Array.isArray(err.response.data.errors)
          ) {
            // Handle validation errors array
            err.response.data.errors.forEach(error => {
              toast.error(`${error.field}: ${error.message}`);
            });
          } else if (err.response?.data?.message) {
            // Handle single error message
            toast.error(err.response.data.message);
          } else {
            toast.error(
              'Failed to update delivery. Please check your input and try again.'
            );
          }
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('Error in form submission:', err);
      toast.error('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async deliveryId => {
    if (!window.confirm('Are you sure you want to delete this delivery?'))
      return;

    try {
      await deliveryAPI.delete(deliveryId);
      toast.success('Delivery deleted successfully!');
      fetchDeliveries();
    } catch (err) {
      console.error('Error deleting delivery:', err);
      toast.error('Failed to delete delivery');
    }
  };

  // Handle Status Update
  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      // Prevent users from changing status to "Delivered" or "In Transit"
      if (
        userRole !== 'admin' &&
        (newStatus === 'Delivered' || newStatus === 'In Transit')
      ) {
        toast.error(
          'Only administrators can mark deliveries as Delivered or In Transit'
        );
        return;
      }

      // Get the delivery to check if it has a deliverer assigned
      const deliveryToUpdate = deliveries.find(d => d._id === deliveryId);
      if (
        (newStatus === 'In Transit' || newStatus === 'Delivered') &&
        !deliveryToUpdate.deliverer
      ) {
        toast.error(
          `Cannot change status to ${newStatus}. A deliverer must be assigned first.`
        );
        return;
      }

      setLoading(true);
      console.log(`Updating delivery ${deliveryId} status to ${newStatus}`);
      const response = await deliveryAPI.updateStatus(deliveryId, newStatus);
      console.log('Status update response:', response);
      toast.success(`Status updated to ${newStatus}`);
      fetchDeliveries();
    } catch (err) {
      console.error('Error updating status:', err);
      console.error('Error details:', err.response?.data || err.message);

      // Handle specific error for missing deliverer
      if (err.response?.data?.message?.includes('deliverer must be assigned')) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Failed to update status');
      }
    } finally {
      setLoading(false);
    }
  };

  // Modal Handlers
  const openCreateModal = () => {
    setModalMode('create');
    resetForm();

    // Set tomorrow as the default estimated delivery date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    setFormData(prev => ({
      ...prev,
      estimatedDeliveryDate: tomorrowStr,
      status: 'Pending', // Always set to Pending for new deliveries
    }));

    setShowModal(true);
  };

  const openEditModal = delivery => {
    setModalMode('edit');
    setSelectedDelivery(delivery);
    setFormData({
      orderId: delivery.orderId || '',
      customer: delivery.customer || '',
      deliveryAddress: delivery.deliveryAddress || '',
      status: delivery.status || 'Pending',
      priority: delivery.priority || 'Medium',
      estimatedDeliveryDate: delivery.estimatedDeliveryDate
        ? new Date(delivery.estimatedDeliveryDate).toISOString().split('T')[0]
        : '',
      notes: delivery.notes || '',
      deliverer: delivery.deliverer?._id || '',
    });
    setShowModal(true);
  };

  const openViewModal = delivery => {
    setSelectedDelivery(delivery);
    setShowViewModal(true);
  };

  // Reset Form
  const resetForm = () => {
    // Set tomorrow as the default estimated delivery date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    setFormData({
      orderId: '', // This will be auto-generated by the backend
      customer: '',
      deliveryAddress: '',
      status: 'Pending',
      priority: 'Medium',
      estimatedDeliveryDate: tomorrowStr,
      notes: '',
      deliverer: '',
    });
    setSelectedDelivery(null);
  };

  // Clear Filters
  const clearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setDelivererFilter('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const variantMap = {
      Delivered: 'success',
      'In Transit': 'info',
      Pending: 'outline',
      Cancelled: 'destructive',
    };
    return <Badge variant={variantMap[status] || 'outline'}>{status}</Badge>;
  };

  // Priority Badge Component
  const PriorityBadge = ({ priority }) => {
    const variantMap = {
      Urgent: 'destructive',
      High: 'warning',
      Medium: 'secondary',
      Low: 'outline',
    };
    return (
      <Badge variant={variantMap[priority] || 'secondary'}>{priority}</Badge>
    );
  };

  if (loading && deliveries.length === 0) {
    return <LoadingSpinner />;
  }

  if (error && deliveries.length === 0) {
    return (
      <ErrorMessage message={error} onRetry={() => window.location.reload()} />
    );
  }

  return (
    <div className='deliveries-page px-4 py-6 max-w-7xl mx-auto'>
      {/* Header */}
      <div className='deliveries-header flex flex-col gap-6 md:flex-row md:items-start md:justify-between mb-8 bg-card p-6 rounded-xl shadow'>
        <div className='header-left'>
          <h1 className='page-title flex items-center gap-2 text-2xl font-bold'>
            <Package className='h-6 w-6 text-primary' />
            Deliveries Management
          </h1>
          <p className='text-muted-foreground'>
            Manage and track all delivery orders
          </p>
        </div>
        <div className='header-actions flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchDeliveries}
            disabled={loading}
            className='flex items-center gap-2'
          >
            <RefreshCw
              className={loading ? 'animate-spin h-4 w-4' : 'h-4 w-4'}
            />
            Refresh
          </Button>
          <Button
            onClick={openCreateModal}
            size='sm'
            className='flex items-center gap-2'
          >
            <Plus className='h-4 w-4' /> New Delivery
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6'>
        <div className='relative w-full md:max-w-md'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
          <Input
            type='text'
            placeholder='Search by Order ID, Customer, or Address...'
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

          {(statusFilter || priorityFilter || delivererFilter) && (
            <Button
              variant='destructive'
              size='sm'
              className='flex items-center gap-2'
              onClick={clearFilters}
            >
              <X className='h-4 w-4' />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 p-6 mb-6 bg-card rounded-xl shadow'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Status</label>
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value=''>All Statuses</option>
              <option value='Pending'>Pending</option>
              <option value='In Transit'>In Transit</option>
              <option value='Delivered'>Delivered</option>
              <option value='Cancelled'>Cancelled</option>
            </Select>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Priority</label>
            <Select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
            >
              <option value=''>All Priorities</option>
              <option value='Low'>Low</option>
              <option value='Medium'>Medium</option>
              <option value='High'>High</option>
              <option value='Urgent'>Urgent</option>
            </Select>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Deliverer</label>
            <Select
              value={delivererFilter}
              onChange={e => setDelivererFilter(e.target.value)}
            >
              <option value=''>All Deliverers</option>
              {deliverers.map(deliverer => (
                <option key={deliverer._id} value={deliverer._id}>
                  {deliverer.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        <Card>
          <CardContent className='pt-6 flex flex-col items-center justify-center'>
            <span className='text-3xl font-bold'>{totalDocs}</span>
            <span className='text-sm text-muted-foreground'>
              Total Deliveries
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6 flex flex-col items-center justify-center'>
            <span className='text-3xl font-bold'>
              {filteredDeliveries.filter(d => d.status === 'Pending').length}
            </span>
            <span className='text-sm text-muted-foreground'>Pending</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6 flex flex-col items-center justify-center'>
            <span className='text-3xl font-bold'>
              {filteredDeliveries.filter(d => d.status === 'In Transit').length}
            </span>
            <span className='text-sm text-muted-foreground'>In Transit</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6 flex flex-col items-center justify-center'>
            <span className='text-3xl font-bold'>
              {filteredDeliveries.filter(d => d.status === 'Delivered').length}
            </span>
            <span className='text-sm text-muted-foreground'>Delivered</span>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries Table */}
      <DeliveriesTable
        deliveries={filteredDeliveries}
        loading={loading}
        onView={openViewModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
        onCreate={openCreateModal}
      />

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
          <div className='modal'>
            <div className='modal-header'>
              <h3>
                {modalMode === 'create'
                  ? 'Create New Delivery'
                  : 'Edit Delivery'}
              </h3>
              <button
                className='modal-close'
                onClick={() => setShowModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className='modal-form'>
              {modalMode === 'edit' && (
                <div className='form-row'>
                  <div className='form-group'>
                    <label>Order ID *</label>
                    <input
                      type='text'
                      value={formData.orderId}
                      onChange={e =>
                        setFormData({ ...formData, orderId: e.target.value })
                      }
                      required
                      disabled={true}
                      placeholder='Auto-generated for new deliveries'
                    />
                  </div>
                  <div className='form-group'>
                    <label>Customer *</label>
                    <input
                      type='text'
                      value={formData.customer}
                      onChange={e =>
                        setFormData({ ...formData, customer: e.target.value })
                      }
                      required
                      placeholder='Customer name'
                    />
                  </div>
                </div>
              )}

              {modalMode === 'create' && (
                <div className='form-group'>
                  <label>Customer *</label>
                  <input
                    type='text'
                    value={formData.customer}
                    onChange={e =>
                      setFormData({ ...formData, customer: e.target.value })
                    }
                    required
                    placeholder='Customer name'
                  />
                </div>
              )}

              <div className='form-group'>
                <label>Delivery Address</label>
                <AddressAutocomplete
                  value={formData.deliveryAddress}
                  onChange={address =>
                    setFormData({ ...formData, deliveryAddress: address })
                  }
                  placeholder='Enter delivery address'
                  disabled={loading}
                />
                <small className='form-hint'>
                  Start typing to see address suggestions
                </small>
              </div>

              <div className='form-row'>
                <div className='form-group'>
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={e =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    disabled={modalMode === 'create'} // Disable status selection for new deliveries
                  >
                    <option value='Pending'>Pending</option>
                    <option value='In Transit'>In Transit</option>
                    <option value='Delivered'>Delivered</option>
                    <option value='Cancelled'>Cancelled</option>
                  </select>
                  {modalMode === 'create' && (
                    <small className='form-hint'>
                      New deliveries are always set to "Pending" status
                    </small>
                  )}
                </div>
                <div className='form-group'>
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                  >
                    <option value='Low'>Low</option>
                    <option value='Medium'>Medium</option>
                    <option value='High'>High</option>
                    <option value='Urgent'>Urgent</option>
                  </select>
                </div>
              </div>

              <div className='form-row'>
                <div className='form-group'>
                  <label>Estimated Delivery Date *</label>
                  <input
                    type='date'
                    value={formData.estimatedDeliveryDate}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        estimatedDeliveryDate: e.target.value,
                      })
                    }
                    required
                  />
                  <small className='form-hint'>Must be a future date</small>
                </div>
                {userRole === 'admin' && (
                  <div className='form-group'>
                    <label>Assign Deliverer</label>
                    <select
                      value={formData.deliverer}
                      onChange={e =>
                        setFormData({ ...formData, deliverer: e.target.value })
                      }
                    >
                      <option value=''>Select deliverer (optional)</option>
                      {deliverers.map(deliverer => (
                        <option key={deliverer._id} value={deliverer._id}>
                          {deliverer.name} - {deliverer.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className='form-group'>
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder='Additional notes or instructions'
                  rows='3'
                />
              </div>

              <div className='modal-actions'>
                <button
                  type='button'
                  className='btn-secondary'
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='btn-primary'
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className='spinning' size={16} />
                      {modalMode === 'create' ? 'Creating...' : 'Updating...'}
                    </>
                  ) : modalMode === 'create' ? (
                    'Create Delivery'
                  ) : (
                    'Update Delivery'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedDelivery && (
        <div className='modal-overlay'>
          <div className='modal view-modal'>
            <div className='modal-header'>
              <h3>Delivery Details</h3>
              <button
                className='modal-close'
                onClick={() => setShowViewModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className='delivery-details'>
              <div className='detail-section'>
                <h4>Basic Information</h4>
                <div className='detail-grid'>
                  <div className='detail-item'>
                    <label>Order ID</label>
                    <span className='detail-value'>
                      {selectedDelivery.orderId}
                    </span>
                  </div>
                  <div className='detail-item'>
                    <label>Customer</label>
                    <span className='detail-value'>
                      {selectedDelivery.customer}
                    </span>
                  </div>
                  <div className='detail-item'>
                    <label>Status</label>
                    <StatusBadge status={selectedDelivery.status} />
                  </div>
                  <div className='detail-item'>
                    <label>Priority</label>
                    <PriorityBadge priority={selectedDelivery.priority} />
                  </div>
                </div>
              </div>

              <div className='detail-section'>
                <h4>Delivery Information</h4>
                <div className='detail-grid'>
                  <div className='detail-item full-width'>
                    <label>Delivery Address</label>
                    <span className='detail-value'>
                      {selectedDelivery.deliveryAddress ||
                        'No address provided'}
                    </span>
                  </div>
                  <div className='detail-item'>
                    <label>Estimated Date</label>
                    <span className='detail-value'>
                      {selectedDelivery.estimatedDeliveryDate
                        ? new Date(
                            selectedDelivery.estimatedDeliveryDate
                          ).toLocaleDateString()
                        : 'Not set'}
                    </span>
                  </div>
                  <div className='detail-item'>
                    <label>Actual Date</label>
                    <span className='detail-value'>
                      {selectedDelivery.actualDeliveryDate
                        ? new Date(
                            selectedDelivery.actualDeliveryDate
                          ).toLocaleDateString()
                        : 'Not delivered yet'}
                    </span>
                  </div>
                </div>
              </div>

              <div className='detail-section'>
                <h4>Assignment & Tracking</h4>
                <div className='detail-grid'>
                  <div className='detail-item'>
                    <label>Assigned Deliverer</label>
                    <span className='detail-value'>
                      {selectedDelivery.deliverer
                        ? `${selectedDelivery.deliverer.name} (${selectedDelivery.deliverer.email})`
                        : 'Unassigned'}
                    </span>
                  </div>
                  <div className='detail-item'>
                    <label>Created Date</label>
                    <span className='detail-value'>
                      {new Date(
                        selectedDelivery.createdAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className='detail-item'>
                    <label>Created By</label>
                    <span className='detail-value'>
                      {selectedDelivery.createdBy?.email || 'System'}
                    </span>
                  </div>
                  <div className='detail-item'>
                    <label>Last Updated</label>
                    <span className='detail-value'>
                      {new Date(
                        selectedDelivery.updatedAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {selectedDelivery.notes && (
                <div className='detail-section'>
                  <h4>Notes</h4>
                  <div className='notes-content'>{selectedDelivery.notes}</div>
                </div>
              )}

              <div className='quick-actions'>
                <h4>Quick Actions</h4>
                <div className='quick-action-buttons'>
                  {userRole === 'admin' &&
                    selectedDelivery.status !== 'Delivered' && (
                      <button
                        className={`btn-success ${!selectedDelivery.deliverer ? 'disabled' : ''}`}
                        onClick={() => {
                          if (selectedDelivery.deliverer) {
                            handleStatusUpdate(
                              selectedDelivery._id,
                              'Delivered'
                            );
                            setShowViewModal(false);
                          } else {
                            toast.error(
                              'Cannot mark as Delivered. A deliverer must be assigned first.'
                            );
                          }
                        }}
                        disabled={!selectedDelivery.deliverer}
                        title={
                          !selectedDelivery.deliverer
                            ? 'A deliverer must be assigned first'
                            : 'Mark as delivered'
                        }
                      >
                        <CheckCircle size={16} />
                        Mark Delivered
                      </button>
                    )}
                  {userRole === 'admin' &&
                    selectedDelivery.status === 'Pending' && (
                      <button
                        className={`btn-primary ${!selectedDelivery.deliverer ? 'disabled' : ''}`}
                        onClick={() => {
                          if (selectedDelivery.deliverer) {
                            handleStatusUpdate(
                              selectedDelivery._id,
                              'In Transit'
                            );
                            setShowViewModal(false);
                          } else {
                            toast.error(
                              'Cannot mark as In Transit. A deliverer must be assigned first.'
                            );
                          }
                        }}
                        disabled={!selectedDelivery.deliverer}
                        title={
                          !selectedDelivery.deliverer
                            ? 'A deliverer must be assigned first'
                            : 'Mark as in transit'
                        }
                      >
                        <Truck size={16} />
                        Mark In Transit
                      </button>
                    )}
                  <button
                    className='btn-secondary'
                    onClick={() => {
                      setShowViewModal(false);
                      openEditModal(selectedDelivery);
                    }}
                  >
                    <Edit3 size={16} />
                    Edit Delivery
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveriesPage;
