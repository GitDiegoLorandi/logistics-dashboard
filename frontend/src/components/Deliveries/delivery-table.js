import React, { useMemo } from 'react';
import { useTable, useSortBy, useFilters, usePagination } from 'react-table';
import { LucideChevronDown, LucideChevronUp, LucideDownload } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { getStatusColor } from '../../constants/status-colors';
import { exportToCSV } from '../../utils/export-utils';
import PropTypes from 'prop-types';

const DeliveryTable = ({ deliveries }) => {
  const columns = useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'id',
      },
      {
        Header: 'Customer',
        accessor: 'customerName',
      },
      {
        Header: 'Origin',
        accessor: 'origin',
      },
      {
        Header: 'Destination',
        accessor: 'destination',
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => (
          <Badge className={getStatusColor(value, true)}>
            {value}
          </Badge>
        ),
      },
      {
        Header: 'Deliverer',
        accessor: 'delivererName',
      },
      {
        Header: 'Date',
        accessor: 'date',
        Cell: ({ value }) => new Date(value).toLocaleDateString(),
      },
    ],
    []
  );

  const data = useMemo(() => deliveries, [deliveries]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    nextPage,
    previousPage,
    state: { pageIndex },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useFilters,
    useSortBy,
    usePagination
  );

  // Handle CSV export
  const handleExport = () => {
    // Define headers for CSV
    const headers = columns.map(column => ({
      key: column.accessor,
      label: column.Header
    }));

    // Export data
    exportToCSV(data, headers, 'deliveries.csv');
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Deliveries</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExport}
          className="flex items-center gap-2"
        >
          <LucideDownload className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <table {...getTableProps()} className="w-full text-sm">
          <thead className="bg-muted/50">
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
                {headerGroup.headers.map(column => (
                  <th
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    key={column.id}
                    className="px-4 py-3 text-left font-medium text-muted-foreground"
                  >
                    <div className="flex items-center gap-1">
                      {column.render('Header')}
                      <span>
                        {column.isSorted ? (
                          column.isSortedDesc ? (
                            <LucideChevronDown className="h-4 w-4" />
                          ) : (
                            <LucideChevronUp className="h-4 w-4" />
                          )
                        ) : null}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map(row => {
              prepareRow(row);
              return (
                <tr {...row.getRowProps()} key={row.id} className="border-t hover:bg-muted/50">
                  {row.cells.map(cell => (
                    <td {...cell.getCellProps()} key={cell.column.id} className="px-4 py-3">
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {pageIndex + 1} of {pageOptions.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => nextPage()}
            disabled={!canNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

DeliveryTable.propTypes = {
  deliveries: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      customerName: PropTypes.string,
      origin: PropTypes.string,
      destination: PropTypes.string,
      status: PropTypes.string,
      delivererName: PropTypes.string,
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)])
    })
  ).isRequired
};

export default DeliveryTable; 