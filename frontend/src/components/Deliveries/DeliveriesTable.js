import React from 'react';
import {
  Eye,
  Edit3,
  Trash2,
  UserCheck,
  Calendar,
  MapPin,
  Package,
  Plus,
} from 'lucide-react';
import { Table, THead, TBody, TR, TH, TD } from '../UI/table';
import { Badge } from '../UI/badge';

const StatusBadge = ({ status }) => {
  const variantMap = {
    Delivered: 'success',
    'In Transit': 'info',
    Pending: 'outline',
    Cancelled: 'destructive',
  };
  return <Badge variant={variantMap[status] || 'outline'}>{status}</Badge>;
};

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

export const DeliveriesTable = ({
  deliveries,
  loading,
  onView,
  onEdit,
  onDelete,
  onCreate,
}) => {
  if (loading) {
    return (
      <div className='flex justify-center p-8'>
        <svg
          className='h-6 w-6 animate-spin text-muted-foreground'
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
        >
          <circle
            className='opacity-25'
            cx='12'
            cy='12'
            r='10'
            stroke='currentColor'
            strokeWidth='4'
          ></circle>
          <path
            className='opacity-75'
            fill='currentColor'
            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
          ></path>
        </svg>
      </div>
    );
  }

  return (
    <Table className='bg-card rounded-xl shadow'>
      <THead>
        <TR className='bg-muted/50'>
          <TH>Order ID</TH>
          <TH>Customer</TH>
          <TH>Status</TH>
          <TH>Priority</TH>
          <TH>Deliverer</TH>
          <TH>Estimated Date</TH>
          <TH>Address</TH>
          <TH>Actions</TH>
        </TR>
      </THead>
      <TBody>
        {deliveries.length ? (
          deliveries.map(delivery => (
            <TR key={delivery._id}>
              <TD>
                <strong>{delivery.orderId}</strong>
              </TD>
              <TD>{delivery.customer}</TD>
              <TD>
                <StatusBadge status={delivery.status} />
              </TD>
              <TD>
                <PriorityBadge priority={delivery.priority} />
              </TD>
              <TD>
                {delivery.deliverer ? (
                  <div className='flex items-center gap-1'>
                    <UserCheck className='h-4 w-4' />
                    <span>{delivery.deliverer.name}</span>
                  </div>
                ) : (
                  <span className='italic text-muted-foreground'>
                    Unassigned
                  </span>
                )}
              </TD>
              <TD>
                {delivery.estimatedDeliveryDate ? (
                  <div className='flex items-center gap-1'>
                    <Calendar className='h-4 w-4' />
                    {new Date(
                      delivery.estimatedDeliveryDate
                    ).toLocaleDateString()}
                  </div>
                ) : (
                  <span className='italic text-muted-foreground'>Not set</span>
                )}
              </TD>
              <TD>
                <div className='flex items-center gap-1 max-w-[200px] truncate'>
                  <MapPin className='h-4 w-4 shrink-0' />
                  <span className='truncate'>
                    {delivery.deliveryAddress || 'No address'}
                  </span>
                </div>
              </TD>
              <TD>
                <div className='flex items-center gap-2'>
                  <button
                    className='hover:text-primary'
                    onClick={() => onView(delivery)}
                  >
                    <Eye className='h-4 w-4' />
                  </button>
                  <button
                    className='hover:text-yellow-500'
                    onClick={() => onEdit(delivery)}
                  >
                    <Edit3 className='h-4 w-4' />
                  </button>
                  <button
                    className='hover:text-destructive'
                    onClick={() => onDelete(delivery._id)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
              </TD>
            </TR>
          ))
        ) : (
          <TR>
            <TD colSpan={8} className='text-center p-8'>
              <div className='flex flex-col items-center gap-4'>
                <Package className='h-10 w-10 text-muted-foreground' />
                <h3 className='text-lg font-semibold'>No deliveries found</h3>
                <p className='text-sm text-muted-foreground'>
                  There are no deliveries matching your criteria.
                </p>
                <button
                  className='inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white shadow hover:bg-primary/90'
                  onClick={onCreate}
                >
                  <Plus className='h-4 w-4' /> Create First Delivery
                </button>
              </div>
            </TD>
          </TR>
        )}
      </TBody>
    </Table>
  );
};
