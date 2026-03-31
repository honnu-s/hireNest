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
  Search,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface LayoutProps { children: ReactNode; }
interface NavItem { label: string; path: string; icon: ReactNode; }

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/signin'); };

  const getNavItems = (): NavItem[] => {
    if (user?.role === 'admin') return [
      { label: 'Overview',    path: '/admin?tab=dashboard',  icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'Jobs',        path: '/admin?tab=jobs',       icon: <Briefcase className="w-4 h-4" /> },
      { label: 'Recruiters',  path: '/admin?tab=recruiters', icon: <Users className="w-4 h-4" /> },
      { label: 'Candidates',  path: '/admin?tab=candidates', icon: <UserCircle className="w-4 h-4" /> },
    ];
    if (user?.role === 'recruiter') return [
      { label: 'Overview',    path: '/recruiter?tab=dashboard',  icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'My Jobs',     path: '/recruiter?tab=jobs',       icon: <Briefcase className="w-4 h-4" /> },
      { label: 'Candidates',  path: '/recruiter?tab=candidates', icon: <UserCircle className="w-4 h-4" /> },
    ];
    return [
      { label: 'Overview',         path: '/candidate?tab=dashboard',  icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: 'Browse Jobs',      path: '/candidate?tab=apply-jobs', icon: <Search className="w-4 h-4" /> },
      { label: 'My Applications',  path: '/candidate?tab=applications', icon: <Briefcase className="w-4 h-4" /> },
    ];
  };

  const isActive = (path: string) => {
    if (path.includes('?tab=')) {
      const [base, q] = path.split('?');
      return location.pathname === base && location.search.includes(q.split('=')[1]);
    }
    return location.pathname === path && !location.search;
  };

  const navItems = getNavItems();
  const handleNav = (path: string) => { navigate(path); setSidebarOpen(false); };

  const roleLabel = user?.role === 'admin' ? 'Administrator' : user?.role === 'recruiter' ? 'Recruiter' : 'Candidate';
  const roleColor = user?.role === 'admin' ? 'bg-blue-500/20 text-blue-300' : user?.role === 'recruiter' ? 'bg-violet-500/20 text-violet-300' : 'bg-blue-500/20 text-blue-300';

  const Sidebar = () => (
<div className="sidebar flex flex-col h-full bg-gradient-to-b from-[#0f172a] to-[#020617]">      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-white text-sm tracking-tight" >
            HireFlow
          </span>
          <p className="text-[10px] text-white/60 -mt-0.5">ATS Platform</p>
        </div>
      </div>

      {/* User Card */}
      <div className="mx-3 mt-4 mb-2 p-3 rounded-xl bg-white/5 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-semibold text-sm flex-shrink-0" >
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${roleColor}`}>
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/20 px-3 pb-2 pt-1">
          Navigation
        </p>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`sidebar-nav-item w-full ${active ? 'active' : ''}`}
            >
              <span className="nav-indicator" />
              <span className={`flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                active ? 'bg-indigo-500/20 text-indigo-400' : 'text-white/30'
              }`}>
                {item.icon}
              </span>
              <span className="flex-1 text-left text-white/60 text-[17px]">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <button
          onClick={toggleTheme}
          className="sidebar-nav-item w-full"
        >
          {theme === 'light'
            ? <><Moon className="w-4 h-4" /><span className="text-[13px]">Dark Mode</span></>
            : <><Sun className="w-4 h-4" /><span className="text-[13px]">Light Mode</span></>
          }
        </button>
        <button
          onClick={handleLogout}
          className="sidebar-nav-item w-full !text-red-400 hover:!bg-red-500/10"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[13px]">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
<div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-border flex items-center justify-between px-4 z-40">        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm" >TalentFlow</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-60 z-50 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <Sidebar />
      </aside>

      {/* Main */}
      <main className="lg:pl-60 pt-14 lg:pt-0">
        <div className="min-h-screen p-5 lg:p-8 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
