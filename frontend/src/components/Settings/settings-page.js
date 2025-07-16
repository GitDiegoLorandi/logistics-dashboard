import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Settings,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Key,
  Mail,
  Phone,
  Save,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Edit3,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { userAPI, authAPI } from '../../services/api';
import { syncUserData, ensureConsistentUserIdFormat, getBestAvailableUserData } from './user-preferences';
import { Button } from '../UI/button';
import { Input } from '../UI/input';
import { Select } from '../UI/select';
import { Card, CardContent } from '../UI/card';
import { Badge } from '../UI/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../UI/tabs';
import { Switch } from '../UI/switch';
import { Label } from '../UI/label';
import { cn } from '../../lib/utils';

const SettingsPage = () => {
  const { t } = useTranslation(['settings', 'common']);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Profile Settings
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    avatar: null,
  });

  // System Preferences
  const [systemPrefs, setSystemPrefs] = useState({
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    autoRefresh: true,
    refreshInterval: 30,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    deliveryUpdates: true,
    systemAlerts: true,
    weeklyReports: true,
    criticalAlertsOnly: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  });

  const tabs = [
    { id: 'profile', label: t('profile'), icon: User },
    { id: 'system', label: t('system'), icon: Settings },
    { id: 'notifications', label: t('notificationsTab', { defaultValue: 'Notifications' }), icon: Bell },
    { id: 'data', label: t('data'), icon: Database },
  ];

  useEffect(() => {
    fetchUserProfile();

    // Load saved preferences from localStorage
    const savedPrefs = localStorage.getItem('systemPrefs');
    if (savedPrefs) {
      try {
        const parsedPrefs = JSON.parse(savedPrefs);
        setSystemPrefs(prev => ({
          ...prev,
          ...parsedPrefs,
        }));
      } catch (error) {
        console.error('Error parsing saved preferences:', error);
      }
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // First try to get best available user data as a fallback
      const bestAvailableData = getBestAvailableUserData();
      if (bestAvailableData && Object.keys(bestAvailableData).length > 0) {
        // Pre-populate form with best available data while we fetch from API
        setProfileData({
          firstName: bestAvailableData.firstName || '',
          lastName: bestAvailableData.lastName || '',
          email: bestAvailableData.email || '',
          phone: bestAvailableData.phone || '',
          avatar: bestAvailableData.avatar || null,
        });
        setCurrentUser(bestAvailableData);
      }
      
      // Now try to get fresh data from the API
      try {
        // Get the current user data from the API
        const response = await userAPI.getProfile();
        console.log('User profile data received:', response);
        
        // Extract user data handling possible response structures
        const userData = response?.data || response;
        
        if (!userData) {
          throw new Error('No user data received');
        }
        
        // Ensure ID format is consistent
        const normalizedUserData = ensureConsistentUserIdFormat(userData);
        
        // Sync with localStorage
        syncUserData(normalizedUserData);
        
        // Update state
        setCurrentUser(normalizedUserData);
        setProfileData({
          firstName: normalizedUserData.firstName || '',
          lastName: normalizedUserData.lastName || '',
          email: normalizedUserData.email || '',
          phone: normalizedUserData.phone || '',
          avatar: normalizedUserData.avatar || null,
        });
        
        console.log('Profile data set successfully:', {
          firstName: normalizedUserData.firstName,
          lastName: normalizedUserData.lastName,
          email: normalizedUserData.email,
        });
      } catch (apiError) {
        console.error('Error fetching user profile from API:', apiError);
        
        // We already set data from bestAvailableData if it exists, 
        // so we only need to show an error message if we have no data at all
        if (!bestAvailableData || Object.keys(bestAvailableData).length === 0) {
          toast.error(t('failedToLoadProfile', { defaultValue: 'Failed to load profile data' }));
          // Set empty profile data as last resort
          setProfileData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            avatar: null,
          });
        } else {
          // Just show a warning that we're using cached data
          toast.warn(t('usingCachedProfile', { defaultValue: 'Using cached profile data' }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async e => {
    e.preventDefault();
    try {
      setSaving(true);
      
      // Ensure we have the most complete user data for the update
      const currentUserData = currentUser || getBestAvailableUserData();
      
      // Create the update data with proper ID fields
      const updateData = {
        ...profileData,
        // Preserve IDs
        id: currentUserData.id,
        _id: currentUserData._id
      };
      
      // Log the update attempt
      console.log('Updating profile with data:', updateData);
      
      try {
        // Try to update through API
        const updatedData = await userAPI.updateProfile(updateData);
        console.log('Profile update API response:', updatedData);
        
        // Sync updated data with localStorage
        syncUserData({
          ...currentUserData,
          ...profileData,
          ...(updatedData?.user || updatedData || {})
        });
        
        toast.success(t('profileUpdated', { defaultValue: 'Profile updated successfully' }));
      } catch (apiError) {
        console.error('API error updating profile:', apiError);
        
        // Even if API fails, still update the localStorage data
        // This allows the UI to remain consistent even if backend sync fails
        syncUserData({
          ...currentUserData,
          ...profileData
        });
        
        toast.warn(t('profileUpdatedLocallyOnly', { 
          defaultValue: 'Profile updated locally only. Changes will sync when connection is restored.'
        }));
      }
      
      // Refresh user profile to get latest data and ensure consistency
      await fetchUserProfile();
    } catch (error) {
      console.error('Error in profile update process:', error);
      toast.error(t('profileUpdateFailed', { defaultValue: 'Failed to update profile' }));
    } finally {
      setSaving(false);
    }
  };

  const handleSystemPrefsSubmit = async e => {
    e.preventDefault();
    try {
      setSaving(true);
      // Save to localStorage
      localStorage.setItem('systemPrefs', JSON.stringify(systemPrefs));

      // Apply language change immediately
      document.documentElement.lang = systemPrefs.language;

      toast.success('System preferences saved');
    } catch (error) {
      console.error('Error saving system preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationSubmit = async e => {
    e.preventDefault();
    try {
      setSaving(true);
      // In a real app, you'd save these to user preferences API
      localStorage.setItem(
        'notificationSettings',
        JSON.stringify(notificationSettings)
      );
      toast.success('Notification settings saved');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const exportData = () => {
    toast.info('Data export initiated. You will receive an email when ready.');
  };

  const exportDeliveries = async () => {
    try {
      setSaving(true);
      toast.info('Preparing deliveries export...');

      // In a real app, this would call an API endpoint
      // For now, simulate a successful export after a delay
      setTimeout(() => {
        const dummyData = [
          {
            id: 1,
            orderId: 'ORD-001',
            customer: 'John Doe',
            status: 'Delivered',
          },
          {
            id: 2,
            orderId: 'ORD-002',
            customer: 'Jane Smith',
            status: 'In Transit',
          },
        ];

        // Convert to CSV
        const headers = Object.keys(dummyData[0]).join(',');
        const rows = dummyData
          .map(item => Object.values(item).join(','))
          .join('\n');
        const csvContent = `${headers}\n${rows}`;

        // Create download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'deliveries_export.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        toast.success('Deliveries exported successfully!');
        setSaving(false);
      }, 1500);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export deliveries');
      setSaving(false);
    }
  };

  const renderProfileTab = () => (
    <div className='space-y-6'>
      <div className='flex flex-col gap-6 rounded-xl bg-card p-6 shadow'>
        <div>
          <h2 className='text-xl font-bold'>{t('profile')}</h2>
          <p className='text-muted-foreground'>{t('account')}</p>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>{t('firstName', { ns: 'users' })}</label>
            <Input
              value={profileData.firstName}
              onChange={e =>
                setProfileData({ ...profileData, firstName: e.target.value })
              }
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>{t('lastName', { ns: 'users' })}</label>
            <Input
              value={profileData.lastName}
              onChange={e =>
                setProfileData({ ...profileData, lastName: e.target.value })
              }
            />
          </div>
        </div>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>{t('email', { ns: 'users' })}</label>
            <Input
              type='email'
              value={profileData.email}
              onChange={e =>
                setProfileData({ ...profileData, email: e.target.value })
              }
              disabled
            />
          </div>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>{t('phone', { ns: 'users' })}</label>
            <Input
              type='tel'
              value={profileData.phone}
              onChange={e =>
                setProfileData({ ...profileData, phone: e.target.value })
              }
            />
          </div>
        </div>

        <div className='flex justify-end'>
          <Button
            onClick={handleProfileSubmit}
            disabled={saving}
            className='flex items-center gap-2'
          >
            <Save className='h-4 w-4' />
            {saving ? t('common:loading') : t('common:save')}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className='space-y-6'>
      <div className='flex flex-col gap-6 rounded-xl bg-card p-6 shadow'>
        <div>
          <h2 className='text-xl font-bold'>{t('system')}</h2>
          <p className='text-muted-foreground'>{t('preferences')}</p>
        </div>

        <form onSubmit={handleSystemPrefsSubmit} className='space-y-6'>
          <div>
            <h3 className='mb-4 text-lg font-medium'>{t('language')}</h3>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>{t('language')}</label>
                <Select
                  value={systemPrefs.language}
                  onChange={e =>
                    setSystemPrefs({
                      ...systemPrefs,
                      language: e.target.value,
                    })
                  }
                >
                  <option value='en'>{t('languages.en', { ns: 'settings' })}</option>
                  <option value='pt'>{t('languages.pt', { ns: 'settings' })}</option>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h3 className='mb-4 text-lg font-medium'>{t('regionalization', { defaultValue: 'Regionalization' })}</h3>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>{t('timezone')}</label>
                <Select
                  value={systemPrefs.timezone}
                  onChange={e =>
                    setSystemPrefs({
                      ...systemPrefs,
                      timezone: e.target.value,
                    })
                  }
                >
                  <option value='UTC'>UTC</option>
                  <option value='America/New_York'>Eastern Time (ET)</option>
                  <option value='America/Chicago'>Central Time (CT)</option>
                  <option value='America/Denver'>Mountain Time (MT)</option>
                  <option value='America/Los_Angeles'>Pacific Time (PT)</option>
                  <option value='America/Sao_Paulo'>Brasília Time (BRT)</option>
                </Select>
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>{t('dateFormat')}</label>
                <Select
                  value={systemPrefs.dateFormat}
                  onChange={e =>
                    setSystemPrefs({
                      ...systemPrefs,
                      dateFormat: e.target.value,
                    })
                  }
                >
                  <option value='MM/DD/YYYY'>MM/DD/YYYY</option>
                  <option value='DD/MM/YYYY'>DD/MM/YYYY</option>
                  <option value='YYYY-MM-DD'>YYYY-MM-DD</option>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <h3 className='mb-4 text-lg font-medium'>{t('dashboardBehavior', { defaultValue: 'Dashboard Behavior' })}</h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='auto-refresh'>{t('autoRefresh', { defaultValue: 'Auto Refresh' })}</Label>
                  <p className='text-sm text-muted-foreground'>
                    {t('autoRefreshDescription', { defaultValue: 'Automatically refresh dashboard data' })}
                  </p>
                </div>
                <Switch
                  id='auto-refresh'
                  checked={systemPrefs.autoRefresh}
                  onChange={checked =>
                    setSystemPrefs({
                      ...systemPrefs,
                      autoRefresh: checked,
                    })
                  }
                />
              </div>

              {systemPrefs.autoRefresh && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    {t('refreshInterval', { defaultValue: 'Refresh Interval (seconds)' })}
                  </label>
                  <Input
                    type='number'
                    min='10'
                    max='300'
                    value={systemPrefs.refreshInterval}
                    onChange={e =>
                      setSystemPrefs({
                        ...systemPrefs,
                        refreshInterval: parseInt(e.target.value, 10) || 30,
                      })
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <div className='flex justify-end'>
            <Button
              type="submit"
              disabled={saving}
              className='flex items-center gap-2'
            >
              <Save className='h-4 w-4' />
              {saving ? t('common:loading') : t('savePreferences', { defaultValue: 'Save Preferences' })}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className='space-y-6'>
      <div className='flex flex-col gap-6 rounded-xl bg-card p-6 shadow'>
        <div>
          <h2 className='text-xl font-bold'>{t('notificationsTab', { ns: 'settings' })}</h2>
          <p className='text-muted-foreground'>{t('notificationsDescription', { defaultValue: 'Configure how and when you receive notifications' })}</p>
        </div>

        <form onSubmit={handleNotificationSubmit} className='space-y-6'>
          <div>
            <h3 className='mb-4 text-lg font-medium'>{t('notificationChannels', { defaultValue: 'Notification Channels' })}</h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='email-notifications'>{t('notifications.email', { ns: 'settings' })}</Label>
                </div>
                <Switch
                  id='email-notifications'
                  checked={notificationSettings.emailNotifications}
                  onChange={checked =>
                    setNotificationSettings({
                      ...notificationSettings,
                      emailNotifications: checked,
                    })
                  }
                />
              </div>
              
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='push-notifications'>{t('notifications.push', { ns: 'settings' })}</Label>
                </div>
                <Switch
                  id='push-notifications'
                  checked={notificationSettings.pushNotifications}
                  onChange={checked =>
                    setNotificationSettings({
                      ...notificationSettings,
                      pushNotifications: checked,
                    })
                  }
                />
              </div>
              
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='sms-notifications'>{t('notifications.sms', { ns: 'settings' })}</Label>
                </div>
                <Switch
                  id='sms-notifications'
                  checked={notificationSettings.smsNotifications}
                  onChange={checked =>
                    setNotificationSettings({
                      ...notificationSettings,
                      smsNotifications: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className='mb-4 text-lg font-medium'>{t('notificationTypes', { defaultValue: 'Notification Types' })}</h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='delivery-updates'>{t('notifications.deliveryUpdates', { ns: 'settings' })}</Label>
                  <p className='text-sm text-muted-foreground'>
                    {t('deliveryUpdatesDescription', { defaultValue: 'Get notified when delivery status changes' })}
                  </p>
                </div>
                <Switch
                  id='delivery-updates'
                  checked={notificationSettings.deliveryUpdates}
                  onChange={checked =>
                    setNotificationSettings({
                      ...notificationSettings,
                      deliveryUpdates: checked,
                    })
                  }
                />
              </div>
              
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='system-alerts'>{t('notifications.systemAlerts', { ns: 'settings' })}</Label>
                  <p className='text-sm text-muted-foreground'>
                    {t('systemAlertsDescription', { defaultValue: 'Important system notifications and errors' })}
                  </p>
                </div>
                <Switch
                  id='system-alerts'
                  checked={notificationSettings.systemAlerts}
                  onChange={checked =>
                    setNotificationSettings({
                      ...notificationSettings,
                      systemAlerts: checked,
                    })
                  }
                />
              </div>
              
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='weekly-reports'>{t('notifications.weeklyReports', { ns: 'settings' })}</Label>
                  <p className='text-sm text-muted-foreground'>
                    {t('weeklyReportsDescription', { defaultValue: 'Performance summaries and analytics' })}
                  </p>
                </div>
                <Switch
                  id='weekly-reports'
                  checked={notificationSettings.weeklyReports}
                  onChange={checked =>
                    setNotificationSettings({
                      ...notificationSettings,
                      weeklyReports: checked,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className='mb-4 text-lg font-medium'>{t('quietHours', { defaultValue: 'Quiet Hours' })}</h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Label htmlFor='quiet-hours'>{t('enableQuietHours', { defaultValue: 'Enable Quiet Hours' })}</Label>
                  <p className='text-sm text-muted-foreground'>
                    {t('quietHoursDescription', { defaultValue: 'Suppress non-critical notifications during specified hours' })}
                  </p>
                </div>
                <Switch
                  id='quiet-hours'
                  checked={notificationSettings.quietHours.enabled}
                  onChange={checked =>
                    setNotificationSettings({
                      ...notificationSettings,
                      quietHours: {
                        ...notificationSettings.quietHours,
                        enabled: checked,
                      },
                    })
                  }
                />
              </div>
              
              {notificationSettings.quietHours.enabled && (
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='start-time'>{t('startTime', { defaultValue: 'Start Time' })}</Label>
                    <Input
                      id='start-time'
                      type='time'
                      value={notificationSettings.quietHours.start}
                      onChange={e =>
                        setNotificationSettings({
                          ...notificationSettings,
                          quietHours: {
                            ...notificationSettings.quietHours,
                            start: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='end-time'>{t('endTime', { defaultValue: 'End Time' })}</Label>
                    <Input
                      id='end-time'
                      type='time'
                      value={notificationSettings.quietHours.end}
                      onChange={e =>
                        setNotificationSettings({
                          ...notificationSettings,
                          quietHours: {
                            ...notificationSettings.quietHours,
                            end: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className='flex justify-end'>
            <Button
              type='submit'
              disabled={saving}
              className='flex items-center gap-2'
            >
              <Save className='h-4 w-4' />
              {saving ? t('common:loading') : t('saveNotificationSettings', { defaultValue: 'Save Notification Settings' })}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className='space-y-6'>
      <div className='flex flex-col gap-6 rounded-xl bg-card p-6 shadow'>
        <div>
          <h2 className='text-xl font-bold'>{t('data', { defaultValue: 'Data Management' })}</h2>
          <p className='text-muted-foreground'>{t('dataManagementDescription', { defaultValue: 'Import, export, and manage your data' })}</p>
        </div>

        <div className='space-y-6'>
          <div>
            <h3 className='mb-4 text-lg font-medium'>{t('dataExport', { defaultValue: 'Data Export' })}</h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-medium'>{t('exportDeliveries', { defaultValue: 'Export Deliveries' })}</p>
                  <p className='text-sm text-muted-foreground'>
                    {t('exportDeliveriesDescription', { defaultValue: 'Download delivery history in CSV format' })}
                  </p>
                </div>
                <Button
                  onClick={exportDeliveries}
                  variant="outline"
                  disabled={saving}
                  className='flex items-center gap-2'
                >
                  {saving ? (
                    <>
                      <RefreshCw className='h-4 w-4 animate-spin' />
                      {t('exporting', { defaultValue: 'Exporting...' })}
                    </>
                  ) : (
                    <>
                      <Download className='h-4 w-4' />
                      {t('exportDeliveries', { defaultValue: 'Export Deliveries' })}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className='mb-4 text-lg font-medium'>{t('dataImport', { defaultValue: 'Data Import' })}</h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-medium'>{t('importDeliveries', { defaultValue: 'Import Deliveries' })}</p>
                  <p className='text-sm text-muted-foreground'>
                    {t('importDeliveriesDescription', { defaultValue: 'Upload delivery data from CSV file' })}
                  </p>
                </div>
                <Button variant="outline" className='flex items-center gap-2'>
                  <Upload className='h-4 w-4' />
                  {t('chooseFile', { defaultValue: 'Choose File' })}
                  <input type='file' accept='.csv' className='hidden' />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className='mb-4 text-lg font-medium'>{t('dataRetention', { defaultValue: 'Data Retention' })}</h3>
            <div className='space-y-4'>
              <div className='grid grid-cols-1 gap-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>{t('automaticDataCleanup', { defaultValue: 'Automatic Data Cleanup' })}</label>
                  <Select>
                    <option value='never'>{t('neverDelete', { defaultValue: 'Never delete' })}</option>
                    <option value='1year'>{t('after1Year', { defaultValue: 'After 1 year' })}</option>
                    <option value='2years'>{t('after2Years', { defaultValue: 'After 2 years' })}</option>
                    <option value='5years'>{t('after5Years', { defaultValue: 'After 5 years' })}</option>
                  </Select>
                  <p className='text-xs text-muted-foreground'>
                    {t('automaticDataCleanupDescription', { defaultValue: 'Automatically delete old delivery records after specified period' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='border-t pt-6'>
            <h3 className='mb-4 text-lg font-medium text-destructive'>{t('dangerZone', { defaultValue: 'Danger Zone' })}</h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-medium'>{t('deleteAllData', { defaultValue: 'Delete All Data' })}</p>
                  <p className='text-sm text-muted-foreground'>
                    {t('deleteAllDataDescription', { defaultValue: 'Permanently delete all your account data. This action cannot be undone.' })}
                  </p>
                </div>
                <Button variant="destructive" className='flex items-center gap-2'>
                  <AlertTriangle className='h-4 w-4' />
                  {t('deleteAllData', { defaultValue: 'Delete All Data' })}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileTab();
      case 'system':
        return renderSystemTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'data':
        return renderDataTab();
      default:
        return renderProfileTab();
    }
  };

  if (loading) {
    return (
      <div className='mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-4 py-6'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
          <p className='text-muted-foreground'>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-6'>
      <div className='mb-8 flex flex-col gap-6 rounded-xl bg-card p-6 shadow md:flex-row md:items-start md:justify-between'>
        <div>
          <h1 className='flex items-center gap-2 text-2xl font-bold'>
            <Settings className='h-6 w-6 text-primary' />
            {t('title', { ns: 'settings' })}
          </h1>
          <p className='text-muted-foreground'>
            {t('preferencesSubtitle', { ns: 'settings' })}
          </p>
        </div>
      </div>

      <div className='flex flex-col gap-8 lg:flex-row'>
        <div className='lg:w-64'>
          <div className='sticky top-6 space-y-4 rounded-xl bg-card p-4 shadow'>
            <div className='space-y-1'>
              <h3 className='text-sm font-medium'>{t('title')}</h3>
              <nav className='flex flex-col gap-1'>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <tab.icon className='h-4 w-4' />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className='flex-1'>{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default SettingsPage;
