import React, { useState, useEffect } from 'react';
import { AuthView } from './views/AuthView';
import { FormView } from './views/FormView';
import { DashboardView } from './views/DashboardView';
import { UserManagementView } from './views/UserManagementView';
import { NotificationsView } from './views/NotificationsView';
import { User } from './types';
import { LogOut, FileText, LayoutDashboard, Users, AlertCircle, Bell } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'form' | 'dashboard' | 'users' | 'notifications'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOpenPeticioId, setPendingOpenPeticioId] = useState<number | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          if (data.user.role === 'Lectura') {
            setCurrentView('dashboard');
          } else {
            setCurrentView('form');
          }
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (currentView === 'form' && user.role === 'Lectura') {
        setToast('No tens permisos per accedir a aquesta secció.');
        setCurrentView('dashboard');
      } else if (currentView === 'users' && user.role !== 'Administrador') {
        setToast('No tens permisos per accedir a aquesta secció.');
        setCurrentView('dashboard');
      } else if (currentView === 'notifications' && user.role === 'Lectura') {
        setToast('No tens permisos per accedir a aquesta secció.');
        setCurrentView('dashboard');
      }
    }
  }, [currentView, user]);

  // Poll unread notifications
  useEffect(() => {
    if (!user || user.role === 'Lectura') return;

    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/notifications/unread-count', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setUnreadCount(0);
  };

  const handleNavigate = (view: 'form' | 'dashboard' | 'users' | 'notifications') => {
    if (view === 'form' && user?.role === 'Lectura') {
      setToast('No tens permisos per accedir a aquesta secció.');
      setCurrentView('dashboard');
      return;
    }
    if (view === 'users' && user?.role !== 'Administrador') {
      setToast('No tens permisos per accedir a aquesta secció.');
      setCurrentView('dashboard');
      return;
    }
    if (view === 'notifications' && user?.role === 'Lectura') {
      setToast('No tens permisos per accedir a aquesta secció.');
      setCurrentView('dashboard');
      return;
    }

    if (view === 'notifications') {
      setUnreadCount(0); // Optimistic update
    }

    setCurrentView(view);
  };

  const handleNavigateToRecord = (recordId: number) => {
    setPendingOpenPeticioId(recordId);
    setCurrentView('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthView onLogin={(user, token) => {
      localStorage.setItem('token', token);
      setUser(user);
      if (user.role === 'Lectura') {
        setCurrentView('dashboard');
      } else {
        setCurrentView('form');
      }
    }} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col relative">
      {toast && (
        <div className="fixed top-20 right-4 z-50 p-4 bg-red-50 text-red-800 border border-red-200 rounded-md shadow-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{toast}</p>
        </div>
      )}
      <nav className="bg-primary text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="font-bold text-xl tracking-tight">UGE - Sol·licitud de nova despesa</span>
              <div className="hidden md:ml-10 md:flex md:space-x-4">
                {user.role !== 'Lectura' && (
                  <button
                    onClick={() => handleNavigate('form')}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${currentView === 'form' ? 'bg-primary-dark text-white' : 'text-primary-light hover:bg-primary-dark hover:text-white'}`}
                  >
                    <FileText size={18} />
                    Nova sol·licitud
                  </button>
                )}
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${currentView === 'dashboard' ? 'bg-primary-dark text-white' : 'text-primary-light hover:bg-primary-dark hover:text-white'}`}
                >
                  <LayoutDashboard size={18} />
                  Control de sol·licituds
                </button>
                {user.role !== 'Lectura' && (
                  <button
                    onClick={() => handleNavigate('notifications')}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${currentView === 'notifications' ? 'bg-primary-dark text-white' : 'text-primary-light hover:bg-primary-dark hover:text-white'}`}
                  >
                    <div className="relative flex items-center gap-2">
                      <Bell size={18} />
                      Notificacions
                      {unreadCount > 0 && (
                        <span style={{background:'#C62828', color:'white', borderRadius:'999px', padding:'1px 6px', fontSize:'11px', marginLeft:'4px'}}>
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                )}
                {user.role === 'Administrador' && (
                  <button
                    onClick={() => handleNavigate('users')}
                    className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${currentView === 'users' ? 'bg-primary-dark text-white' : 'text-primary-light hover:bg-primary-dark hover:text-white'}`}
                  >
                    <Users size={18} />
                    Gestió d'Usuaris
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm text-primary-light font-medium">{user.full_name}</span>
                <span className="text-xs text-primary-light/70">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-primary-light hover:text-white hover:bg-primary-dark transition-colors"
                title="Tancar sessió"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-primary-dark bg-primary flex justify-around p-2">
          {user.role !== 'Lectura' && (
            <button
              onClick={() => handleNavigate('form')}
              className={`flex-1 py-2 text-sm font-medium flex justify-center items-center gap-2 rounded-md ${currentView === 'form' ? 'bg-primary-dark text-white' : 'text-primary-light'}`}
            >
              <FileText size={18} />
              Formulari
            </button>
          )}
          <button
            onClick={() => handleNavigate('dashboard')}
            className={`flex-1 py-2 text-sm font-medium flex justify-center items-center gap-2 rounded-md ${currentView === 'dashboard' ? 'bg-primary-dark text-white' : 'text-primary-light'}`}
          >
            <LayoutDashboard size={18} />
            Control
          </button>
          {user.role !== 'Lectura' && (
            <button
              onClick={() => handleNavigate('notifications')}
              className={`flex-1 py-2 text-sm font-medium flex justify-center items-center gap-2 rounded-md ${currentView === 'notifications' ? 'bg-primary-dark text-white' : 'text-primary-light'}`}
            >
              <div className="relative">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] rounded-full px-1.5 min-w-[16px] text-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="ml-2">Notificacions</span>
            </button>
          )}
          {user.role === 'Administrador' && (
            <button
              onClick={() => handleNavigate('users')}
              className={`flex-1 py-2 text-sm font-medium flex justify-center items-center gap-2 rounded-md ${currentView === 'users' ? 'bg-primary-dark text-white' : 'text-primary-light'}`}
            >
              <Users size={18} />
              Usuaris
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {currentView === 'form' && <FormView user={user} onSuccess={() => handleNavigate('dashboard')} />}
        {currentView === 'dashboard' && (
          <DashboardView 
            user={user} 
            pendingOpenPeticioId={pendingOpenPeticioId} 
            onPendingOpenHandled={() => setPendingOpenPeticioId(null)} 
          />
        )}
        {currentView === 'users' && <UserManagementView />}
        {currentView === 'notifications' && (
          <NotificationsView 
            user={user} 
            onNavigateToRecord={handleNavigateToRecord} 
          />
        )}
      </main>
    </div>
  );
}
