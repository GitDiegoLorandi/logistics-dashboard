import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LucideMenu, 
  LucideX, 
  LucidePackage, 
  LucideTruck, 
  LucideUsers, 
  LucideBarChart2, 
  LucideBriefcase,
  LucideSettings,
  LucideLogOut,
  LucideChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Breadcrumbs } from '../ui/breadcrumbs';
import { CommandPalette } from '../ui/command-palette';
import { cn } from '../../lib/utils';
import LanguageSwitcher from '../ui/language-switcher';
import { useTranslation } from '../../hooks/use-translation';
import ThemeToggle from '../ui/ThemeToggle';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();
  const { t } = useTranslation('common');
  
  // Get current user from localStorage on mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Check if user has required role
  const hasRole = (requiredRoles) => {
    if (!currentUser || !currentUser.role) return false;
    const userRole = currentUser.role.toLowerCase();
    return requiredRoles.includes(userRole);
  };
  
  // All possible navigation items with role requirements
  const allNavItems = [
    { 
      path: '/dashboard', 
      icon: <LucideBarChart2 className="h-5 w-5" />, 
      label: t('navigation.dashboard'),
      roles: ['admin', 'user', 'manager', 'deliverer'],
      color: 'text-[var(--color-primary)]'
    },
    { 
      path: '/dashboard/deliveries', 
      icon: <LucidePackage className="h-5 w-5" />, 
      label: t('navigation.deliveries'),
      roles: ['admin', 'user', 'manager', 'deliverer'],
      color: 'text-[var(--color-secondary)]'
    },
    { 
      path: '/dashboard/deliverers', 
      icon: <LucideTruck className="h-5 w-5" />, 
      label: t('navigation.deliverers'),
      roles: ['admin', 'user', 'manager', 'deliverer'],
      color: 'text-[var(--color-accent)]'
    },
    { 
      path: '/dashboard/users', 
      icon: <LucideUsers className="h-5 w-5" />, 
      label: t('navigation.users'),
      roles: ['admin'],
      color: 'text-[var(--color-info)]'
    },

    { 
      path: '/dashboard/jobs', 
      icon: <LucideBriefcase className="h-5 w-5" />, 
      label: t('navigation.jobs'),
      roles: ['admin'],
      color: 'text-[var(--color-warning)]'
    },
    { 
      path: '/dashboard/settings', 
      icon: <LucideSettings className="h-5 w-5" />, 
      label: t('navigation.settings'),
      roles: ['admin', 'user', 'manager', 'deliverer'],
      color: 'text-[var(--color-primary-light)]'
    },
  ];
  
  // Filter navigation items based on user role
  const navItems = allNavItems.filter(item => {
    if (!currentUser || !item.roles) return false;
    return item.roles.includes(currentUser.role?.toLowerCase() || 'user');
  });
  
  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(path => path);
    
    // Map of path segments to translation keys
    const pathMap = {
      dashboard: 'navigation.dashboard',
      deliveries: 'navigation.deliveries',
      deliverers: 'navigation.deliverers',
      users: 'navigation.users',
      jobs: 'navigation.jobs',
      settings: 'navigation.settings',
      new: 'actions.add',
      edit: 'actions.edit',
    };
    
    return [
      { path: '/dashboard', label: t('navigation.home') },
      ...paths.map((path, index) => {
        const url = `/${paths.slice(0, index + 1).join('/')}`;
        return {
          path: url,
          label: pathMap[path] ? t(pathMap[path]) : path,
        };
      }),
    ];
  };
  
  // Toggle keyboard shortcut for command palette
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Handle logout
  const handleLogout = () => {
    // Clear token and redirect to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };
  
  // Get user role text for display
  const getUserRoleText = () => {
    if (!currentUser || !currentUser.role) return '';
    
    // Capitalize first letter
    const role = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).toLowerCase();
    return role;
  };
  
  return (
    <div className="flex h-screen bg-[var(--color-background)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[var(--sidebar-bg)] border-r border-[var(--color-border)] shadow-[var(--shadow-lg)] transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* App title header with enhanced visibility */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] px-4">
          <Link to="/dashboard" className="group flex items-center gap-2">
            <div className="rounded-md bg-white p-1 text-[var(--color-primary)] shadow-md">
              <LucideTruck className="h-5 w-5" />
            </div>
            <div className="relative">
              <span className="text-lg font-extrabold tracking-wide text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">
                {t('app.title', { ns: 'common' })}
              </span>
              {/* Add a subtle highlight effect */}
              <span className="absolute -inset-1 rounded-lg bg-white/10 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100"></span>
            </div>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(false)} 
            className="text-white hover:bg-white/20 lg:hidden"
          >
            <LucideX className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="space-y-1 p-4">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
                location.pathname === item.path || 
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
                  ? `bg-[var(--input-bg)] font-medium shadow-[var(--shadow-sm)] border-l-4 border-[var(--color-primary)] ${item.color}`
                  : `text-[var(--text-secondary)] hover:bg-[var(--input-bg)] hover:text-[var(--text-primary)] hover:shadow-[var(--shadow-sm)] hover:translate-x-1 ${item.color}`
              )}
            >
              <span className={item.color}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 border-t border-[var(--color-border)] p-4">
          <div className="mb-4 flex items-center gap-3">
            <Avatar className="border-2 border-[var(--color-primary)] ring-2 ring-[var(--color-primary-light)] ring-opacity-50">
              <AvatarImage src="/avatars/user.png" />
              <AvatarFallback className="bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white">
                {currentUser?.firstName?.charAt(0) || 'U'}
                {currentUser?.lastName?.charAt(0) || ''}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {currentUser?.firstName || ''} {currentUser?.lastName || 'User'}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">{getUserRoleText()}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="flex w-full items-center justify-start gap-2 hover:border-[var(--color-error)] hover:text-[var(--color-error)]"
            onClick={handleLogout}
          >
            <LucideLogOut className="h-4 w-4" />
            {t('logout.title', { ns: 'common' })}
          </Button>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--header-bg)] px-4 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden"
            >
              <LucideMenu className="h-5 w-5" />
            </Button>
            {/* Add a visible app title in the header for larger screens */}
            <div className="hidden items-center gap-2 md:flex">
              <div className="rounded-md bg-[var(--color-primary)] p-1 text-white">
                <LucideTruck className="h-5 w-5" />
              </div>
              <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] bg-clip-text text-lg font-bold text-transparent">
                {t('app.title', { ns: 'common' })}
              </span>
            </div>
            <Breadcrumbs items={generateBreadcrumbs()} separator={<LucideChevronRight className="h-4 w-4 text-[var(--color-primary)]" />} />
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </header>
        
        {/* Main content area */}
        <main id="main-content" className="flex-1 overflow-auto bg-[var(--color-background)] bg-opacity-50 p-6 backdrop-blur-sm">
          <Outlet />
        </main>
      </div>
      
      {/* Command palette */}
      <CommandPalette 
        open={commandPaletteOpen} 
        onOpenChange={setCommandPaletteOpen} 
        navItems={navItems}
      />
    </div>
  );
};

export default DashboardLayout;
