import React, { useState, useEffect } from 'react';
import { OFI, Factura } from '../types';
import { X, Eye, AlertCircle, FileText, Calendar, Hash, Tag, Euro } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OFIInvoiceModalProps {
  ofi: OFI;
  onClose: () => void;
}

export function OFIInvoiceModal({ ofi, onClose }: OFIInvoiceModalProps) {
  const [factures, setFactures] = useState<(Factura & { records?: { nom: string, objecte_contracte: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light bg-bg-light flex justify-between items-center sticky top-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <Eye className="text-accent" />
              Factures de l'expedient {ofi.expedient_ofi}
            </h2>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-1">OFI: {ofi.codi_ofi} | {ofi.centre_servei}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-slate-200 rounded-full transition-colors"
            aria-label="Tancar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
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
