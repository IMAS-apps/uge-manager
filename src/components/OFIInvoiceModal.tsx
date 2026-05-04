import React, { useState, useEffect } from 'react';
import { OFI, Factura, User } from '../types';
import { X, Eye, AlertCircle, FileText, Calendar, Hash, Tag, Euro, Pencil, Trash2, Save, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OFIInvoiceModalProps {
  ofi: OFI;
  user: User;
  onClose: () => void;
  onRefresh: () => void;
}

export function OFIInvoiceModal({ ofi, user, onClose, onRefresh }: OFIInvoiceModalProps) {
  const [factures, setFactures] = useState<(Factura & { records?: { nom: string, objecte_contracte: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editData, setEditData] = useState({
    codi_ofi: ofi.codi_ofi,
    centre_servei: ofi.centre_servei,
    expedient_ofi: ofi.expedient_ofi,
    justificacio_general: ofi.justificacio_general
  });

  const canEdit = user.role === 'Administrador' || user.role === 'Gestió';

  useEffect(() => {
    const fetchFactures = async () => {
      setLoading(true);
      try {
        const { data, error: sbError } = await supabase
          .from('factures')
          .select('*, records(nom, objecte_contracte)')
          .eq('expedient', ofi.expedient_ofi)
          .order('data', { ascending: false });

        if (sbError) throw sbError;
        setFactures(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFactures();
  }, [ofi.expedient_ofi]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ca-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    setError('');
    try {
      const { error: sbError } = await (supabase as any)
        .from('ofi')
        .update({
          codi_ofi: editData.codi_ofi,
          centre_servei: editData.centre_servei,
          expedient_ofi: editData.expedient_ofi,
          justificacio_general: editData.justificacio_general,
          updated_at: new Date().toISOString()
        })
        .eq('id', ofi.id);

      if (sbError) throw sbError;
      
      setSuccess('OFI actualitzat correctament.');
      setIsEditing(false);
      onRefresh();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Estàs segur que vols eliminar aquest OFI? Aquesta acció no es pot desfer.')) return;
    
    setDeleting(true);
    setError('');
    try {
      const { error: sbError } = await (supabase as any)
        .from('ofi')
        .delete()
        .eq('id', ofi.id);

      if (sbError) throw sbError;
      
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light bg-bg-light flex justify-between items-center sticky top-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <Eye className="text-accent" />
              Detalls de l'OFI
            </h2>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-1">Expedient: {ofi.expedient_ofi} | Codi: {ofi.codi_ofi}</p>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border-light text-primary hover:bg-slate-50 rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                <Pencil size={14} /> Editar OFI
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-slate-200 rounded-full transition-colors"
              aria-label="Tancar"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* General OFI Info Section */}
          <div className="mb-8 bg-white rounded-xl border border-border-light overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-2 border-b border-border-light flex justify-between items-center">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Informació General de l'OFI</h3>
              {isEditing && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleting || saving}
                    className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-[10px] font-bold transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={12} /> {deleting ? 'Suprimint...' : 'Suprimir OFI'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Codi OFI</label>
                      <input
                        type="text"
                        name="codi_ofi"
                        value={editData.codi_ofi}
                        onChange={handleChange}
                        className="w-full text-sm px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Centre o servei</label>
                      <input
                        type="text"
                        name="centre_servei"
                        value={editData.centre_servei}
                        onChange={handleChange}
                        className="w-full text-sm px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Expedient OFI</label>
                      <input
                        type="text"
                        name="expedient_ofi"
                        value={editData.expedient_ofi}
                        onChange={handleChange}
                        className="w-full text-sm px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Justificació general</label>
                    <textarea
                      name="justificacio_general"
                      value={editData.justificacio_general}
                      onChange={handleChange}
                      rows={3}
                      className="w-full text-sm px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary outline-none resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditData({
                          codi_ofi: ofi.codi_ofi,
                          centre_servei: ofi.centre_servei,
                          expedient_ofi: ofi.expedient_ofi,
                          justificacio_general: ofi.justificacio_general
                        });
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-text-secondary hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <RotateCcw size={16} /> Cancel·lar
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-6 py-2 bg-accent text-white font-bold rounded-lg text-sm hover:bg-accent-dark transition-all shadow-md disabled:opacity-70"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      {saving ? 'Desant...' : 'Desar Canvis'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-8 grid grid-cols-2 gap-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Codi OFI</p>
                      <p className="text-sm font-bold text-primary">{ofi.codi_ofi}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Centre o servei</p>
                      <p className="text-sm font-medium text-text-primary">{ofi.centre_servei}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Justificació</p>
                      <p className="text-sm text-text-secondary italic line-clamp-2" title={ofi.justificacio_general}>
                        {ofi.justificacio_general || 'Sense justificació.'}
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-4 bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-center items-center gap-1">
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Expedient SEGEX</p>
                    <p className="text-lg font-bold text-accent">{ofi.expedient_ofi}</p>
                    <span className="text-[10px] text-text-secondary">Creat el {new Date(ofi.created_at).toLocaleDateString('ca-ES')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} /> {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText size={14} /> Factures de l'expedient
          </h3>
          {loading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-sm text-text-secondary animate-pulse">Cercant factures associades...</p>
            </div>
          ) : error ? (
            <div className="text-center text-danger p-12 bg-red-50 rounded-lg border border-red-100">
              <AlertCircle className="mx-auto mb-2 text-danger" size={32} />
              <p className="font-bold">S'ha produït un error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : factures.length === 0 ? (
            <div className="text-center text-text-secondary p-16 bg-bg-light rounded-xl border border-dashed border-border-light flex flex-col items-center">
              <FileText size={48} className="text-slate-300 mb-4" />
              <p className="text-lg font-semibold text-text-primary">Cap factura trobada</p>
              <p className="text-sm mt-1 max-w-sm">
                No s'han trobat factures registrades al mòdul de Sol·licituds amb l'expedient <span className="font-bold">{ofi.expedient_ofi}</span>.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-primary-light p-4 rounded-lg border border-primary/10">
                <span className="text-primary font-medium text-sm">Total factures trobades: <span className="font-bold">{factures.length}</span></span>
                <span className="text-primary-dark font-bold">
                  Import total: {formatCurrency(factures.reduce((acc, f) => acc + (f.import_total || 0), 0))}
                </span>
              </div>

              <div className="overflow-x-auto border border-border-light rounded-lg">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-bg-light">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider"><div className="flex items-center gap-1"><Calendar size={14}/> Data</div></th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider"><div className="flex items-center gap-1"><Hash size={14}/> Núm. Reg</div></th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider"><div className="flex items-center gap-1"><Tag size={14}/> Descripció / Sol·licitud</div></th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-text-secondary uppercase tracking-wider"><div className="flex items-center justify-end gap-1"><Euro size={14}/> Import</div></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {factures.map((factura) => (
                      <tr key={factura.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary font-medium">
                          {formatDate(factura.data)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-text-secondary font-mono">
                          {factura.numero_registre}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex flex-col">
                            <span className="text-text-primary font-medium">{factura.descripcio || 'Sense descripció'}</span>
                            {factura.records && (
                              <span className="text-[10px] text-text-secondary uppercase tracking-tight mt-1 line-clamp-1">
                                Sol·licitud: {factura.records.objecte_contracte} ({factura.records.nom})
                              </span>
                            )}
                            <span className="text-xs text-slate-400 mt-0.5">Factura: {factura.numero_factura} | Període: {factura.periode}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-bold text-text-primary">
                          {formatCurrency(factura.import_total || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-light bg-bg-light flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-border-light text-text-primary font-bold rounded-lg transition-colors hover:bg-slate-50"
          >
            Tancar
          </button>
        </div>
      </div>
    </div>
  );
}
