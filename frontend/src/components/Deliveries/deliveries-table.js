import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Edit,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Package,
} from 'lucide-react';
import { Table, TableHeader as THead, TableRow as TR, TableHead as TH, TableBody as TBody, TableCell as TD } from '../UI/table';
import { Button } from '../UI/button';
import { Badge } from '../UI/badge';
import { useTranslation } from 'react-i18next';

export const DeliveriesTable = ({
  data = [],
  onEdit,
  onView,
  onDelete,
  onStatusUpdate,
  userRole,
}) => {
  const { t } = useTranslation();
  
  // Define status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      Pending: { variant: 'warning', icon: AlertCircle },
      'In Transit': { variant: 'info', icon: Clock },
      Delivered: { variant: 'success', icon: CheckCircle },
      Cancelled: { variant: 'destructive', icon: XCircle },
      Failed: { variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || { variant: 'default', icon: Package };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon size={14} />
        <span>{status}</span>
      </Badge>
    );
  };

  // Define priority badge component
  const PriorityBadge = ({ priority }) => {
    const priorityConfig = {
      Low: { variant: 'outline' },
      Medium: { variant: 'secondary' },
      High: { variant: 'warning' },
      Urgent: { variant: 'destructive' },
    };

    const config = priorityConfig[priority] || { variant: 'outline' };

    return <Badge variant={config.variant}>{priority}</Badge>;
  };

  // Define columns
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
            {t('deliveries.deliveryID')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('orderId') || row.original._id?.substring(0, 8)}</div>
        ),
      },
      {
        accessorKey: 'customer',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="p-0 hover:bg-transparent"
          >
            {t('deliveries.customer')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue('customer')}</div>,
      },
      {
        accessorKey: 'deliveryAddress',
        header: t('deliveries.destination'),
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
                <span className="text-muted-foreground italic">
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
            <span className="text-muted-foreground italic">
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
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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
      <div className="text-center p-8 border rounded-md bg-muted/10">
        <Package className="h-12 w-12 mx-auto text-muted-foreground" />
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

export default DeliveriesTable;
