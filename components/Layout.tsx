
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS } from '../constants';
import { api } from '../services/api';
import { Notification } from '../types';
import { Home, Briefcase, FileText, Users, User as UserIcon, LogOut, ShieldCheck, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user?.email) {
      api.getNotifications(user.email).then(res => {
        if (res.status === 'success') {
          const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
          const active = res.data.filter((n: any) => !dismissed.includes(n.id));
          setNotifications(active);
        }
      });
    }
  }, [user]);

  const dismissNotification = (id: string) => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
    dismissed.push(id);
    localStorage.setItem('dismissedNotifications', JSON.stringify(dismissed));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const NavIcon = (name: string) => {
    switch (name) {
      case 'Home': return <Home size={20} />;
      case 'Portfolio': return <Briefcase size={20} />;
      case 'Proofs': return <FileText size={20} />;
      case 'Group': return <Users size={20} />;
      case 'User': return <UserIcon size={20} />;
      default: return <Home size={20} />;
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col font-body text-cream pb-20">
      {/* Notification Banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] flex flex-col items-center pointer-events-none print:hidden">
        {notifications.map(n => (
          <div key={n.id} className="w-full pointer-events-auto bg-gold-500 text-navy-900 px-4 py-2 text-center text-sm font-semibold relative shadow-md animate-in slide-in-from-top border-b border-navy-900/10">
            {n.message}
            <button 
              onClick={() => dismissNotification(n.id)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-navy-900/10 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-navy-800 border-b border-gold-600/30 shadow-luxury px-6 py-4 sticky top-0 z-50 mt-0 print:hidden">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="https://res.cloudinary.com/dgz5jcnzj/image/upload/v1763801552/logo_ikfhjx.png" alt="Logo" className="h-10 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-gold-500 tracking-wider">
                ELEVATE
              </h1>
              <p className="text-subtext text-xs md:text-sm tracking-widest">CAPITAL COLLECTIVE</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 bg-gold-600 rounded-full flex items-center justify-center text-navy-900 font-bold text-lg shadow-gold-glow hover:shadow-gold-glow-hover transition-all"
            >
              {user?.email?.[0].toUpperCase()}
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-navy-800 border border-gold-600/30 rounded-lg shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-gold-600/10">
                  <p className="text-sm text-gold-400 font-semibold truncate">{user?.email}</p>
                  <p className="text-xs text-subtext mt-1">Member</p>
                </div>
                {user?.isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center px-4 py-2 text-sm text-cream hover:bg-gold-600/10 hover:text-gold-400 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShieldCheck size={16} className="mr-2" /> Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                >
                  <LogOut size={16} className="mr-2" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-navy-800 border-t border-gold-600/30 py-3 px-6 shadow-luxury z-40 print:hidden">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center text-xs font-medium transition-all duration-300 ${
                  isActive ? 'text-gold-400 scale-110' : 'text-subtext hover:text-gold-200'
                }`}
              >
                <div className={`mb-1 ${isActive ? 'drop-shadow-[0_0_8px_rgba(227,183,89,0.5)]' : ''}`}>
                    {NavIcon(item.label)}
                </div>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};