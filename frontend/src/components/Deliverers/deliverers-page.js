import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  Bike,
  Truck,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { delivererAPI } from '../../services/api';
import LoadingSpinner from '../UI/loading-spinner';
import ErrorMessage from '../UI/error-message';
import { Button } from '../UI/button';
import { Input } from '../UI/input';
import { Select } from '../UI/select';
import { Card, CardContent } from '../UI/card';
import { Badge } from '../UI/badge';
import { Table, TableHeader as THead, TableRow as TR, TableHead as TH, TableBody as TBody, TableCell as TD } from '../UI/table';
import { Dialog } from '../UI/dialog';
import { cn } from '../../lib/utils';

// Fallback data for development/demo purposes
const fallbackDeliverers = [
  {
    _id: 'del1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '555-123-4567',
    status: 'Available',
    vehicleType: 'Car',
    licenseNumber: 'DL12345678',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    },
    rating: 4.8,
    completedDeliveries: 145,
    activeDeliveries: 2
  },
  {
    _id: 'del2',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '555-987-6543',
    status: 'Busy',
    vehicleType: 'Motorcycle',
    licenseNumber: 'DL87654321',
    address: {
      street: '456 Oak Ave',
      city: 'Somewhere',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    rating: 4.5,
    completedDeliveries: 89,
    activeDeliveries: 1
  },
  {
    _id: 'del3',
    name: 'Michael Brown',
    email: 'michael.b@example.com',
    phone: '555-456-7890',
    status: 'Available',
    vehicleType: 'Van',
    licenseNumber: 'DL45678901',
    address: {
      street: '789 Pine St',
      city: 'Elsewhere',
      state: 'TX',
      zipCode: '75001',
      country: 'USA'
    },
    rating: 4.9,
    completedDeliveries: 213,
    activeDeliveries: 0
  }
];

