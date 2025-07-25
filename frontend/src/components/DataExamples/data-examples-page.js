import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../UI/card';
import { Alert, InfoAlert } from '../UI/alert';
import { Grid, GridItem } from '../UI/grid';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableSortableHead,
  StyledTable
} from '../UI/table';
import { Badge } from '../UI/badge';
import { Button } from '../UI/button';
import { Eye, Edit, Trash } from 'lucide-react';
import Pagination from '../UI/pagination';

const DataExamplesPage = () => {
  const { t } = useTranslation(['dataExamples', 'common']);
  
  // Sample data for the table
  const allData = [
    { id: 1, name: 'John Doe', status: 'active', role: 'Admin', lastLogin: '2023-06-15' },
    { id: 2, name: 'Jane Smith', status: 'inactive', role: 'User', lastLogin: '2023-05-20' },
    { id: 3, name: 'Bob Johnson', status: 'active', role: 'Manager', lastLogin: '2023-06-10' },
    { id: 4, name: 'Alice Brown', status: 'pending', role: 'User', lastLogin: '2023-06-01' },
    { id: 5, name: 'Charlie Wilson', status: 'active', role: 'Developer', lastLogin: '2023-06-12' },
    { id: 6, name: 'Eva Martinez', status: 'active', role: 'User', lastLogin: '2023-06-14' },
    { id: 7, name: 'David Lee', status: 'inactive', role: 'Developer', lastLogin: '2023-05-15' },
    { id: 8, name: 'Grace Kim', status: 'pending', role: 'Manager', lastLogin: '2023-06-05' },
    { id: 9, name: 'Frank Chen', status: 'active', role: 'Admin', lastLogin: '2023-06-11' },
    { id: 10, name: 'Helen Davis', status: 'active', role: 'User', lastLogin: '2023-06-09' },
    { id: 11, name: 'Ian Wright', status: 'inactive', role: 'Developer', lastLogin: '2023-05-25' },
    { id: 12, name: 'Julia Roberts', status: 'active', role: 'Manager', lastLogin: '2023-06-08' },
    { id: 13, name: 'Kevin Smith', status: 'pending', role: 'User', lastLogin: '2023-06-03' },
    { id: 14, name: 'Linda Johnson', status: 'active', role: 'Admin', lastLogin: '2023-06-07' },
    { id: 15, name: 'Michael Brown', status: 'inactive', role: 'Developer', lastLogin: '2023-05-30' },
  ];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Sorting state
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('asc');

  // Handle sort click
  const handleSort = (field) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort the data
  const sortedData = [...allData].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Get current page data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Get status badge variant
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t(`statuses.${status}`)}</Badge>;
      case 'inactive':
        return <Badge variant="secondary">{t(`statuses.${status}`)}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t(`statuses.${status}`)}</Badge>;
      default:
        return <Badge>{t(`statuses.${status}`)}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h1>{t('title')}</h1>
      
      <InfoAlert>
        {t('description')}
      </InfoAlert>
      
      <Grid cols={1} gap={6}>
        {/* Basic Table */}
        <GridItem>
          <Card>
            <CardHeader>
              <CardTitle>{t('basicTable.title')}</CardTitle>
              <CardDescription>
                {t('basicTable.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('columns.id')}</TableHead>
                    <TableHead>{t('columns.name')}</TableHead>
                    <TableHead>{t('columns.status')}</TableHead>
                    <TableHead>{t('columns.role')}</TableHead>
                    <TableHead>{t('columns.lastLogin')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allData.slice(0, 5).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{t(`roles.${user.role.toLowerCase()}`)}</TableCell>
                      <TableCell>{user.lastLogin}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </GridItem>

        {/* Sortable Table with Pagination */}
        <GridItem>
          <Card>
            <CardHeader>
              <CardTitle>{t('sortableTable.title')}</CardTitle>
              <CardDescription>
                {t('sortableTable.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableSortableHead 
                      onClick={() => handleSort('id')} 
                      active={sortField === 'id'} 
                      direction={sortDirection}
                    >
                      {t('columns.id')}
                    </TableSortableHead>
                    <TableSortableHead 
                      onClick={() => handleSort('name')} 
                      active={sortField === 'name'} 
                      direction={sortDirection}
                    >
                      {t('columns.name')}
                    </TableSortableHead>
                    <TableSortableHead 
                      onClick={() => handleSort('status')} 
                      active={sortField === 'status'} 
                      direction={sortDirection}
                    >
                      {t('columns.status')}
                    </TableSortableHead>
                    <TableSortableHead 
                      onClick={() => handleSort('role')} 
                      active={sortField === 'role'} 
                      direction={sortDirection}
                    >
                      {t('columns.role')}
                    </TableSortableHead>
                    <TableSortableHead 
                      onClick={() => handleSort('lastLogin')} 
                      active={sortField === 'lastLogin'} 
                      direction={sortDirection}
                    >
                      {t('columns.lastLogin')}
                    </TableSortableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentItems.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{t(`roles.${user.role.toLowerCase()}`)}</TableCell>
                      <TableCell>{user.lastLogin}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={allData.length}
                pageSize={itemsPerPage}
                onPageChange={setCurrentPage}
                showFirstLastButtons={true}
              />
            </CardContent>
          </Card>
        </GridItem>

        {/* Styled Tables */}
        <GridItem>
          <Card>
            <CardHeader>
              <CardTitle>{t('styledTables.title')}</CardTitle>
              <CardDescription>
                {t('styledTables.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="mb-2 text-lg font-medium">{t('styledTables.striped')}</h4>
                <StyledTable striped>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('columns.id')}</TableHead>
                      <TableHead>{t('columns.name')}</TableHead>
                      <TableHead>{t('columns.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allData.slice(0, 5).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </StyledTable>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-medium">{t('styledTables.bordered')}</h4>
                <StyledTable bordered>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('columns.id')}</TableHead>
                      <TableHead>{t('columns.name')}</TableHead>
                      <TableHead>{t('columns.status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allData.slice(0, 5).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </StyledTable>
              </div>

              <div>
                <h4 className="mb-2 text-lg font-medium">{t('styledTables.dense')}</h4>
                <StyledTable dense>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('columns.id')}</TableHead>
                      <TableHead>{t('columns.name')}</TableHead>
                      <TableHead>{t('columns.status')}</TableHead>
                      <TableHead>{t('columns.role')}</TableHead>
                      <TableHead>{t('columns.lastLogin')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allData.slice(0, 5).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{t(`roles.${user.role.toLowerCase()}`)}</TableCell>
                        <TableCell>{user.lastLogin}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </StyledTable>
              </div>
            </CardContent>
          </Card>
        </GridItem>

        {/* Table with Actions */}
        <GridItem>
          <Card>
            <CardHeader>
              <CardTitle>{t('actionsTable.title')}</CardTitle>
              <CardDescription>
                {t('actionsTable.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('columns.id')}</TableHead>
                    <TableHead>{t('columns.name')}</TableHead>
                    <TableHead>{t('columns.status')}</TableHead>
                    <TableHead>{t('columns.role')}</TableHead>
                    <TableHead className="text-right">{t('columns.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allData.slice(0, 5).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{t(`roles.${user.role.toLowerCase()}`)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" title={t('actions.view')}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title={t('actions.edit')}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title={t('actions.delete')}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </GridItem>
      </Grid>
    </div>
  );
};

export default DataExamplesPage; 