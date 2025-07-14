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
import { useTranslation } from 'react-i18next';
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

// Fallback data for development/demo purposes
const fallbackDeliveries = [
  {
    _id: 'del1',
    orderId: 'ORD-12345',
    customer: 'John Doe',
    deliveryAddress: '123 Main St, Anytown, CA 90210',
    status: 'Pending',
    priority: 'Medium',
    estimatedDeliveryDate: '2025-07-15T14:00:00Z',
    notes: 'Leave at front door',
    deliverer: null
  },
  {
    _id: 'del2',
    orderId: 'ORD-67890',
    customer: 'Jane Smith',
    deliveryAddress: '456 Oak Ave, Somewhere, NY 10001',
    status: 'In Transit',
    priority: 'High',
    estimatedDeliveryDate: '2025-07-12T10:30:00Z',
    notes: 'Call customer before delivery',
    deliverer: {
      _id: 'driver1',
      name: 'Michael Brown',
      phone: '555-456-7890'
    }
  },
  {
    _id: 'del3',
    orderId: 'ORD-54321',
    customer: 'Robert Johnson',
    deliveryAddress: '789 Pine St, Elsewhere, TX 75001',
    status: 'Delivered',
    priority: 'Low',
    estimatedDeliveryDate: '2025-07-10T16:45:00Z',
    notes: '',
    deliverer: {
      _id: 'driver2',
      name: 'Sarah Johnson',
      phone: '555-987-6543'
    }
  }
];

// Fallback deliverers data
const fallbackDeliverers = [
  {
    _id: 'driver1',
    name: 'Michael Brown',
    email: 'michael.b@example.com',
    phone: '555-456-7890',
    status: 'Available'
  },
  {
    _id: 'driver2',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '555-987-6543',
    status: 'On Delivery'
  },
  {
    _id: 'driver3',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '555-123-4567',
    status: 'Available'
  }
];

