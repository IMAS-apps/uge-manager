import React, { useState, useEffect } from 'react';
import { AuthView } from './views/AuthView';
import { FormView } from './views/FormView';
import { DashboardView } from './views/DashboardView';
import { UserManagementView } from './views/UserManagementView';
import { NotificationsView } from './views/NotificationsView';
import { User } from './types';
import { LogOut, FileText, LayoutDashboard, Users, AlertCircle, Bell } from 'lucide-react';
import { supabase } from './lib/supabase';



export function ImasLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#1E3A5F" />
      <text x="50" y="42" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold" fontFamily="Arial, sans-serif">IMAS</text>
      <line x1="25" y1="52" x2="75" y2="52" stroke="#D4A843" strokeWidth="2" />
      <text x="50" y="70" textAnchor="middle" fill="#D4A843" fontSize="10" fontWeight="500" fontFamily="Arial, sans-serif">UGE</text>
    </svg>
  );
}

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
    // Initial check for session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await handleUserSession(session);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setLoading(false);
      }
    };

    const handleUserSession = async (session: any) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email!,
            full_name: profile.full_name,
            role: profile.role,
          };
          setUser(userData);
          if (userData.role === 'Lectura') {
            setCurrentView('dashboard');
          }
        } else {
          // Fallback logic
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

          const fallbackRole = (count === 0) ? 'Administrador' : 'Lectura';
          const displayName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuari';

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email!,
              full_name: displayName,
              role: fallbackRole,
            })
            .select()
            .single();

          if (!insertError && newProfile) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              full_name: newProfile.full_name,
              role: newProfile.role,
            });
          }
        }
      } catch (err) {
        console.error('Error handling session:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        handleUserSession(session);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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

  // Subscribe to real-time notifications and poll for unread count
  useEffect(() => {
    if (!user || user.role === 'Lectura') return;

    const fetchUnreadCount = async () => {
      try {
        let query = supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false);

        if (user.role === 'Gestió') {
          query = query.or('recipient_user_id.is.null,type.eq.new_request');
        } else if (user.role === 'Peticions') {
          query = query.eq('recipient_user_id', user.id);
        }

        const { count, error } = await query;
        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE
          schema: 'public',
          table: 'notifications'
        },
        () => {
          // Re-fetch count when any notification changes
          fetchUnreadCount();
        }
      )
      .subscribe();

    const interval = setInterval(fetchUnreadCount, 60000); // Poll as fallback every minute

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
    return <AuthView onLogin={(user) => {
      setUser(user);
      if (user.role === 'Lectura') {
        setCurrentView('dashboard');
      } else {
        setCurrentView('dashboard');
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
                    <div className="relative">
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 text-white text-[10px] items-center justify-center font-bold">
                            {unreadCount}
                          </span>
                        </span>
                      )}
                    </div>
                    Notificacions
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
