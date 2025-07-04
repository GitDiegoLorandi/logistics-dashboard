import React, { useState, useEffect } from 'react';
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
import { userAPI, authAPI } from '../../services/api';
import './SettingsPage.css';

const SettingsPage = () => {
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

  // Language translations
  const translations = {
    en: {
      profile: 'Profile',
      system: 'System',
      notifications: 'Notifications',
      security: 'Security',
      data: 'Data',
      appearance: 'Appearance',
      language: 'Language',
      localization: 'Localization',
      timezone: 'Timezone',
      dateFormat: 'Date Format',
      currency: 'Currency',
      dashboardBehavior: 'Dashboard Behavior',
      autoRefresh: 'Auto-refresh data',
      refreshInterval: 'Refresh Interval (seconds)',
      savePreferences: 'Save Preferences',
      preferencesTitle: 'System Preferences',
      preferencesSubtitle:
        'Customize your dashboard experience and system behavior',
    },
    pt_BR: {
      profile: 'Perfil',
      system: 'Sistema',
      notifications: 'Notificações',
      security: 'Segurança',
      data: 'Dados',
      appearance: 'Aparência',
      language: 'Idioma',
      localization: 'Localização',
      timezone: 'Fuso Horário',
      dateFormat: 'Formato de Data',
      currency: 'Moeda',
      dashboardBehavior: 'Comportamento do Painel',
      autoRefresh: 'Atualização automática de dados',
      refreshInterval: 'Intervalo de Atualização (segundos)',
      savePreferences: 'Salvar Preferências',
      preferencesTitle: 'Preferências do Sistema',
      preferencesSubtitle:
        'Personalize sua experiência no painel e o comportamento do sistema',
    },
  };

  // Get current language translations
  const getTranslation = key => {
    const currentLang = systemPrefs.language;
    const langData = translations[currentLang] || translations.en;
    return langData[key] || key;
  };

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

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginAlerts: true,
    apiKeyAccess: false,
    ipRestrictions: '',
    allowedDevices: 5,
  });

  const tabs = [
    { id: 'profile', label: getTranslation('profile'), icon: User },
    { id: 'system', label: getTranslation('system'), icon: Settings },
    { id: 'notifications', label: getTranslation('notifications'), icon: Bell },
    { id: 'security', label: getTranslation('security'), icon: Shield },
    { id: 'data', label: getTranslation('data'), icon: Database },
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
      const response = await userAPI.getProfile();
      const user = response.data;
      setCurrentUser(user);

      // Populate profile data
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: null,
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async e => {
    e.preventDefault();
    try {
      setSaving(true);
      await userAPI.updateProfile(profileData);
      toast.success('Profile updated successfully');
      fetchUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
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

  const generateApiKey = () => {
    const key =
      'sk_' +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    toast.success('New API key generated');
    return key;
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
    <div className='tab-content'>
      <div className='tab-header'>
        <h2>Profile Settings</h2>
        <p>Manage your personal information and preferences</p>
      </div>

      <form onSubmit={handleProfileSubmit} className='settings-form'>
        <div className='form-section'>
          <h3>Personal Information</h3>

          <div className='profile-avatar'>
            <div className='avatar'>
              <User size={48} />
            </div>
            <div className='avatar-actions'>
              <label className='btn-secondary'>
                <Edit3 size={16} />
                Change Avatar
                <input
                  type='file'
                  accept='image/*'
                  style={{ display: 'none' }}
                />
              </label>
              <button type='button' className='btn-outline'>
                Remove
              </button>
            </div>
          </div>

          <div className='form-row'>
            <div className='form-group'>
              <label>First Name</label>
              <input
                type='text'
                value={profileData.firstName}
                onChange={e =>
                  setProfileData({ ...profileData, firstName: e.target.value })
                }
                placeholder='Enter your first name'
              />
            </div>
            <div className='form-group'>
              <label>Last Name</label>
              <input
                type='text'
                value={profileData.lastName}
                onChange={e =>
                  setProfileData({ ...profileData, lastName: e.target.value })
                }
                placeholder='Enter your last name'
              />
            </div>
          </div>
        </div>

        <div className='form-section'>
          <h3>Contact Information</h3>
          <div className='form-group'>
            <label>Email Address</label>
            <div className='input-with-icon'>
              <Mail className='input-icon' size={18} />
              <input
                type='email'
                value={profileData.email}
                onChange={e =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
                placeholder='Enter your email'
                required
              />
            </div>
          </div>

          <div className='form-group'>
            <label>Phone Number</label>
            <div className='input-with-icon'>
              <Phone className='input-icon' size={18} />
              <input
                type='tel'
                value={profileData.phone}
                onChange={e =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
                placeholder='Enter your phone number'
              />
            </div>
          </div>
        </div>

        <div className='form-actions'>
          <button type='submit' className='btn-primary' disabled={saving}>
            {saving ? (
              <RefreshCw className='spinning' size={16} />
            ) : (
              <Save size={16} />
            )}
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );

  const renderSystemTab = () => (
    <div className='tab-content'>
      <div className='tab-header'>
        <h2>{getTranslation('preferencesTitle')}</h2>
        <p>{getTranslation('preferencesSubtitle')}</p>
      </div>

      <form onSubmit={handleSystemPrefsSubmit} className='settings-form'>
        <div className='form-section'>
          <h3>{getTranslation('appearance')}</h3>
          <div className='form-row'>
            <div className='form-group'>
              <label>{getTranslation('language')}</label>
              <select
                value={systemPrefs.language}
                onChange={e =>
                  setSystemPrefs({ ...systemPrefs, language: e.target.value })
                }
              >
                <option value='en'>English</option>
                <option value='pt_BR'>Português (Brasil)</option>
              </select>
            </div>
          </div>
        </div>

        <div className='form-section'>
          <h3>{getTranslation('localization')}</h3>
          <div className='form-row'>
            <div className='form-group'>
              <label>{getTranslation('timezone')}</label>
              <select
                value={systemPrefs.timezone}
                onChange={e =>
                  setSystemPrefs({ ...systemPrefs, timezone: e.target.value })
                }
              >
                <option value='UTC'>UTC</option>
                <option value='America/Sao_Paulo'>Brasília Time (BRT)</option>
                <option value='America/New_York'>Eastern Time</option>
                <option value='America/Chicago'>Central Time</option>
                <option value='America/Denver'>Mountain Time</option>
                <option value='America/Los_Angeles'>Pacific Time</option>
              </select>
            </div>
            <div className='form-group'>
              <label>{getTranslation('dateFormat')}</label>
              <select
                value={systemPrefs.dateFormat}
                onChange={e =>
                  setSystemPrefs({ ...systemPrefs, dateFormat: e.target.value })
                }
              >
                <option value='MM/DD/YYYY'>MM/DD/YYYY</option>
                <option value='DD/MM/YYYY'>DD/MM/YYYY</option>
                <option value='YYYY-MM-DD'>YYYY-MM-DD</option>
              </select>
            </div>
          </div>

          <div className='form-group'>
            <label>{getTranslation('currency')}</label>
            <select
              value={systemPrefs.currency}
              onChange={e =>
                setSystemPrefs({ ...systemPrefs, currency: e.target.value })
              }
            >
              <option value='USD'>USD - US Dollar</option>
              <option value='BRL'>BRL - Brazilian Real</option>
              <option value='EUR'>EUR - Euro</option>
              <option value='GBP'>GBP - British Pound</option>
              <option value='CAD'>CAD - Canadian Dollar</option>
            </select>
          </div>
        </div>

        <div className='form-section'>
          <h3>{getTranslation('dashboardBehavior')}</h3>
          <div className='form-group'>
            <label className='checkbox-label'>
              <input
                type='checkbox'
                checked={systemPrefs.autoRefresh}
                onChange={e =>
                  setSystemPrefs({
                    ...systemPrefs,
                    autoRefresh: e.target.checked,
                  })
                }
              />
              <span className='checkmark'></span>
              {getTranslation('autoRefresh')}
            </label>
          </div>

          {systemPrefs.autoRefresh && (
            <div className='form-group'>
              <label>{getTranslation('refreshInterval')}</label>
              <select
                value={systemPrefs.refreshInterval}
                onChange={e =>
                  setSystemPrefs({
                    ...systemPrefs,
                    refreshInterval: parseInt(e.target.value),
                  })
                }
              >
                <option value='15'>15 seconds</option>
                <option value='30'>30 seconds</option>
                <option value='60'>1 minute</option>
                <option value='300'>5 minutes</option>
              </select>
            </div>
          )}
        </div>

        <div className='form-actions'>
          <button type='submit' className='btn-primary' disabled={saving}>
            {saving ? (
              <RefreshCw className='spinning' size={16} />
            ) : (
              <Save size={16} />
            )}
            {getTranslation('savePreferences')}
          </button>
        </div>
      </form>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className='tab-content'>
      <div className='tab-header'>
        <h2>Notification Settings</h2>
        <p>Configure how and when you receive notifications</p>
      </div>

      <form onSubmit={handleNotificationSubmit} className='settings-form'>
        <div className='form-section'>
          <h3>Notification Channels</h3>
          <div className='notification-toggles'>
            <div className='form-group'>
              <label className='checkbox-label'>
                <input
                  type='checkbox'
                  checked={notificationSettings.emailNotifications}
                  onChange={e =>
                    setNotificationSettings({
                      ...notificationSettings,
                      emailNotifications: e.target.checked,
                    })
                  }
                />
                <span className='checkmark'></span>
                <Mail size={16} />
                Email Notifications
              </label>
            </div>

            <div className='form-group'>
              <label className='checkbox-label'>
                <input
                  type='checkbox'
                  checked={notificationSettings.pushNotifications}
                  onChange={e =>
                    setNotificationSettings({
                      ...notificationSettings,
                      pushNotifications: e.target.checked,
                    })
                  }
                />
                <span className='checkmark'></span>
                <Bell size={16} />
                Push Notifications
              </label>
            </div>

            <div className='form-group'>
              <label className='checkbox-label'>
                <input
                  type='checkbox'
                  checked={notificationSettings.smsNotifications}
                  onChange={e =>
                    setNotificationSettings({
                      ...notificationSettings,
                      smsNotifications: e.target.checked,
                    })
                  }
                />
                <span className='checkmark'></span>
                <Phone size={16} />
                SMS Notifications
              </label>
            </div>
          </div>
        </div>

        <div className='form-section'>
          <h3>Notification Types</h3>
          <div className='notification-types'>
            <div className='form-group'>
              <label className='checkbox-label'>
                <input
                  type='checkbox'
                  checked={notificationSettings.deliveryUpdates}
                  onChange={e =>
                    setNotificationSettings({
                      ...notificationSettings,
                      deliveryUpdates: e.target.checked,
                    })
                  }
                />
                <span className='checkmark'></span>
                Delivery Updates
              </label>
              <small>Get notified when delivery status changes</small>
            </div>

            <div className='form-group'>
              <label className='checkbox-label'>
                <input
                  type='checkbox'
                  checked={notificationSettings.systemAlerts}
                  onChange={e =>
                    setNotificationSettings({
                      ...notificationSettings,
                      systemAlerts: e.target.checked,
                    })
                  }
                />
                <span className='checkmark'></span>
                System Alerts
              </label>
              <small>Important system notifications and errors</small>
            </div>

            <div className='form-group'>
              <label className='checkbox-label'>
                <input
                  type='checkbox'
                  checked={notificationSettings.weeklyReports}
                  onChange={e =>
                    setNotificationSettings({
                      ...notificationSettings,
                      weeklyReports: e.target.checked,
                    })
                  }
                />
                <span className='checkmark'></span>
                Weekly Reports
              </label>
              <small>Performance summaries and analytics</small>
            </div>
          </div>
        </div>

        <div className='form-section'>
          <h3>Quiet Hours</h3>
          <div className='form-group'>
            <label className='checkbox-label'>
              <input
                type='checkbox'
                checked={notificationSettings.quietHours.enabled}
                onChange={e =>
                  setNotificationSettings({
                    ...notificationSettings,
                    quietHours: {
                      ...notificationSettings.quietHours,
                      enabled: e.target.checked,
                    },
                  })
                }
              />
              <span className='checkmark'></span>
              Enable Quiet Hours
            </label>
            <small>
              Suppress non-critical notifications during specified hours
            </small>
          </div>

          {notificationSettings.quietHours.enabled && (
            <div className='form-row'>
              <div className='form-group'>
                <label>Start Time</label>
                <input
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
              <div className='form-group'>
                <label>End Time</label>
                <input
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

        <div className='form-actions'>
          <button type='submit' className='btn-primary' disabled={saving}>
            {saving ? (
              <RefreshCw className='spinning' size={16} />
            ) : (
              <Save size={16} />
            )}
            Save Notification Settings
          </button>
        </div>
      </form>
    </div>
  );

  const renderSecurityTab = () => (
    <div className='tab-content'>
      <div className='tab-header'>
        <h2>Security Settings</h2>
        <p>Manage your account security and access controls</p>
      </div>

      <div className='settings-form'>
        <div className='form-section'>
          <h3>Authentication</h3>
          <div className='security-item'>
            <div className='security-info'>
              <h4>Two-Factor Authentication</h4>
              <p>Add an extra layer of security to your account</p>
            </div>
            <div className='security-action'>
              <button
                className={`btn-toggle ${securitySettings.twoFactorAuth ? 'active' : ''}`}
                onClick={() =>
                  setSecuritySettings({
                    ...securitySettings,
                    twoFactorAuth: !securitySettings.twoFactorAuth,
                  })
                }
              >
                {securitySettings.twoFactorAuth ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          <div className='form-group'>
            <label>Session Timeout (minutes)</label>
            <select
              value={securitySettings.sessionTimeout}
              onChange={e =>
                setSecuritySettings({
                  ...securitySettings,
                  sessionTimeout: parseInt(e.target.value),
                })
              }
            >
              <option value='15'>15 minutes</option>
              <option value='30'>30 minutes</option>
              <option value='60'>1 hour</option>
              <option value='240'>4 hours</option>
              <option value='480'>8 hours</option>
            </select>
          </div>
        </div>

        <div className='form-section'>
          <h3>API Access</h3>
          <div className='security-item'>
            <div className='security-info'>
              <h4>API Key Access</h4>
              <p>Generate API keys for third-party integrations</p>
            </div>
            <div className='security-action'>
              <button
                className={`btn-toggle ${securitySettings.apiKeyAccess ? 'active' : ''}`}
                onClick={() =>
                  setSecuritySettings({
                    ...securitySettings,
                    apiKeyAccess: !securitySettings.apiKeyAccess,
                  })
                }
              >
                {securitySettings.apiKeyAccess ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {securitySettings.apiKeyAccess && (
            <div className='api-key-section'>
              <div className='api-key-display'>
                <label>Current API Key</label>
                <div className='api-key-input'>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value='sk_1234567890abcdef'
                    readOnly
                  />
                  <button
                    type='button'
                    onClick={() => setShowApiKey(!showApiKey)}
                    className='btn-icon'
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type='button'
                onClick={generateApiKey}
                className='btn-secondary'
              >
                <RefreshCw size={16} />
                Generate New Key
              </button>
            </div>
          )}
        </div>

        <div className='form-section'>
          <h3>Login Security</h3>
          <div className='form-group'>
            <label className='checkbox-label'>
              <input
                type='checkbox'
                checked={securitySettings.loginAlerts}
                onChange={e =>
                  setSecuritySettings({
                    ...securitySettings,
                    loginAlerts: e.target.checked,
                  })
                }
              />
              <span className='checkmark'></span>
              Email alerts for new logins
            </label>
          </div>

          <div className='form-group'>
            <label>Maximum Allowed Devices</label>
            <select
              value={securitySettings.allowedDevices}
              onChange={e =>
                setSecuritySettings({
                  ...securitySettings,
                  allowedDevices: parseInt(e.target.value),
                })
              }
            >
              <option value='3'>3 devices</option>
              <option value='5'>5 devices</option>
              <option value='10'>10 devices</option>
              <option value='unlimited'>Unlimited</option>
            </select>
          </div>
        </div>

        <div className='form-actions'>
          <button
            type='button'
            onClick={() => toast.success('Security settings saved')}
            className='btn-primary'
          >
            <Save size={16} />
            Save Security Settings
          </button>
        </div>
      </div>
    </div>
  );

  const renderDataTab = () => (
    <div className='tab-content'>
      <div className='tab-header'>
        <h2>Data Management</h2>
        <p>Import, export, and manage your data</p>
      </div>

      <div className='settings-form'>
        <div className='form-section'>
          <h3>Data Export</h3>
          <div className='data-actions'>
            <div className='data-action-item'>
              <div className='data-info'>
                <h4>Export Deliveries</h4>
                <p>Download delivery history in CSV format</p>
              </div>
              <button
                onClick={exportDeliveries}
                className='btn-secondary'
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw className='spinning' size={16} />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Export Deliveries
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className='form-section'>
          <h3>Data Import</h3>
          <div className='data-actions'>
            <div className='data-action-item'>
              <div className='data-info'>
                <h4>Import Deliveries</h4>
                <p>Upload delivery data from CSV file</p>
              </div>
              <label className='file-upload-btn'>
                <Upload size={16} />
                Choose File
                <input type='file' accept='.csv' style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>

        <div className='form-section'>
          <h3>Data Retention</h3>
          <div className='form-group'>
            <label>Automatic Data Cleanup</label>
            <select>
              <option value='never'>Never delete</option>
              <option value='1year'>After 1 year</option>
              <option value='2years'>After 2 years</option>
              <option value='5years'>After 5 years</option>
            </select>
            <small>
              Automatically delete old delivery records after specified period
            </small>
          </div>
        </div>

        <div className='form-section danger-zone'>
          <h3>Danger Zone</h3>
          <div className='danger-actions'>
            <div className='danger-item'>
              <div className='danger-info'>
                <h4>Delete All Data</h4>
                <p>
                  Permanently delete all your account data. This action cannot
                  be undone.
                </p>
              </div>
              <button className='btn-danger'>
                <AlertTriangle size={16} />
                Delete All Data
              </button>
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
      case 'security':
        return renderSecurityTab();
      case 'data':
        return renderDataTab();
      default:
        return renderProfileTab();
    }
  };

  if (loading) {
    return (
      <div className='settings-page'>
        <div className='settings-loading'>
          <div className='loading-spinner'></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='settings-page'>
      <div className='settings-header'>
        <h1>Settings</h1>
        <p>Manage your account and system preferences</p>
      </div>

      <div className='settings-container'>
        <div className='settings-sidebar'>
          <nav className='settings-nav'>
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <IconComponent size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className='settings-content'>{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default SettingsPage;
