import React from 'react';
import PropTypes from 'prop-types';

/**
 * Grid component for layout
 */
const Grid = ({ className = '', children, cols = 1, gap = 4, ...props }) => {
  const getColsClass = () => {
    const colsMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
      12: 'grid-cols-1 md:grid-cols-4 lg:grid-cols-12',
    };
    return colsMap[cols] || colsMap[1];
  };

  const getGapClass = () => {
    return `gap-${gap}`;
  };

  return (
    <div 
      className={`grid ${getColsClass()} ${getGapClass()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * GridItem component for grid items
 */
const GridItem = ({ className = '', children, span = 1, ...props }) => {
  const getSpanClass = () => {
    return `col-span-${span}`;
  };

  return (
    <div 
      className={`${getSpanClass()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

Grid.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  cols: PropTypes.oneOf([1, 2, 3, 4, 6, 12]),
  gap: PropTypes.number,
};

GridItem.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  span: PropTypes.number,
};

export { Grid, GridItem }; 