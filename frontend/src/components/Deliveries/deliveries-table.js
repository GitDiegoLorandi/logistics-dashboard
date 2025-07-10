import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Package,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Table, TableHeader as THead, TableRow as TR, TableHead as TH, TableBody as TBody, TableCell as TD } from '../UI/table';
import { Badge } from '../UI/badge';
import { Button } from '../UI/button';

/**
 * DeliveriesTable component for displaying a list of deliveries
 */
export const DeliveriesTable = ({
  data = [],
  onEdit,
  onView,
  onDelete,
  onStatusUpdate,
  userRole,
}) => {
  const { t } = useTranslation();

  /**
   * StatusBadge component for delivery status
   */
  const StatusBadge = ({ status }) => {
    const statusMap = {
      PENDING: { variant: 'warning', label: t('deliveries.statuses.pending') },
      IN_TRANSIT: { variant: 'info', label: t('deliveries.statuses.inTransit') },
      DELIVERED: { variant: 'success', label: t('deliveries.statuses.delivered') },
      CANCELLED: { variant: 'default', label: t('deliveries.statuses.cancelled') },
      DELAYED: { variant: 'destructive', label: t('deliveries.statuses.delayed') },
      ON_HOLD: { variant: 'outline', label: t('deliveries.statuses.onHold') },
    };

    const { variant, label } = statusMap[status] || { 
      variant: 'default', 
      label: status 
    };

    return <Badge variant={variant}>{label}</Badge>;
  };

  /**
   * PriorityBadge component for delivery priority
   */
  const PriorityBadge = ({ priority }) => {
    const priorityMap = {
      HIGH: { variant: 'destructive', label: t('deliveries.priorities.high') },
      MEDIUM: { variant: 'warning', label: t('deliveries.priorities.medium') },
      LOW: { variant: 'default', label: t('deliveries.priorities.low') },
    };

    const { variant, label } = priorityMap[priority] || {
      variant: 'default',
      label: priority,
    };

    return <Badge variant={variant}>{label}</Badge>;
  };

  // Define table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: 'orderId',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent"
          >
            {t('deliveries.orderId')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('orderId')}</div>
        ),
      },
      {
        accessorKey: 'customer',
        header: t('deliveries.customer'),
        cell: ({ row }) => <div>{row.getValue('customer')}</div>,
      },
      {
        accessorKey: 'deliveryAddress',
        header: t('deliveries.address'),
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate" title={row.getValue('deliveryAddress')}>
            {row.getValue('deliveryAddress')}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent"
          >
            {t('deliveries.status')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
      },
      {
        accessorKey: 'priority',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent"
          >
            {t('deliveries.priority')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <PriorityBadge priority={row.getValue('priority')} />,
      },
      {
        accessorKey: 'deliverer',
        header: t('deliveries.deliverer'),
        cell: ({ row }) => {
          const deliverer = row.original.deliverer;
          return (
            <div>
              {deliverer ? (
                <span>{deliverer.name}</span>
              ) : (
                <span className="italic text-muted-foreground">
                  {t('deliveries.unassigned')}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'estimatedDeliveryDate',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent"
          >
            {t('deliveries.scheduledDate')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.getValue('estimatedDeliveryDate');
          return date ? (
            <div>{new Date(date).toLocaleDateString()}</div>
          ) : (
            <span className="italic text-muted-foreground">
              {t('deliveries.notScheduled')}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: t('common.actions'),
        cell: ({ row }) => {
          const delivery = row.original;
          const canEdit = ['admin', 'manager'].includes(userRole);
          const canDelete = userRole === 'admin';

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onView(delivery)}
              >
                <span className="sr-only">{t('common.view')}</span>
                <Eye className="h-4 w-4" />
              </Button>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onEdit(delivery)}
                >
                  <span className="sr-only">{t('common.edit')}</span>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDelete(delivery)}
                >
                  <span className="sr-only">{t('common.delete')}</span>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [t, userRole, onView, onEdit, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border bg-muted/10 p-8 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">{t('deliveries.noDeliveries')}</h3>
        <p className="mt-1 text-muted-foreground">
          {t('deliveries.noDeliveriesDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <Table>
          <THead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TR key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TH key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TH>
                ))}
              </TR>
            ))}
          </THead>
          <TBody>
            {table.getRowModel().rows.map((row) => (
              <TR key={row.id} className="hover:bg-muted/50">
                {row.getVisibleCells().map((cell) => (
                  <TD key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TD>
                ))}
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
};

// PropTypes for main component
DeliveriesTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  onEdit: PropTypes.func,
  onView: PropTypes.func,
  onDelete: PropTypes.func,
  onStatusUpdate: PropTypes.func,
  userRole: PropTypes.string
};

export default DeliveriesTable;
