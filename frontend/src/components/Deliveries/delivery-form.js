import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, X } from 'lucide-react';
import { Input } from '../UI/input';
import { Button } from '../UI/button';
import { Select } from '../UI/select';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

const DeliveryForm = ({ onSubmit, initialValues = {}, deliverers = [], isEdit = false }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: initialValues,
  });

  const onFormSubmit = async (data) => {
    setLoading(true);
    try {
      await onSubmit(data);
      if (!isEdit) {
        reset();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Customer Field */}
        <div className="space-y-2">
          <label htmlFor="customer" className="text-sm font-medium">
            {t('deliveries.customer')} *
          </label>
          <Input
            id="customer"
            {...register('customer', { required: true })}
            placeholder={t('deliveries.customerPlaceholder')}
            className={errors.customer ? 'border-destructive' : ''}
          />
          {errors.customer && (
            <p className="text-sm text-destructive">
              {t('validation.required')}
            </p>
          )}
        </div>

        {/* Delivery Address Field */}
        <div className="space-y-2">
          <label htmlFor="deliveryAddress" className="text-sm font-medium">
            {t('deliveries.destination')} *
          </label>
          <Input
            id="deliveryAddress"
            {...register('deliveryAddress', { required: true })}
            placeholder={t('deliveries.destinationPlaceholder')}
            className={errors.deliveryAddress ? 'border-destructive' : ''}
          />
          {errors.deliveryAddress && (
            <p className="text-sm text-destructive">
              {t('validation.required')}
            </p>
          )}
        </div>

        {/* Status Field */}
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            {t('deliveries.status')} *
          </label>
          <Select
            id="status"
            {...register('status', { required: true })}
            className={errors.status ? 'border-destructive' : ''}
          >
            <option value="Pending">{t('deliveries.statuses.pending')}</option>
            <option value="In Transit">{t('deliveries.statuses.inTransit')}</option>
            <option value="Delivered">{t('deliveries.statuses.delivered')}</option>
            <option value="Cancelled">{t('deliveries.statuses.cancelled')}</option>
          </Select>
          {errors.status && (
            <p className="text-sm text-destructive">
              {t('validation.required')}
            </p>
          )}
        </div>

        {/* Priority Field */}
        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium">
            {t('deliveries.priority')}
          </label>
          <Select
            id="priority"
            {...register('priority')}
          >
            <option value="Low">{t('deliveries.priorities.low')}</option>
            <option value="Medium">{t('deliveries.priorities.medium')}</option>
            <option value="High">{t('deliveries.priorities.high')}</option>
            <option value="Urgent">{t('deliveries.priorities.urgent')}</option>
          </Select>
        </div>

        {/* Deliverer Field */}
        <div className="space-y-2">
          <label htmlFor="deliverer" className="text-sm font-medium">
            {t('deliveries.deliverer')}
          </label>
          <Select
            id="deliverer"
            {...register('deliverer')}
          >
            <option value="">{t('deliveries.selectDeliverer')}</option>
            {deliverers.map((deliverer) => (
              <option key={deliverer._id} value={deliverer._id}>
                {deliverer.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Estimated Delivery Date Field */}
        <div className="space-y-2">
          <label htmlFor="estimatedDeliveryDate" className="text-sm font-medium">
            {t('deliveries.scheduledDate')}
          </label>
          <Input
            id="estimatedDeliveryDate"
            type="date"
            {...register('estimatedDeliveryDate')}
          />
        </div>
      </div>

      {/* Notes Field */}
      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          {t('deliveries.notes')}
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={t('deliveries.notesPlaceholder')}
        ></textarea>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={loading}
        >
          <X className="mr-2 h-4 w-4" />
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {isEdit ? t('common.update') : t('common.save')}
        </Button>
      </div>
    </form>
  );
};

DeliveryForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
  deliverers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ),
  isEdit: PropTypes.bool
};

DeliveryForm.defaultProps = {
  initialValues: {},
  deliverers: [],
  isEdit: false
};

export default DeliveryForm; 