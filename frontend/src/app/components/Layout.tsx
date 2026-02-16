import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  UserCircle, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon,
  Search 
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const getNavItems = (): NavItem[] => {
    
    if (user?.role === 'admin') {
      return [
        { label: 'Dashboard', path: '/admin?tab=dashboard', icon: <LayoutDashboard className="w-5 h-5 hover:bg-zinc-100" /> },
        { label: 'Jobs', path: '/admin?tab=jobs', icon: <Briefcase className="w-5 h-5 hover:bg-zinc-100" /> },
        { label: 'Recruiters', path: '/admin?tab=recruiters', icon: <Users className="w-5 h-5 hover:bg-zinc-100" /> },
        { label: 'Candidates', path: '/admin?tab=candidates', icon: <UserCircle className="w-5 h-5 hover:bg-zinc-100" /> },
      ];
    } else if (user?.role === 'recruiter') {
      return [
        { label: 'Dashboard', path: '/recruiter?tab=dashboard', icon: <LayoutDashboard className="w-5 h-5 hover:bg-zinc-100" /> },
        { label: 'My Jobs', path: '/recruiter?tab=jobs', icon: <Briefcase className="w-5 h-5 hover:bg-zinc-100" /> },
        { label: 'Candidates', path: '/recruiter?tab=candidates', icon: <UserCircle className="w-5 h-5 hover:bg-zinc-100" /> },
      ];
    } else {
      return [
        { label: 'Dashboard', path: '/candidate?tab=dashboard', icon: <LayoutDashboard className="w-5 h-5 hover:bg-zinc-100" /> },
        { label: 'Apply to Jobs', path: '/candidate?tab=apply-jobs', icon: <Search className="w-5 h-5 hover:bg-zinc-100" /> },
        { label: 'My Applications', path: '/candidate?tab=applications', icon: <Briefcase className="w-5 h-5 hover:bg-zinc-100" /> },
      ];
    }
  };

  const navItems = getNavItems();

  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const isActive = (path: string) => {
    if (path.includes('?tab=')) {
      const [basePath, query] = path.split('?');
      return location.pathname === basePath && location.search.includes(query.split('=')[1]);
    }
    return location.pathname === path && !location.search;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold">ATS</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <span className="font-semibold">ATS System</span>
          </div>

          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
  {navItems.map((item) => {
    const active = isActive(item.path);

    return (
      <button
        key={item.path}
        onClick={() => handleNavigation(item.path)}
        className={`
          relative w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors
          ${active
            ? 'bg-gray-100 text-foreground font-medium'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }
        `}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-primary" />
        )}

        {item.icon}
        <span>{item.label}</span>
      </button>
    );
  })}
</nav>


          <div className="p-3 border-t border-border space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={toggleTheme}
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-4 h-4 mr-2" />
                  Dark Mode
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 mr-2" />
                  Light Mode
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
