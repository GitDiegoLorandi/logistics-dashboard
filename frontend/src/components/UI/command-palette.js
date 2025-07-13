import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Dialog } from './dialog';
import { LucideSearch, LucideCommand } from 'lucide-react';

/**
 * Command palette component for quick navigation
 */
export const CommandPalette = ({ open, onOpenChange, navItems = [] }) => {
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(navItems);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Filter items based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredItems(navItems);
      setSelectedIndex(0);
      return;
    }

    const filtered = navItems.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
    setSelectedIndex(0);
  }, [searchQuery, navItems]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure the dialog is fully rendered
      setTimeout(() => {
        inputRef.current.focus();
      }, 50);
    }
  }, [open]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        if (filteredItems[selectedIndex]) {
          navigateTo(filteredItems[selectedIndex].path);
        }
        break;
      case 'Escape':
        onOpenChange(false);
        break;
      default:
        break;
    }
  };

  // Navigate to selected item
  const navigateTo = (path) => {
    navigate(path);
    onOpenChange(false);
    setSearchQuery('');
  };

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  return (
    <Dialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      className="sm:max-w-lg"
    >
      <div className="p-0">
        <div className="flex items-center border-b border-border px-4 py-2">
          <LucideSearch className="mr-2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 border-0 bg-transparent py-2 outline-none placeholder:text-muted-foreground focus:ring-0"
            placeholder={t('commandPalette.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
            <LucideCommand className="h-3 w-3" />
          </kbd>
          <kbd className="ml-1 rounded bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
            K
          </kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t('commandPalette.noResults')}
            </div>
          ) : (
            <div>
              {filteredItems.map((item, index) => (
                <div
                  key={item.path}
                  className={`flex cursor-pointer items-center px-4 py-2 ${
                    selectedIndex === index ? 'bg-muted' : ''
                  }`}
                  onClick={() => navigateTo(item.path)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="mr-2 flex h-6 w-6 items-center justify-center">
                    {item.icon}
                  </div>
                  <div>{item.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
};

CommandPalette.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
    })
  ),
}; 