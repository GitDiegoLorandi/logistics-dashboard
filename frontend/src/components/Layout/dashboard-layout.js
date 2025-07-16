import React, { useState } from 'react';
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

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation('common');
  
  // Navigation items
  const navItems = [
    { path: '/dashboard', icon: <LucideBarChart2 className="h-5 w-5" />, label: t('navigation.dashboard') },
    { path: '/dashboard/deliveries', icon: <LucidePackage className="h-5 w-5" />, label: t('navigation.deliveries') },
    { path: '/dashboard/deliverers', icon: <LucideTruck className="h-5 w-5" />, label: t('navigation.deliverers') },
    { path: '/dashboard/users', icon: <LucideUsers className="h-5 w-5" />, label: t('navigation.users') },
    { path: '/dashboard/jobs', icon: <LucideBriefcase className="h-5 w-5" />, label: t('navigation.jobs') },
    { path: '/dashboard/settings', icon: <LucideSettings className="h-5 w-5" />, label: t('navigation.settings') },
  ];
  
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
    window.location.href = '/login';
  };
  
  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="rounded-md bg-primary p-1">
              <LucideTruck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">{t('app.title', { ns: 'common' })}</span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(false)} 
            className="lg:hidden"
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
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                location.pathname === item.path || 
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
          <div className="mb-4 flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/avatars/user.png" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="flex w-full items-center justify-start gap-2"
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
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden"
            >
              <LucideMenu className="h-5 w-5" />
            </Button>
            <Breadcrumbs items={generateBreadcrumbs()} separator={<LucideChevronRight className="h-4 w-4" />} />
          </div>
          
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6">
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
