import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideSave, LucideLoader } from 'lucide-react';
import { Button } from '../UI/button';
import { Input } from '../UI/input';
import { Label } from '../UI/label';
import { Textarea } from '../UI/textarea';
import { Select } from '../UI/select';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/card';
import { AddressAutocomplete } from '../UI/address-autocomplete';
import { Alert, AlertDescription } from '../UI/alert';
import { format } from 'date-fns';
import useFormAutosave from '../hooks/use-form-autosave';

const DeliveryForm = ({ onSubmit, initialValues = {}, deliverers = [], isEdit = false }) => {
  const navigate = useNavigate();
  
  const defaultValues = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    origin: '',
    destination: '',
    packageDetails: '',
    weight: '',
    dimensions: '',
    delivererId: '',
    status: 'Pending',
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    ...initialValues
  };
  
  // Use the autosave hook
  const [formData, setFormData, { lastSaved, clearSavedData }] = useFormAutosave(
    `delivery-form-${isEdit ? initialValues.id : 'new'}`, 
    defaultValues
  );
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle address selection
  const handleAddressSelect = (type, address) => {
    setFormData(prev => ({ ...prev, [type]: address }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await onSubmit(formData);
      clearSavedData(); // Clear saved data on successful submission
      navigate('/deliveries');
    } catch (err) {
      setError(err.message || 'An error occurred while saving the delivery');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Delivery' : 'Create New Delivery'}</CardTitle>
        {lastSaved && (
          <p className="text-xs text-muted-foreground">
            Last saved: {format(new Date(lastSaved), 'HH:mm:ss')}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Name</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Delivery Details</h3>
            <div className="space-y-2">
              <Label htmlFor="origin">Origin Address</Label>
              <AddressAutocomplete
                id="origin"
                value={formData.origin}
                onSelect={(address) => handleAddressSelect('origin', address)}
                placeholder="Enter origin address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination Address</Label>
              <AddressAutocomplete
                id="destination"
                value={formData.destination}
                onSelect={(address) => handleAddressSelect('destination', address)}
                placeholder="Enter destination address"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.weight}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensions (cm)</Label>
                <Input
                  id="dimensions"
                  name="dimensions"
                  placeholder="L x W x H"
                  value={formData.dimensions}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  name="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="packageDetails">Package Details</Label>
              <Textarea
                id="packageDetails"
                name="packageDetails"
                value={formData.packageDetails}
                onChange={handleChange}
                rows={2}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivererId">Deliverer</Label>
                <Select
                  id="delivererId"
                  name="delivererId"
                  value={formData.delivererId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a deliverer</option>
                  {deliverers.map(deliverer => (
                    <option key={deliverer.id} value={deliverer.id}>
                      {deliverer.name} ({deliverer.vehicleType})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Failed">Failed</option>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/deliveries')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <LucideLoader className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <LucideSave className="h-4 w-4" />
                  {isEdit ? 'Update Delivery' : 'Create Delivery'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DeliveryForm; 