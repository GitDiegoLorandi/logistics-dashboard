import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Menu,
  X,
  Home,
  Package,
  Truck,
  Users,
  BarChart3,
  Settings,
  Activity,
  Bell,
  LogOut,
  User,
  UserCircle,
  Mail,
  Info,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Grid, GridItem } from '../UI/grid';
import { Button } from '../UI/button';
import { Badge } from '../UI/badge';
import { cn } from '../../lib/utils';
import LanguageSwitcher from '../UI/language-switcher';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Refs for dropdown menus
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Initialize notifications (placeholder)
    setNotifications([
      {
        id: 1,
        message: 'New delivery assigned',
        type: 'info',
        time: '2 min ago',
      },
      {
        id: 2,
        message: 'Delivery completed',
        type: 'success',
        time: '5 min ago',
      },
      {
        id: 3,
        message: 'Delivery delayed',
        type: 'warning',
        time: '10 min ago',
      },
      {
        id: 4,
        message: 'System update completed',
        type: 'success',
        time: '1 hour ago',
      },
    ]);

    // Add click outside listener
    const handleClickOutside = event => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Define navigation items with role access
  const allNavigationItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      path: '/dashboard',
      roles: ['admin', 'user', 'manager', 'deliverer'],
    },
    {
      id: 'deliveries',
      label: 'Deliveries',
      icon: Package,
      path: '/dashboard/deliveries',
      roles: ['admin', 'user', 'manager', 'deliverer'],
    },
    {
      id: 'deliverers',
      label: 'Deliverers',
      icon: Truck,
      path: '/dashboard/deliverers',
      roles: ['admin', 'user', 'manager'],
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      path: '/dashboard/users',
      roles: ['admin'],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/dashboard/analytics',
      roles: ['admin', 'manager'],
    },
    {
      id: 'jobs',
      label: 'Background Jobs',
      icon: Activity,
      path: '/dashboard/jobs',
      roles: ['admin'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/dashboard/settings',
      roles: ['admin', 'user', 'manager', 'deliverer'],
    },
  ];

  // Filter navigation items based on user role
  const navigationItems = allNavigationItems.filter(item => {
    // If no user or no roles defined, don't show the item
    if (!user || !item.roles) return false;

    // Show the item if user's role is included in the item's roles
    return item.roles.includes(user.role?.toLowerCase() || 'user');
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActiveRoute = path => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Handle notification click
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false); // Close other dropdown
  };

  // Handle user menu click
  const handleUserMenuClick = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false); // Close other dropdown
  };

  // Handle notification item click
  const handleNotificationItemClick = notification => {
    // Mark as read logic would go here
    toast.info(`Viewed notification: ${notification.message}`);
    setShowNotifications(false);
  };

  // Get notification badge variant based on type
  const getNotificationVariant = type => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'destructive';
      case 'info':
      default:
        return 'info';
    }
  };

  // Navigate to profile
  const navigateToProfile = () => {
    navigate('/dashboard/settings');
    setShowUserMenu(false);
  };

  // Redirect if user tries to access unauthorized route
  useEffect(() => {
    if (user && location.pathname !== '/dashboard') {
      const currentPath = location.pathname;
      const hasAccess = allNavigationItems.some(
        item =>
          item.path === currentPath &&
          item.roles.includes(user.role?.toLowerCase() || 'user')
      );

      if (!hasAccess) {
        navigate('/dashboard');
        toast.warning('You do not have access to that section');
      }
    }
  }, [location.pathname, user, navigate]);

  return (
    <div className='min-h-screen bg-background'>
      <Grid className='min-h-screen'>
        {/* Sidebar */}
        <GridItem
          colSpan={sidebarOpen ? 'col-span-2' : 'col-span-1'}
          className={cn(
            'bg-card border-r border-border transition-all duration-300',
            'flex flex-col h-screen'
          )}
        >
          <div className='p-4 flex items-center justify-between border-b border-border'>
            <div
              className={cn(
                'flex items-center gap-2',
                !sidebarOpen && 'justify-center'
              )}
            >
              <Package className='h-6 w-6 text-primary' />
              {sidebarOpen && <h1 className='text-lg font-bold'>Logistics</h1>}
            </div>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='rounded-full'
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </Button>
          </div>

          <nav className='flex-1 p-2 space-y-1 overflow-y-auto'>
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);

              return (
                <Button
                  key={item.id}
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    !sidebarOpen && 'justify-center px-0'
                  )}
                  onClick={() => navigate(item.path)}
                >
                  <Icon
                    size={18}
                    className={cn('mr-2', !sidebarOpen && 'mr-0')}
                  />
                  {sidebarOpen && <span>{item.label}</span>}
                </Button>
              );
            })}
          </nav>

          <div className='border-t border-border p-4'>
            <div className='flex items-center gap-2 mb-4'>
              <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary'>
                {user?.name?.charAt(0).toUpperCase() || <User size={16} />}
              </div>
              {sidebarOpen && (
                <div className='flex flex-col'>
                  <span className='text-sm font-medium'>
                    {user?.name || 'User'}
                  </span>
                  <span className='text-xs text-muted-foreground capitalize'>
                    {user?.role || 'user'}
                  </span>
                </div>
              )}
            </div>
            <Button
              variant='outline'
              size='sm'
              className={cn('w-full', !sidebarOpen && 'justify-center px-0')}
              onClick={handleLogout}
            >
              <LogOut
                size={16}
                className={cn('mr-2', !sidebarOpen && 'mr-0')}
              />
              {sidebarOpen && <span>Logout</span>}
            </Button>
          </div>
        </GridItem>

        {/* Main Content */}
        <GridItem
          colSpan={sidebarOpen ? 'col-span-10' : 'col-span-11'}
          className='flex flex-col h-screen'
        >
          {/* Header */}
          <header className='h-16 border-b border-border flex items-center justify-between px-6'>
            <h2 className='text-lg font-medium'>
              {navigationItems.find(item => isActiveRoute(item.path))?.label ||
                'Dashboard'}
            </h2>
            <div className='flex items-center gap-4'>
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              {/* Notifications */}
              <div className='relative' ref={notificationRef}>
                <Button
                  variant='ghost'
                  size='icon'
                  className='rounded-full'
                  onClick={handleNotificationClick}
                >
                  <Bell size={18} />
                  {notifications.length > 0 && (
                    <span className='absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive flex items-center justify-center text-[10px] text-white'>
                      {notifications.length}
                    </span>
                  )}
                </Button>

                {showNotifications && (
                  <div className='absolute right-0 mt-2 w-80 bg-card border border-border rounded-md shadow-lg z-50'>
                    <div className='p-3 border-b border-border'>
                      <h3 className='font-medium'>Notifications</h3>
                    </div>
                    <div className='max-h-80 overflow-y-auto'>
                      {notifications.length > 0 ? (
                        <div className='divide-y divide-border'>
                          {notifications.map(notification => (
                            <div
                              key={notification.id}
                              className='p-3 hover:bg-accent cursor-pointer'
                              onClick={() =>
                                handleNotificationItemClick(notification)
                              }
                            >
                              <div className='flex items-start gap-2'>
                                <Badge
                                  variant={getNotificationVariant(
                                    notification.type
                                  )}
                                >
                                  {notification.type}
                                </Badge>
                                <div className='flex-1'>
                                  <p className='text-sm'>
                                    {notification.message}
                                  </p>
                                  <p className='text-xs text-muted-foreground mt-1'>
                                    {notification.time}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className='p-4 text-center text-muted-foreground'>
                          <p>No notifications</p>
                        </div>
                      )}
                    </div>
                    <div className='p-2 border-t border-border'>
                      <Button variant='ghost' size='sm' className='w-full'>
                        View all
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className='relative' ref={userMenuRef}>
                <Button
                  variant='ghost'
                  className='rounded-full flex items-center gap-2'
                  onClick={handleUserMenuClick}
                >
                  <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary'>
                    {user?.name?.charAt(0).toUpperCase() || <User size={16} />}
                  </div>
                </Button>

                {showUserMenu && (
                  <div className='absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50'>
                    <div className='p-2'>
                      <Button
                        variant='ghost'
                        className='w-full justify-start'
                        onClick={navigateToProfile}
                      >
                        <UserCircle size={16} className='mr-2' />
                        Profile
                      </Button>
                      <Button
                        variant='ghost'
                        className='w-full justify-start'
                        onClick={handleLogout}
                      >
                        <LogOut size={16} className='mr-2' />
                        Logout
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className='flex-1 p-6 overflow-y-auto'>
            <Outlet />
          </main>
        </GridItem>
      </Grid>
    </div>
  );
};

export default DashboardLayout;
