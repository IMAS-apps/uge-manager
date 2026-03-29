import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { FilePlus, PenSquare, CheckCircle2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NotificationsViewProps {
  user: User;
  onNavigateToRecord: (recordId: number) => void;
  onProfileUpdate: () => void;
}

interface Notification {
  id: number;
  created_at: string;
  type: 'new_request' | 'record_updated' | 'new_contract';
  recipient_user_id: string | null;
  triggered_by_user_id: string;
  triggered_by_name: string;
  peticio_id: number;
  peticio_objecte: string;
  changed_fields: string[];
  is_read: boolean;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ user, onNavigateToRecord, onProfileUpdate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (user.role === 'Administrador') {
        query = query.neq('triggered_by_user_id', user.id);
      } else if (user.role === 'Gestió') {
        query = query.or(`recipient_user_id.eq.${user.id},type.eq.new_request,type.eq.new_contract`);
      } else if (user.role === 'Peticions') {
        query = query.or(`recipient_user_id.eq.${user.id},type.eq.new_contract`);
      } else if (user.role === 'Lectura') {
        query = query.eq('type', 'new_contract');
      }

      if (user.last_notifications_cleared_at) {
        query = query.gt('created_at', user.last_notifications_cleared_at);
      }
      // Admin continues to see everything (no filter)

      const { data, error: sbError } = await query;

      if (sbError) throw sbError;

      setNotifications(data as unknown as Notification[]);

      // Mark all as read
      const unreadIds = data.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (ids: number[]) => {
    try {
      const { error: sbError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', ids);

      if (sbError) throw sbError;

      // Update local state to reflect read status
      setNotifications(prev => prev.map(n =>
        ids.includes(n.id) ? { ...n, is_read: true } : n
      ));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    try {
      const { error: sbError } = await supabase
        .from('profiles')
        .update({ last_notifications_cleared_at: new Date().toISOString() })
        .eq('id', user.id);

      if (sbError) throw sbError;
      
      setNotifications([]);
      onProfileUpdate();
    } catch (err) {
      console.error('Error netejant notificacions:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ca-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubtitle = () => {
    switch (user.role) {
      case 'Peticions':
        return "Canvis realitzats als teus registres per part de gestió";
      case 'Gestió':
        return "Noves sol·licituds enviades per qualsevol usuari";
      case 'Administrador':
        return "Totes les notificacions del sistema";
      case 'Lectura':
        return "Notificacions de nous contractes";
      default:
        return "Avisos i actualitzacions del sistema";
    }
  };

  const hasNotifications = notifications.length > 0;

  if (loading) return <div className="p-8 text-center text-text-secondary">Carregant notificacions...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Notificacions</h1>
          <p className="text-text-secondary">{getSubtitle()}</p>
        </div>
        <button
          onClick={handleClearAll}
          disabled={!hasNotifications}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${!hasNotifications
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-white border border-border-light text-red-600 hover:bg-red-50 shadow-sm'
            }`}
        >
          <div className="flex items-center gap-2">
            <Trash2 size={16} />
            Netejar totes les notificacions
          </div>
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-border-light shadow-sm">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-slate-300" />
            </div>
            <p className="text-text-secondary">No tens notificacions per mostrar.</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`relative p-5 rounded-lg border transition-all ${notification.is_read
                ? 'bg-[#F4F8FC] border-transparent'
                : 'bg-white border-border-light shadow-sm'
                }`}
            >
              {!notification.is_read && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-l-lg"></div>
              )}

              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  {notification.type === 'new_request' ? (
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                      <FilePlus size={20} className="text-[#0072BC]" />
                    </div>
                  ) : notification.type === 'record_updated' ? (
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                      <PenSquare size={20} className="text-[#F0A500]" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-green-600" />
                    </div>
                  )}
                </div>

                <div className="flex-grow">
                  <h3 className="font-semibold text-text-primary mb-1">
                    {notification.type === 'new_request' ? 'Nova sol·licitud enviada' : 
                     notification.type === 'record_updated' ? 'Registre actualitzat' : 
                     'Nou contracte formalitzat'}
                  </h3>

                  <p className="text-text-secondary text-sm mb-2">
                    {notification.type === 'new_contract' ? (
                      notification.peticio_objecte
                    ) : (
                      <>
                        En <span className="font-medium text-text-primary">{notification.triggered_by_name}</span> {notification.type === 'new_request' ? 'ha enviat una nova sol·licitud:' : 'ha modificat la teva sol·licitud:'} <span className="font-medium text-text-primary">"{notification.peticio_objecte}"</span>
                      </>
                    )}
                  </p>

                  {notification.type === 'record_updated' && notification.changed_fields && notification.changed_fields.length > 0 && (
                    <div className="mb-3 pt-2 border-t border-border-light/50">
                      <p className="text-xs text-text-secondary">
                        Camps modificats: {notification.changed_fields.join(', ')}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light/50">
                    <span className="text-xs text-text-muted">
                      {formatDate(notification.created_at)}
                    </span>

                    {notification.type !== 'new_contract' && (
                      <button
                        onClick={() => onNavigateToRecord(notification.peticio_id)}
                        className="text-xs font-medium text-primary hover:text-primary-dark hover:underline flex items-center gap-1"
                      >
                        Veure registre →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
