/**
 * Status color mapping for delivery statuses
 * Used across the application to ensure consistent color representation
 */

export const STATUS_COLORS = {
  // Delivery status colors
  'Delivered': 'text-status-delivered',
  'In Transit': 'text-status-in-transit',
  'Pending': 'text-status-pending',
  'Cancelled': 'text-status-cancelled',
  
  // Deliverer status colors
  'Available': 'text-status-delivered',
  'Busy': 'text-status-pending',
  'Offline': 'text-muted-foreground',
  'On Delivery': 'text-status-in-transit',
  'Off Duty': 'text-muted-foreground',
  'On Break': 'text-info',
};

export const STATUS_BADGE_COLORS = {
  // Delivery status badge colors
  'Delivered': 'bg-success/10 text-success',
  'In Transit': 'bg-info/10 text-info',
  'Pending': 'bg-warning/10 text-warning',
  'Cancelled': 'bg-destructive/10 text-destructive',
  
  // Deliverer status badge colors
  'Available': 'bg-success/10 text-success',
  'Busy': 'bg-warning/10 text-warning',
  'Offline': 'bg-muted/10 text-muted-foreground',
  'On Delivery': 'bg-info/10 text-info',
  'Off Duty': 'bg-muted/10 text-muted-foreground',
  'On Break': 'bg-info/10 text-info',
};

/**
 * Get the appropriate color class for a status
 * @param {string} status - The status value
 * @param {boolean} isBadge - Whether to return badge color classes
 * @returns {string} - Tailwind color class
 */
export const getStatusColor = (status, isBadge = false) => {
  if (isBadge) {
    return STATUS_BADGE_COLORS[status] || 'bg-muted/10 text-muted-foreground';
  }
  return STATUS_COLORS[status] || 'text-muted-foreground';
};

export default getStatusColor; 