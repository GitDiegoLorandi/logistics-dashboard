/**
 * Utility functions for exporting data to CSV
 */

/**
 * Convert an array of objects to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} headers - Array of header objects with {key, label}
 * @returns {string} - CSV formatted string
 */
export const convertToCSV = (data, headers) => {
  if (!data || !data.length) return '';

  // Create header row
  const headerRow = headers.map(header => `"${header.label}"`).join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return headers
      .map(header => {
        const value = item[header.key];
        // Handle different data types and ensure proper CSV formatting
        if (value === null || value === undefined) return '""';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        if (typeof value === 'object' && value instanceof Date) {
          return `"${value.toLocaleString()}"`;
        }
        return `"${value}"`;
      })
      .join(',');
  });

  // Combine header and data rows
  return [headerRow, ...rows].join('\n');
};

/**
 * Download data as a CSV file
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Array of header objects with {key, label}
 * @param {string} filename - Name of the file to download
 */
export const exportToCSV = (data, headers, filename) => {
  const csv = convertToCSV(data, headers);
  if (!csv) return;

  // Create a Blob with the CSV data
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download link
  const link = document.createElement('a');
  
  // Support for browsers with URL.createObjectURL
  if (navigator.msSaveBlob) {
    // For IE and Edge
    navigator.msSaveBlob(blob, filename);
  } else {
    // For other browsers
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
  }
}; 