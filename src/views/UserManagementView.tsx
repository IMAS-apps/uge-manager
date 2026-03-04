import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function UserManagementView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ user: User, newRole: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error: sbError } = await supabase
        .from('profiles')
        .select('*');

      if (sbError) throw sbError;

      setUsers(data as User[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleRoleChange = (user: User, newRole: string) => {
    if (user.role === newRole) return;
    setConfirmDialog({ user, newRole });
  };

  const confirmRoleChange = async () => {
    if (!confirmDialog) return;
    const { user, newRole } = confirmDialog;

    try {
      const { error: sbError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id);

      if (sbError) throw sbError;

      setToast({ msg: 'Rol actualitzat correctament', type: 'success' });
      fetchUsers();
    } catch (err: any) {
      setToast({ msg: err.message, type: 'error' });
    } finally {
      setConfirmDialog(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Administrador': return 'bg-red-100 text-red-800 border-red-200';
      case 'Gestió': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Peticions': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Lectura': default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative">
      {toast && (
        <div className={`absolute top-4 right-4 z-50 p-4 rounded-md shadow-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{toast.msg}</p>
        </div>
      )}

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmar canvi de rol</h3>
            <p className="text-slate-600 mb-6">
              Estàs segur que vols canviar el rol de <strong>{confirmDialog.user.full_name}</strong> a <strong>{confirmDialog.newRole}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancel·lar
              </button>
              <button
                onClick={confirmRoleChange}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 md:p-6 border-b border-slate-200 bg-white flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users size={24} className="text-blue-600" />
          Gestió d'Usuaris
        </h1>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 p-8 bg-white rounded-lg shadow-sm border border-red-100">
            <AlertCircle className="mx-auto mb-2" size={32} />
            <p>{error}</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nom</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Correu electrònic</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rol actual</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Canviar rol</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{u.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                        >
                          <option value="Lectura">Lectura</option>
                          <option value="Peticions">Peticions</option>
                          <option value="Gestió">Gestió</option>
                          <option value="Administrador">Administrador</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
