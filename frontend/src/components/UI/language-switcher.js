import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button } from './button';

/**
 * Language switcher component
 * Allows users to change the application language
 */
const LanguageSwitcher = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);
  
  // Languages supported by the application
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pt', name: 'Português' }
  ];

  // Update current language when i18n.language changes
  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  // Change language handler
  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setCurrentLang(langCode);
    // Store language preference
    localStorage.setItem('preferredLanguage', langCode);
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={currentLang === lang.code ? 'default' : 'ghost'}
          size="sm"
          onClick={() => changeLanguage(lang.code)}
          className={`px-2 py-1 text-xs ${currentLang === lang.code ? 'font-bold' : 'font-normal'}`}
        >
          {lang.code.toUpperCase()}
        </Button>
      ))}
    </div>
  );
};

LanguageSwitcher.propTypes = {
  className: PropTypes.string
};

export default LanguageSwitcher; 