const DeliveriesPage = () => {
  const { t } = useTranslation(['deliveries', 'common']);
  
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
      setDeliveries(response.docs || []);
      setTotalPages(response.totalPages || 1);
      setTotalDocs(response.totalDocs || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching deliveries:', err);
      setError('Failed to fetch deliveries');
      toast.error('Failed to fetch deliveries. Using demo data instead.');
      
      // Use fallback data when API fails
      setDeliveries(fallbackDeliveries);
      setTotalPages(1);
      setTotalDocs(fallbackDeliveries.length);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, statusFilter, priorityFilter, delivererFilter]);

  // Fetch Deliverers for Assignment
  const fetchDeliverers = useCallback(async () => {
    try {
      const response = await delivererAPI.getAll();
      // Store all deliverers
      const allDeliverers = response.docs || response || [];
      setDeliverers(allDeliverers);
    } catch (err) {
      console.error('Error fetching deliverers:', err);
      toast.error('Failed to fetch deliverers. Using demo data instead.');
      
      // Use fallback data when API fails
      setDeliverers(fallbackDeliverers);
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

  // Debug logs
  useEffect(() => {
    console.log('Deliveries state:', deliveries);
    console.log('Filtered deliveries:', filteredDeliveries);
    console.log('Search term:', searchTerm);
    console.log('Status filter:', statusFilter);
    console.log('Priority filter:', priorityFilter);
    console.log('Deliverer filter:', delivererFilter);
  }, [deliveries, filteredDeliveries, searchTerm, statusFilter, priorityFilter, delivererFilter]);

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

      // Convert status and priority to the format expected by the backend
      const convertStatus = (status) => {
        switch(status) {
          case 'PENDING': return 'Pending';
          case 'IN_TRANSIT': return 'In Transit';
          case 'DELIVERED': return 'Delivered';
          case 'CANCELLED': return 'Cancelled';
          default: return status;
        }
      };

      const convertPriority = (priority) => {
        switch(priority) {
          case 'LOW': return 'Low';
          case 'MEDIUM': return 'Medium';
          case 'HIGH': return 'High';
          case 'URGENT': return 'Urgent';
          default: return priority;
        }
      };

      // Create submission data - omit orderId for new deliveries
      const submissionData =
        modalMode === 'create'
          ? {
              customer: formData.customer,
              deliveryAddress: formData.deliveryAddress,
              status: convertStatus(formData.status), // Convert to format expected by backend
              priority: convertPriority(formData.priority), // Convert to format expected by backend
              estimatedDeliveryDate: formData.estimatedDeliveryDate
                ? new Date(formData.estimatedDeliveryDate).toISOString()
                : undefined,
              notes: formData.notes,
              deliverer: formData.deliverer || undefined,
            }
          : {
              ...formData,
              status: convertStatus(formData.status), // Convert to format expected by backend
              priority: convertPriority(formData.priority), // Convert to format expected by backend
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
          console.log('Created delivery:', response);
          toast.success('Delivery created successfully!');
          setShowModal(false);
          resetForm();

          // Force refresh deliveries with a slight delay to ensure backend has updated
          setTimeout(() => {
            fetchDeliveries();
          }, 300);
        } catch (err) {
          console.error('Error creating delivery:', err);
          
          if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
            // Handle validation errors array
            err.response.data.errors.forEach(error => {
              toast.error(`${error.field}: ${error.message}`);
            });
          } else if (err.response?.data?.message) {
            // Handle single error message
            toast.error(err.response.data.message);
          } else if (err.message) {
            toast.error(err.message);
          } else {
            toast.error('Failed to create delivery. Please check your input and try again.');
          }
          
          // Don't close the modal or reset the form so the user can fix the issues
          setLoading(false);
        }
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
                `Updated deliverer ${previousDelivererId} status to Available`
              );
            } catch (err) {
              console.error('Error updating deliverer status:', err);
            }
          }

          setShowModal(false);
          resetForm();
          fetchDeliveries();
        } catch (err) {
          console.error('Error updating delivery:', err);
          
          if (err.response?.data?.message) {
            toast.error(err.response.data.message);
          } else if (err.message) {
            toast.error(err.message);
          } else {
            toast.error('Failed to update delivery');
          }
          
          // Don't close the modal or reset the form so the user can fix the issues
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async delivery => {
    if (!window.confirm('Are you sure you want to delete this delivery?'))
      return;

    try {
      // Check if the parameter is a delivery object or just an ID
      const deliveryId = typeof delivery === 'object' ? delivery._id : delivery;
      
      if (!deliveryId) {
        console.error('Invalid delivery ID:', deliveryId);
        toast.error('Cannot delete delivery: Invalid ID');
        return;
      }
      
      console.log(`Deleting delivery with ID: ${deliveryId}`);
      await deliveryAPI.delete(deliveryId);
      toast.success('Delivery deleted successfully!');
      fetchDeliveries();
    } catch (err) {
      console.error('Error deleting delivery:', err);
      toast.error(`Failed to delete delivery: ${err.message || 'Unknown error'}`);
    }
  };

  // Handle Status Update
  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      // Convert status to the format expected by the backend
      const convertStatus = (status) => {
        switch(status) {
          case 'PENDING': return 'Pending';
          case 'IN_TRANSIT': return 'In Transit';
          case 'DELIVERED': return 'Delivered';
          case 'CANCELLED': return 'Cancelled';
          default: return status;
        }
      };
      
      const backendStatus = convertStatus(newStatus.toUpperCase().replace(' ', '_'));
      
      // Prevent users from changing status to "Delivered" or "In Transit"
      if (
        userRole !== 'admin' &&
        (backendStatus === 'Delivered' || backendStatus === 'In Transit')
      ) {
        toast.error(
          'Only administrators can mark deliveries as Delivered or In Transit'
        );
        return;
      }

      // Get the delivery to check if it has a deliverer assigned
      const deliveryToUpdate = deliveries.find(d => d._id === deliveryId);
      if (
        (backendStatus === 'In Transit' || backendStatus === 'Delivered') &&
        !deliveryToUpdate.deliverer
      ) {
        toast.error(
          `Cannot change status to ${newStatus}. A deliverer must be assigned first.`
        );
        return;
      }

      // Store the deliverer ID if the delivery is being marked as delivered
      const delivererId = 
        backendStatus === 'Delivered' && deliveryToUpdate.deliverer 
          ? deliveryToUpdate.deliverer._id 
          : null;

      setLoading(true);
      console.log(`Updating delivery ${deliveryId} status to ${backendStatus}`);
      const response = await deliveryAPI.updateStatus(deliveryId, backendStatus);
      console.log('Status update response:', response);
      
      // If the delivery was marked as delivered and had a deliverer assigned,
      // the backend should have updated the deliverer status to "Available"
      if (backendStatus === 'Delivered' && delivererId) {
        console.log(`Delivery marked as delivered. Deliverer ${delivererId} should be available now.`);
        toast.success(`Status updated to ${newStatus} and deliverer is now Available`);
      } else {
        toast.success(`Status updated to ${newStatus}`);
      }
      
      // Refresh both deliveries and deliverers lists
      await fetchDeliveries();
      
      // If we're updating to Delivered, also refresh the deliverers list
      if (backendStatus === 'Delivered' && delivererId) {
        try {
          await fetchDeliverers();
        } catch (err) {
          console.error('Error refreshing deliverers after status update:', err);
        }
      }
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
      status: 'PENDING', // Keep as uppercase for UI consistency, will be converted during submission
    }));

    setShowModal(true);
  };

  const openEditModal = delivery => {
    setModalMode('edit');
    setSelectedDelivery(delivery);
    
    // Normalize status and priority to uppercase format for UI consistency
    const normalizedStatus = delivery.status === 'Pending' ? 'PENDING' :
                            delivery.status === 'In Transit' ? 'IN_TRANSIT' :
                            delivery.status === 'Delivered' ? 'DELIVERED' :
                            delivery.status === 'Cancelled' ? 'CANCELLED' :
                            delivery.status?.toUpperCase() || 'PENDING';
                            
    const normalizedPriority = delivery.priority === 'Low' ? 'LOW' :
                              delivery.priority === 'Medium' ? 'MEDIUM' :
                              delivery.priority === 'High' ? 'HIGH' :
                              delivery.priority === 'Urgent' ? 'URGENT' :
                              delivery.priority?.toUpperCase() || 'MEDIUM';
    
    setFormData({
      orderId: delivery.orderId || '',
      customer: delivery.customer || '',
      deliveryAddress: delivery.deliveryAddress || '',
      status: normalizedStatus,
      priority: normalizedPriority,
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
      status: 'PENDING', // Keep as uppercase for UI consistency, will be converted during submission
      priority: 'MEDIUM', // Keep as uppercase for UI consistency, will be converted during submission
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
    // Map backend status values to UI display values
    const normalizedStatus = status === 'PENDING' ? 'Pending' :
                            status === 'IN_TRANSIT' ? 'In Transit' :
                            status === 'DELIVERED' ? 'Delivered' :
                            status === 'CANCELLED' ? 'Cancelled' :
                            status; // Use as-is if not matching

    const statusColors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Transit': 'bg-blue-100 text-blue-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_TRANSIT': 'bg-blue-100 text-blue-800',
      'DELIVERED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };
    
    return (
      <Badge className={statusColors[normalizedStatus] || 'bg-gray-100 text-gray-800'}>
        {normalizedStatus}
      </Badge>
    );
  };

  // Priority Badge Component
  const PriorityBadge = ({ priority }) => {
    // Map backend priority values to UI display values
    const normalizedPriority = priority === 'HIGH' ? 'High' :
                              priority === 'MEDIUM' ? 'Medium' :
                              priority === 'LOW' ? 'Low' :
                              priority === 'URGENT' ? 'Urgent' :
                              priority; // Use as-is if not matching

    const priorityColors = {
      'Low': 'bg-blue-100 text-blue-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Urgent': 'bg-red-100 text-red-800',
      'LOW': 'bg-blue-100 text-blue-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800',
    };
    
    return (
      <Badge className={priorityColors[normalizedPriority] || 'bg-gray-100 text-gray-800'}>
        {normalizedPriority}
      </Badge>
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
    <div className='mx-auto max-w-7xl px-4 py-6'>
      {/* Header */}
      <div className='mb-8 flex flex-col gap-6 rounded-xl bg-card p-6 shadow md:flex-row md:items-start md:justify-between'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-bold'>
            <Package className='h-6 w-6 text-primary' />
            {t('title')}
          </h1>
          <p className='text-muted-foreground'>
            {t('deliveryDetails')}
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchDeliveries}
            disabled={loading}
            className='flex items-center gap-2'
          >
            <RefreshCw
              className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
            />
            {t('common:refresh')}
          </Button>
          <Button
            onClick={openCreateModal}
            size='sm'
            className='flex items-center gap-2'
          >
            <Plus className='h-4 w-4' /> {t('newDelivery')}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className='mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center'>
        <div className='relative w-full md:max-w-md'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='text'
            placeholder={t('deliveries:destinationPlaceholder')}
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
            {t('common:filter')}
          </Button>

          {(statusFilter || priorityFilter || delivererFilter) && (
            <Button
              variant='destructive'
              size='sm'
              className='flex items-center gap-2'
              onClick={clearFilters}
            >
              <X className='h-4 w-4' />
              {t('common:clear')}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className='mb-6 grid grid-cols-1 gap-6 rounded-xl bg-card p-6 shadow md:grid-cols-3'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>{t('status')}</label>
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value=''>{t('filters.all')}</option>
              <option value='Pending'>{t('statuses.pending')}</option>
              <option value='In Transit'>{t('statuses.inTransit')}</option>
              <option value='Delivered'>{t('statuses.delivered')}</option>
              <option value='Cancelled'>{t('statuses.cancelled')}</option>
            </Select>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>{t('priority')}</label>
            <Select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
            >
              <option value=''>{t('filters.all')}</option>
              <option value='Low'>{t('priorities.low')}</option>
              <option value='Medium'>{t('priorities.medium')}</option>
              <option value='High'>{t('priorities.high')}</option>
              <option value='Urgent'>{t('priorities.urgent')}</option>
            </Select>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium'>{t('deliverer')}</label>
            <Select
              value={delivererFilter}
              onChange={e => setDelivererFilter(e.target.value)}
            >
              <option value=''>{t('filters.all')}</option>
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
      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-3xl font-bold'>{totalDocs}</span>
            <span className='text-sm text-muted-foreground'>
              {t('deliveriesTotal', { ns: 'dashboard' })}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-3xl font-bold'>
              {filteredDeliveries.filter(d => d.status === 'PENDING' || d.status === 'Pending').length}
            </span>
            <span className='text-sm text-muted-foreground'>{t('statuses.pending')}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-3xl font-bold'>
              {filteredDeliveries.filter(d => d.status === 'IN_TRANSIT' || d.status === 'In Transit').length}
            </span>
            <span className='text-sm text-muted-foreground'>{t('statuses.inTransit')}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-3xl font-bold'>
              {filteredDeliveries.filter(d => d.status === 'DELIVERED' || d.status === 'Delivered').length}
            </span>
            <span className='text-sm text-muted-foreground'>{t('statuses.delivered')}</span>
          </CardContent>
        </Card>
      </div>

      {/* Deliveries Table */}
      <DeliveriesTable
        data={filteredDeliveries}
        loading={loading}
        onView={openViewModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
        userRole={userRole}
      />

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
            {t('common:previous')}
          </Button>

          <div className='text-sm text-muted-foreground'>
            {t('common:page')} {currentPage} {t('common:of')} {totalPages} ({totalDocs} {t('common:total')})
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
            {t('common:next')}
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl'>
            <div className='mb-4 flex items-center justify-between border-b pb-4'>
              <h3 className='text-xl font-semibold'>
                {modalMode === 'create'
                  ? t('newDelivery')
                  : t('editDelivery')}
              </h3>
              <button
                className='rounded-full p-1 hover:bg-gray-100'
                onClick={() => setShowModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
              {modalMode === 'edit' && (
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Order ID *</label>
                    <input
                      type='text'
                      value={formData.orderId}
                      onChange={e =>
                        setFormData({ ...formData, orderId: e.target.value })
                      }
                      required
                      disabled={true}
                      placeholder='Auto-generated for new deliveries'
                      className='w-full rounded-md border border-gray-300 px-3 py-2'
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Customer *</label>
                    <input
                      type='text'
                      value={formData.customer}
                      onChange={e =>
                        setFormData({ ...formData, customer: e.target.value })
                      }
                      required
                      placeholder='Customer name'
                      className='w-full rounded-md border border-gray-300 px-3 py-2'
                    />
                  </div>
                </div>
              )}

              {modalMode === 'create' && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Customer *</label>
                  <input
                    type='text'
                    value={formData.customer}
                    onChange={e =>
                      setFormData({ ...formData, customer: e.target.value })
                    }
                    required
                    placeholder='Customer name'
                    className='w-full rounded-md border border-gray-300 px-3 py-2'
                  />
                </div>
              )}

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Delivery Address</label>
                <AddressAutocomplete
                  value={formData.deliveryAddress}
                  onChange={address =>
                    setFormData({ ...formData, deliveryAddress: address })
                  }
                  placeholder='Enter delivery address'
                  disabled={loading}
                />
                <small className='text-xs text-gray-500'>
                  Start typing to see address suggestions
                </small>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {/* Only show Status field in edit mode */}
                {modalMode === 'edit' && (
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Status</label>
                    <select
                      value={formData.status}
                      onChange={e =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className='w-full rounded-md border border-gray-300 px-3 py-2'
                    >
                      <option value='PENDING'>{t('statuses.pending')}</option>
                      <option value='IN_TRANSIT'>{t('statuses.inTransit')}</option>
                      <option value='DELIVERED'>{t('statuses.delivered')}</option>
                      <option value='CANCELLED'>{t('statuses.cancelled')}</option>
                    </select>
                  </div>
                )}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className='w-full rounded-md border border-gray-300 px-3 py-2'
                  >
                    <option value='LOW'>{t('priorities.low')}</option>
                    <option value='MEDIUM'>{t('priorities.medium')}</option>
                    <option value='HIGH'>{t('priorities.high')}</option>
                    <option value='URGENT'>{t('priorities.urgent')}</option>
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Estimated Delivery Date *</label>
                  <input
                    type='date'
                    value={formData.estimatedDeliveryDate}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        estimatedDeliveryDate: e.target.value,
                      })
                    }
                    min={new Date().toISOString().split('T')[0]} // Set minimum date to today
                    required
                    className='w-full rounded-md border border-gray-300 px-3 py-2'
                  />
                  <small className='text-xs text-gray-500'>Must be a future date</small>
                </div>
                {userRole === 'admin' && (
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Assign Deliverer</label>
                    <select
                      value={formData.deliverer}
                      onChange={e =>
                        setFormData({ ...formData, deliverer: e.target.value })
                      }
                      className='w-full rounded-md border border-gray-300 px-3 py-2'
                    >
                      <option value=''>{t('unassigned')}</option>
                      {/* Filter to only show available deliverers */}
                      {deliverers
                        .filter(deliverer => deliverer.status === 'Available')
                        .map(deliverer => (
                          <option key={deliverer._id} value={deliverer._id}>
                            {deliverer.name} - {deliverer.email}
                          </option>
                        ))}
                    </select>
                    {deliverers.filter(deliverer => deliverer.status === 'Available').length === 0 && (
                      <small className='text-xs text-amber-500'>
                        No available deliverers at the moment
                      </small>
                    )}
                  </div>
                )}
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder='Additional notes or instructions'
                  rows='3'
                  className='w-full rounded-md border border-gray-300 px-3 py-2'
                />
              </div>

              <div className='flex justify-end space-x-3 border-t pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                      {modalMode === 'create' ? 'Creating...' : 'Updating...'}
                    </>
                  ) : modalMode === 'create' ? (
                    'Create Delivery'
                  ) : (
                    'Update Delivery'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedDelivery && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
          <div className='max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl'>
            <div className='mb-4 flex items-center justify-between border-b pb-4'>
              <h3 className='text-xl font-semibold'>Delivery Details</h3>
              <button
                className='rounded-full p-1 hover:bg-gray-100'
                onClick={() => setShowViewModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className='space-y-6'>
              <div className='space-y-3'>
                <h4 className='text-lg font-medium'>Basic Information</h4>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-1'>
                    <label className='text-sm text-gray-500'>Order ID</label>
                    <p className='font-medium'>
                      {selectedDelivery.orderId}
                    </p>
                  </div>
                  <div className='space-y-1'>
                    <label className='text-sm text-gray-500'>Customer</label>
                    <p className='font-medium'>
                      {selectedDelivery.customer}
                    </p>
                  </div>
                  <div className='space-y-1'>
                    <label className='text-sm text-gray-500'>Status</label>
                    <div>
                      <StatusBadge status={selectedDelivery.status} />
                    </div>
                  </div>
                  <div className='space-y-1'>
                    <label className='text-sm text-gray-500'>Priority</label>
                    <div>
                      <PriorityBadge priority={selectedDelivery.priority} />
                    </div>
                  </div>
                </div>
              </div>

              <div className='space-y-3'>
                <h4 className='text-lg font-medium'>Delivery Information</h4>
                <div className='grid grid-cols-1 gap-4'>
                  <div className='space-y-1'>
                    <label className='text-sm text-gray-500'>Delivery Address</label>
                    <p className='font-medium'>
                      {selectedDelivery.deliveryAddress ||
                        'No address provided'}
                    </p>
                  </div>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div className='space-y-1'>
                      <label className='text-sm text-gray-500'>Estimated Date</label>
                      <p className='font-medium'>
                        {selectedDelivery.estimatedDeliveryDate
                          ? new Date(
                              selectedDelivery.estimatedDeliveryDate
                            ).toLocaleDateString()
                          : 'Not set'}
                      </p>
                    </div>
                    <div className='space-y-1'>
                      <label className='text-sm text-gray-500'>Actual Date</label>
                      <p className='font-medium'>
                        {selectedDelivery.actualDeliveryDate
                          ? new Date(
                              selectedDelivery.actualDeliveryDate
                            ).toLocaleDateString()
                          : 'Not delivered yet'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className='space-y-3'>
                <h4 className='text-lg font-medium'>Assignment & Tracking</h4>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-1'>
                    <label className='text-sm text-gray-500'>Assigned Deliverer</label>
                    <p className='font-medium'>
                      {selectedDelivery.deliverer
                        ? `${selectedDelivery.deliverer.name} (${selectedDelivery.deliverer.email})`
                        : 'Unassigned'}
                    </p>
                  </div>
                  <div className='space-y-1'>
                    <label className='text-sm text-gray-500'>Created Date</label>
                    <p className='font-medium'>
                      {new Date(
                        selectedDelivery.createdAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {selectedDelivery.notes && (
                <div className='space-y-3'>
                  <h4 className='text-lg font-medium'>Notes</h4>
                  <p>{selectedDelivery.notes}</p>
                </div>
              )}

              <div className='flex justify-end space-x-3 border-t pt-4'>
                {userRole === 'admin' && (
                  <Button
                    variant='outline'
                    onClick={() => {
                      setShowViewModal(false);
                      openEditModal(selectedDelivery);
                    }}
                  >
                    Edit Delivery
                  </Button>
                )}
                <Button onClick={() => setShowViewModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveriesPage;
