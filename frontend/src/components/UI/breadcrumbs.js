import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

/**
 * Breadcrumbs component for navigation
 */
export const Breadcrumbs = ({ items = [], separator, className = '' }) => {
  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={`${item.path}-${index}`} className="flex items-center">
              {index > 0 && (
                <span className="mx-1 text-muted-foreground">
                  {separator || '/'}
                </span>
              )}
              
              {isLast ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="text-muted-foreground hover:text-foreground hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

Breadcrumbs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  separator: PropTypes.node,
  className: PropTypes.string,
}; 