const DeliverersPage = () => {
  const { t } = useTranslation(['deliverers', 'common']);
  
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
      // Handle response directly as it comes from the API without .data
      setDeliverers(response.docs || []);
      setTotalPages(response.totalPages || 1);
      setTotalDocs(response.totalDocs || 0);
      setError(null);
    } catch (err) {
      console.error('Error fetching deliverers:', err);
      setError('Failed to fetch deliverers');
      toast.error('Failed to fetch deliverers. Using demo data instead.');
      
      // Use fallback data when API fails
      setDeliverers(fallbackDeliverers);
      setTotalPages(1);
      setTotalDocs(fallbackDeliverers.length);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, statusFilter, vehicleTypeFilter, searchTerm]);

  // Fetch Deliverer Stats
  const fetchDelivererStats = async delivererId => {
    try {
      setStatsLoading(true);
      const response = await delivererAPI.getStats(delivererId);
      setDelivererStats(response); // Remove .data
    } catch (err) {
      console.error('Error fetching deliverer stats:', err);
      toast.error('Failed to fetch deliverer statistics');
      
      // Use fallback stats data
      const fallbackStats = {
        deliveriesCompleted: 125,
        onTimeRate: 96.8,
        averageRating: 4.7,
        totalDistance: 1876,
        averageDeliveryTime: 28.5
      };
      setDelivererStats(fallbackStats);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Available Deliveries
  const fetchAvailableDeliveries = async () => {
    try {
      setLoadingDeliveries(true);
      const response = await delivererAPI.getAvailableDeliveries();
      setAvailableDeliveries(response || []); // Remove .data
    } catch (err) {
      console.error('Error fetching available deliveries:', err);
      toast.error('Failed to fetch available deliveries');
      
      // Use fallback deliveries data
      const fallbackDeliveries = [
        { _id: 'del1', orderId: 'ORD-12345', customer: 'John Doe', deliveryAddress: '123 Main St' },
        { _id: 'del2', orderId: 'ORD-67890', customer: 'Jane Smith', deliveryAddress: '456 Oak Ave' }
      ];
      setAvailableDeliveries(fallbackDeliveries);
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
    if (!window.confirm(t('confirmDelete'))) {
      return;
    }

    try {
      await delivererAPI.delete(delivererId);
      toast.success(t('deleteSuccess'));
      fetchDeliverers();
    } catch (err) {
      console.error('Error deleting deliverer:', err);
      toast.error(err.response?.data?.message || t('deleteError'));
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

  // Helper function to get status icon
  const getStatusIcon = status => {
    switch (status) {
      case 'Available':
        return <CheckCircle className="h-4 w-4" />;
      case 'Busy':
        return <Clock className="h-4 w-4" />;
      case 'Offline':
        return <UserX className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Get Vehicle Icon
  const getVehicleIcon = vehicleType => {
    switch (vehicleType) {
      case 'Car':
        return <Car size={16} className='text-status-in-transit' />;
      case 'Van':
        return <Car size={16} className='text-status-in-transit' />;
      case 'Truck':
        return <Truck size={16} />;
      case 'Motorcycle':
        return <Car size={16} className='text-status-delivered' />;
      case 'Bicycle':
        return <Bike size={16} className='text-status-in-transit' />;
      default:
        return <Car size={16} className='text-status-default' />;
    }
  };

  // Status Badge Component
  const StatusBadge = ({ status }) => {
    const statusColors = {
      'Available': 'bg-green-100 text-green-800',
      'Busy': 'bg-yellow-100 text-yellow-800',
      'Offline': 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {t(`statuses.${status.toLowerCase()}`)}
      </Badge>
    );
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
    <div className='mx-auto max-w-7xl px-4 py-6'>
      <div className='mb-8 flex flex-col gap-6 rounded-xl bg-card p-6 shadow md:flex-row md:items-start md:justify-between'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-bold'>
            <Car className='h-6 w-6 text-primary' />
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
            onClick={fetchDeliverers}
            disabled={loading}
            className='flex items-center gap-2'
          >
            <RefreshCw
              className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
            />
            {t('refresh')}
          </Button>
          <Button
            onClick={handleCreateDeliverer}
            size='sm'
            className='flex items-center gap-2'
          >
            <Plus className='h-4 w-4' />
            {t('newDeliverer')}
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
              {t('clear', { ns: 'common' })}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className='mb-6 rounded-xl bg-card p-6 shadow'>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('status', { ns: 'common' })}</label>
              <Select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full"
              >
                <option value="">{t('filters.allStatuses')}</option>
                <option value="Available">{t('statuses.available')}</option>
                <option value="Busy">{t('statuses.busy')}</option>
                <option value="Offline">{t('statuses.offline')}</option>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>{t('vehicle')}</label>
              <Select
                value={vehicleTypeFilter}
                onChange={e => setVehicleTypeFilter(e.target.value)}
              >
                <option value=''>{t('filters.allVehicles')}</option>
                <option value='Car'>{t('vehicles.car')}</option>
                <option value='Motorcycle'>{t('vehicles.motorcycle')}</option>
                <option value='Bicycle'>{t('vehicles.bicycle')}</option>
                <option value='Van'>{t('vehicles.van')}</option>
                <option value='Truck'>{t('vehicles.truck')}</option>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-3xl font-bold'>{totalDocs}</span>
            <span className='text-sm text-muted-foreground'>
              {t('totalDeliverers')}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-3xl font-bold text-success'>
              {availableCount}
            </span>
            <span className='text-sm text-muted-foreground'>{t('available')}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-3xl font-bold text-status-in-transit'>
              {busyCount}
            </span>
            <span className='text-sm text-muted-foreground'>{t('onDelivery')}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex flex-col items-center justify-center pt-6'>
            <span className='text-status-offline text-3xl font-bold'>
              {offlineCount}
            </span>
            <span className='text-sm text-muted-foreground'>{t('offline')}</span>
          </CardContent>
        </Card>
      </div>

      {/* Deliverers Table */}
      <Card className='mb-6 overflow-hidden'>
        <Table>
          <THead>
            <TR className='bg-muted/50'>
              <TH>{t('columns.deliverer')}</TH>
              <TH>{t('columns.contact')}</TH>
              <TH>{t('columns.status')}</TH>
              <TH>{t('columns.vehicle')}</TH>
              <TH>{t('columns.license')}</TH>
              <TH>{t('columns.deliveries')}</TH>
              <TH className='text-right'>{t('columns.actions')}</TH>
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
                <TD className="whitespace-nowrap">
                    <div className="flex items-center">
                      <StatusBadge status={deliverer.status} />
                    </div>
                  </TD>
                <TD>
                  <div className='flex items-center gap-1 text-sm'>
                    {getVehicleIcon(deliverer.vehicleType)}
                    <span>{deliverer.vehicleType ? t(`vehicles.${deliverer.vehicleType.toLowerCase()}`) : t('notSpecified')}</span>
                  </div>
                </TD>
                <TD>
                  <span className='text-sm'>
                    {deliverer.licenseNumber || t('notAvailable')}
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
                      title={t('actions.view', { ns: 'common' })}
                    >
                      <Eye className='h-4 w-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0'
                      onClick={() => handleViewStats(deliverer)}
                      title={t('actions.viewStats')}
                    >
                      <BarChart3 className='h-4 w-4' />
                    </Button>
                    {deliverer.status === 'Available' && (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0 text-info hover:text-info/80'
                        onClick={() => handleOpenAssignModal(deliverer)}
                        title={t('actions.assign')}
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
                          title={t('actions.edit')}
                        >
                          <Edit3 className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 text-destructive hover:text-destructive/80'
                          onClick={() => handleDeleteDeliverer(deliverer._id)}
                          title={t('actions.delete')}
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
            <Car className='mb-4 h-12 w-12 text-muted-foreground' />
            <h3 className='mb-2 text-lg font-medium'>{t('noDeliverersFound')}</h3>
            <p className='mb-4 text-sm text-muted-foreground'>
              {t('getStarted')}
            </p>
            {isAdmin && (
              <Button
                onClick={handleCreateDeliverer}
                className='flex items-center gap-2'
              >
                <Plus className='h-4 w-4' />
                {t('newDeliverer')}
              </Button>
            )}
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
            {t('pagination', { currentPage, totalPages, totalDocs })}
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
                  ? t('addNewDeliverer')
                  : t('editDeliverer')}
              </h2>
              <button onClick={() => setShowModal(false)} className='btn-close'>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDeliverer} className='modal-form'>
              <div className='form-section'>
                <h3>{t('basicInfo')}</h3>
                <div className='form-row'>
                  <div className='form-group'>
                    <label>{t('name')}</label>
                    <input
                      type='text'
                      value={formData.name}
                      onChange={e => handleFormChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className='form-group'>
                    <label>{t('email')}</label>
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
                    <label>{t('phone')}</label>
                    <input
                      type='tel'
                      value={formData.phone}
                      onChange={e => handleFormChange('phone', e.target.value)}
                    />
                  </div>
                  <div className='form-group'>
                    <label>{t('status')}</label>
                    <Select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={e => handleFormChange('status', e.target.value)}
                      required
                    >
                      <option value="Available">{t('statuses.available')}</option>
                      <option value="Busy">{t('statuses.busy')}</option>
                      <option value="Offline">{t('statuses.offline')}</option>
                    </Select>
                  </div>
                </div>
              </div>

              <div className='form-section'>
                <h3>{t('vehicleInfo')}</h3>
                <div className='form-row'>
                  <div className='form-group'>
                    <label>{t('vehicleType')}</label>
                    <select
                      value={formData.vehicleType}
                      onChange={e =>
                        handleFormChange('vehicleType', e.target.value)
                      }
                    >
                      <option value=''>{t('selectVehicleType')}</option>
                      <option value='Car'>{t('vehicles.car')}</option>
                      <option value='Motorcycle'>{t('vehicles.motorcycle')}</option>
                      <option value='Van'>{t('vehicles.van')}</option>
                      <option value='Truck'>{t('vehicles.truck')}</option>
                      <option value='Bicycle'>{t('vehicles.bicycle')}</option>
                    </select>
                  </div>
                  <div className='form-group'>
                    <label>{t('licenseNumber')}</label>
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
                <h3>{t('address')}</h3>
                <div className='form-group'>
                  <label>{t('street')}</label>
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
                    <label>{t('city')}</label>
                    <input
                      type='text'
                      value={formData.address.city}
                      onChange={e =>
                        handleFormChange('address.city', e.target.value)
                      }
                    />
                  </div>
                  <div className='form-group'>
                    <label>{t('state')}</label>
                    <input
                      type='text'
                      value={formData.address.state}
                      onChange={e =>
                        handleFormChange('address.state', e.target.value)
                      }
                    />
                  </div>
                  <div className='form-group'>
                    <label>{t('zipCode')}</label>
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
                <h3>{t('emergencyContact')}</h3>
                <div className='form-row'>
                  <div className='form-group'>
                    <label>{t('name')}</label>
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
                    <label>{t('phone')}</label>
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
                    <label>{t('relationship')}</label>
                    <input
                      type='text'
                      value={formData.emergencyContact.relationship}
                      onChange={e =>
                        handleFormChange(
                          'emergencyContact.relationship',
                          e.target.value
                        )
                      }
                      placeholder={t('emergencyRelationshipPlaceholder')}
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
                  {t('cancel')}
                </button>
                <button type='submit' className='btn btn-primary'>
                  {modalMode === 'create'
                    ? t('createDeliverer')
                    : t('updateDeliverer')}
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
              <h2>{t('delivererDetails')}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className='btn-close'
              >
                <X size={20} />
              </button>
            </div>

            <div className='deliverer-details'>
              <div className='details-section'>
                <h3>{t('basicInfo')}</h3>
                <div className='details-grid'>
                  <div className='detail-item'>
                    <label>{t('name')}</label>
                    <span>{selectedDeliverer.name}</span>
                  </div>
                  <div className='detail-item'>
                    <label>{t('email')}</label>
                    <span>{selectedDeliverer.email}</span>
                  </div>
                  <div className='detail-item'>
                    <label>{t('phone')}</label>
                    <span>{selectedDeliverer.phone || t('notProvided')}</span>
                  </div>
                  <div className='detail-item'>
                    <label>{t('status')}</label>
                    <span
                      className={`status-badge status-${selectedDeliverer.status.toLowerCase()}`}
                    >
                      {getStatusIcon(selectedDeliverer.status)}
                      {t(`statuses.${selectedDeliverer.status.toLowerCase()}`)}
                    </span>
                  </div>
                </div>
              </div>

              <div className='details-section'>
                <h3>{t('vehicleInfo')}</h3>
                <div className='details-grid'>
                  <div className='detail-item'>
                    <label>{t('vehicleType')}</label>
                    <span>
                      {selectedDeliverer.vehicleType ? t(`vehicles.${selectedDeliverer.vehicleType.toLowerCase()}`) : t('notSpecified')}
                    </span>
                  </div>
                  <div className='detail-item'>
                    <label>{t('licenseNumber')}</label>
                    <span>
                      {selectedDeliverer.licenseNumber || t('notProvided')}
                    </span>
                  </div>
                </div>
              </div>

              {selectedDeliverer.address && (
                <div className='details-section'>
                  <h3>{t('address')}</h3>
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
                  <h3>{t('emergencyContact')}</h3>
                  <div className='details-grid'>
                    <div className='detail-item'>
                      <label>{t('name')}</label>
                      <span>
                        {selectedDeliverer.emergencyContact.name ||
                          t('notProvided')}
                      </span>
                    </div>
                    <div className='detail-item'>
                      <label>{t('phone')}</label>
                      <span>
                        {selectedDeliverer.emergencyContact.phone ||
                          t('notProvided')}
                      </span>
                    </div>
                    <div className='detail-item'>
                      <label>{t('relationship')}</label>
                      <span>
                        {selectedDeliverer.emergencyContact.relationship ||
                          t('notProvided')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className='details-section'>
                <h3>{t('activity')}</h3>
                <div className='details-grid'>
                  <div className='detail-item'>
                    <label>{t('totalDeliveries')}</label>
                    <span>{selectedDeliverer.deliveries?.length || 0}</span>
                  </div>
                  <div className='detail-item'>
                    <label>{t('memberSince')}</label>
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
              <h2>{t('performanceStats', { name: selectedDeliverer.name })}</h2>
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
                      <div className='stat-label'>{t('totalDeliveries')}</div>
                    </div>
                    <div className='stat-card'>
                      <div className='stat-value'>
                        {delivererStats.delivered}
                      </div>
                      <div className='stat-label'>{t('completed')}</div>
                    </div>
                    <div className='stat-card'>
                      <div className='stat-value'>{delivererStats.pending}</div>
                      <div className='stat-label'>{t('pending')}</div>
                    </div>
                    <div className='stat-card'>
                      <div className='stat-value'>
                        {delivererStats.inTransit}
                      </div>
                      <div className='stat-label'>{t('inTransit')}</div>
                    </div>
                  </div>

                  <div className='performance-metrics'>
                    <div className='metric-item'>
                      <label>{t('successRate')}</label>
                      <div className='metric-value'>
                        {delivererStats.totalDeliveries > 0
                          ? `${((delivererStats.delivered / delivererStats.totalDeliveries) * 100).toFixed(1)}%`
                          : t('na')}
                      </div>
                    </div>
                    <div className='metric-item'>
                      <label>{t('averageDeliveryTime')}</label>
                      <div className='metric-value'>
                        {delivererStats.avgDeliveryTime
                          ? `${delivererStats.avgDeliveryTime.toFixed(1)} ${t('days')}`
                          : t('na')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='no-stats'>
                  <BarChart3 size={48} className='no-stats-icon' />
                  <p>{t('noStatsAvailable')}</p>
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
              <h2>{t('assignDeliveryTo', { name: selectedDeliverer?.name })}</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className='btn-close'
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignDelivery} className='modal-form'>
              <div className='form-section'>
                <h3>{t('selectDelivery')}</h3>

                {loadingDeliveries ? (
                  <LoadingSpinner />
                ) : availableDeliveries.length === 0 ? (
                  <div className='empty-message'>
                    {t('noAvailableDeliveriesFound')}
                  </div>
                ) : (
                  <div className='form-group'>
                    <label htmlFor='deliverySelect'>{t('availableDeliveries')}</label>
                    <select
                      id='deliverySelect'
                      value={selectedDelivery}
                      onChange={e => setSelectedDelivery(e.target.value)}
                      required
                    >
                      <option value=''>{t('selectDelivery')}</option>
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
                  {t('cancel')}
                </button>
                <button
                  type='submit'
                  className='btn btn-primary'
                  disabled={!selectedDelivery || loadingDeliveries}
                >
                  {t('assignDelivery')}
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
