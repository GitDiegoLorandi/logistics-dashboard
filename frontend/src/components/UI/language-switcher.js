import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { Button } from './button';

/**
 * Language switcher component
 * Allows users to change the application language
 */
const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Available languages
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'pt', name: 'Português' },
    { code: 'de', name: 'Deutsch' }
  ];
  
  // Current language
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  
  // Handle language change
  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change language"
      >
        <Globe className="h-5 w-5" />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-card border border-border z-50">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                className="flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-muted"
              >
                {language.name}
                {language.code === currentLanguage.code && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher; 