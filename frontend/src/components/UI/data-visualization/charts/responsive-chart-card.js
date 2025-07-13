import React from 'react';
import PropTypes from 'prop-types';
import { Card } from '../../card';

/**
 * ResponsiveChartCard component for displaying charts in a card with responsive behavior
 */
const ResponsiveChartCard = ({ 
  title,
  subtitle,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  height = 300,
  ...props
}) => {
  return (
    <Card className={`overflow-hidden ${className}`} {...props}>
      {(title || subtitle) && (
        <div className={`p-6 pb-2 ${headerClassName}`}>
          {title && <h3 className="text-lg font-medium">{title}</h3>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className={`p-4 ${bodyClassName}`} style={{ height: height ? `${height}px` : 'auto' }}>
        {children}
      </div>
    </Card>
  );
};

ResponsiveChartCard.propTypes = {
  title: PropTypes.node,
  subtitle: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  height: PropTypes.number,
};

export default ResponsiveChartCard; 