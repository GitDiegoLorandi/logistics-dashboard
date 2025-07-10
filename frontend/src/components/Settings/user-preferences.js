import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save, Moon, Sun, Bell, BellOff } from 'lucide-react';
import { Button } from '../UI/button';

const UserPreferences = () => {
  const [preferences, setPreferences] = useState({
    theme: 'light',
    notifications: true,
    emailNotifications: true,
    language: 'en',
    timeFormat: '24h',
    defaultView: 'dashboard',
    compactMode: false,
  });
  
  const [loading, setLoading] = useState(false);
  
  // Load preferences from localStorage on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Failed to parse saved preferences:', error);
      }
    }
  }, []);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  const handleSave = async () => {
    setLoading(true);
    
    try {
      // In a real app, this would call an API endpoint
      // await userAPI.updatePreferences(preferences);
      
      // Save to localStorage
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      
      // Apply theme
      document.documentElement.classList.toggle('dark', preferences.theme === 'dark');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success('Preferences saved successfully');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleTheme = () => {
    setPreferences(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  };
  
  const toggleNotifications = () => {
    setPreferences(prev => ({
      ...prev,
      notifications: !prev.notifications,
    }));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Preferences</h2>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? (
            <>
              <svg
                className="-ml-1 mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Save Preferences
            </>
          )}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Theme */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">Theme</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="gap-2"
            >
              {preferences.theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4" /> Light Mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" /> Dark Mode
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Currently using {preferences.theme === 'dark' ? 'dark' : 'light'} mode
          </p>
        </div>
        
        {/* Notifications */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">Notifications</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleNotifications}
              className="gap-2"
            >
              {preferences.notifications ? (
                <>
                  <BellOff className="h-4 w-4" /> Disable
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" /> Enable
                </>
              )}
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifications"
                name="notifications"
                checked={preferences.notifications}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="notifications" className="ml-2 text-sm">
                In-app notifications
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                name="emailNotifications"
                checked={preferences.emailNotifications}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="emailNotifications" className="ml-2 text-sm">
                Email notifications
              </label>
            </div>
          </div>
        </div>
        
        {/* Language */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-4 font-medium">Language</h3>
          <select
            name="language"
            value={preferences.language}
            onChange={handleChange}
            className="h-10 w-full rounded-md border border-input bg-background px-3"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="pt">Portuguese</option>
          </select>
        </div>
        
        {/* Time Format */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-4 font-medium">Time Format</h3>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="timeFormat"
                value="12h"
                checked={preferences.timeFormat === '12h'}
                onChange={handleChange}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              />
              <span className="ml-2 text-sm">12-hour (1:30 PM)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="timeFormat"
                value="24h"
                checked={preferences.timeFormat === '24h'}
                onChange={handleChange}
                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
              />
              <span className="ml-2 text-sm">24-hour (13:30)</span>
            </label>
          </div>
        </div>
        
        {/* Default View */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-4 font-medium">Default View</h3>
          <select
            name="defaultView"
            value={preferences.defaultView}
            onChange={handleChange}
            className="h-10 w-full rounded-md border border-input bg-background px-3"
          >
            <option value="dashboard">Dashboard</option>
            <option value="deliveries">Deliveries</option>
            <option value="deliverers">Deliverers</option>
            <option value="analytics">Analytics</option>
          </select>
        </div>
        
        {/* Compact Mode */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Compact Mode</h3>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                name="compactMode"
                checked={preferences.compactMode}
                onChange={handleChange}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30"></div>
            </label>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Use compact mode to display more content on screen
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences; 