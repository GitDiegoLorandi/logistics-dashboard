import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

// Create context for tabs
const TabsContext = createContext({
  activeTab: '',
  setActiveTab: () => {},
});

/**
 * Tabs container component
 */
const Tabs = ({ defaultValue, value, onValueChange, children, className = '', ...props }) => {
  const [activeTab, setActiveTab] = useState(value || defaultValue || '');

  const handleTabChange = (newValue) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setActiveTab(newValue);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab: value || activeTab, setActiveTab: handleTabChange }}>
      <div className={`${className}`} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

/**
 * TabsList component for tab buttons container
 */
const TabsList = ({ className = '', children, ...props }) => {
  return (
    <div
      role="tablist"
      className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * TabsTrigger component for individual tab buttons
 */
const TabsTrigger = ({ className = '', value, children, ...props }) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      className={`
        inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        ${isActive ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50 hover:text-foreground'}
        ${className}
      `}
      onClick={() => setActiveTab(value)}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * TabsContent component for tab content
 */
const TabsContent = ({ className = '', value, children, ...props }) => {
  const { activeTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      data-state={isActive ? 'active' : 'inactive'}
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

Tabs.propTypes = {
  defaultValue: PropTypes.string,
  value: PropTypes.string,
  onValueChange: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
};

TabsList.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

TabsTrigger.propTypes = {
  className: PropTypes.string,
  value: PropTypes.string.isRequired,
  children: PropTypes.node,
};

TabsContent.propTypes = {
  className: PropTypes.string,
  value: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export { Tabs, TabsList, TabsTrigger, TabsContent }; 