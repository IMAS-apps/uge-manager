import React, { useState, useEffect, useRef } from 'react';
import { Record, User, SISTEMES_TRAMITACIO, MOTIVACIO_OPTIONS } from '../types';
import { X, FileText, Download, Save, Info, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EditModalProps {
  record: Record;
  mode: 'view' | 'edit';
  user: User;
  onClose: () => void;
  onSave: (data: Partial<Record>) => void;
  onDeleteRequest?: () => void;
}

const SectionCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-white rounded-xl border border-border-light overflow-hidden mb-6 shadow-sm">
    <div className="bg-primary px-4 py-3">
      <h3 className="text-white font-bold text-sm uppercase tracking-wider">{title}</h3>
    </div>
    <div className="p-5">
      {children}
    </div>
  </div>
);

const Field = ({ label, value, fullWidth = false }: { label: string, value: React.ReactNode, fullWidth?: boolean }) => (
  <div className={fullWidth ? "col-span-1 md:col-span-2" : ""}>
    <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">{label}</span>
    <div className="text-text-primary text-sm whitespace-pre-wrap">{value || '—'}</div>
  </div>
);

export function EditModal({ record, mode, user, onClose, onSave, onDeleteRequest }: EditModalProps) {
  const [formData, setFormData] = useState({
    sistema_tramitacio: record.sistema_tramitacio || '',
    segex: record.segex || '',
    reg_factura: record.reg_factura || '',
    relacio_q: record.relacio_q || '',
    relacio_o: record.relacio_o || '',
    finalitzat: record.finalitzat,
    publicat: record.publicat,
    motivacio_no_contractacio: record.motivacio_no_contractacio || ''
  });

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const files = record.fitxers_pressupost || [];

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage
      .from('peticions_pressupostos')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const totalIva = record.base_imposable + record.quota_iva;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true">
      <div ref={modalRef} className="bg-bg-light rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light bg-white flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <FileText className="text-primary" />
              Sol·licitud #{record.id}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Tancar modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <div className="lg:col-span-2">
              <SectionCard title="Identificació">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Id" value={`#${record.id}`} />
                  <Field label="Hora" value={record.hora} />
                  <Field label="Correu electrònic" value={record.email} />
                  <Field label="Nom" value={record.nom} />
                  <Field label="Responsable del contracte" value={record.responsable_contracte} fullWidth />
                  <Field label="Òrgan de contractació" value={record.organ_contractacio} fullWidth />
                </div>
              </SectionCard>

              <SectionCard title="Descripció">
                <div className="grid grid-cols-1 gap-y-4">
                  <Field label="Justificació de la necessitat" value={record.justificacio} fullWidth />
                  <Field label="Objecte del contracte" value={record.objecte_contracte} fullWidth />
                  <Field label="Característiques tècniques" value={record.caracteristiques_tecniques} fullWidth />
                </div>
              </SectionCard>

              <SectionCard title="Tipologia">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Tipus de contracte" value={record.tipus_contracte} />
                  <Field label="Tipus de despesa" value={record.tipus_despesa} />
                  <Field label="Termini d'execució (dies)" value={record.termini_execucio} />
                </div>
              </SectionCard>

              <SectionCard title="Codificació Pressupostària">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Codi CPV" value={record.codi_cpv} />
                  <Field label="Partida Orgànica" value={record.partida_organica} />
                  <Field label="Partida Programa" value={record.partida_programa} />
                  <Field label="Partida Econòmica" value={record.partida_economica} />
                </div>
              </SectionCard>

              <SectionCard title="Imports">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 items-center">
                  <Field label="Base Imposable (sense IVA)" value={formatCurrency(record.base_imposable)} />
                  <Field label="Quota d'IVA" value={formatCurrency(record.quota_iva)} />
                  <div>
                    <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Total (amb IVA)</span>
                    <div className="text-text-primary text-xl font-bold">{formatCurrency(totalIva)}</div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Documentació">
                {files.length > 0 ? (
                  <ul className="space-y-2">
                    {files.map((file: any, index: number) => (
                      <li key={index}>
                        <a
                          href={getFileUrl(file.path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:text-primary-dark hover:underline text-sm font-medium"
                        >
                          <Download size={16} />
                          {file.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-text-primary text-sm">—</div>
                )}
              </SectionCard>

              <SectionCard title="Notes">
                <Field label="Detalls addicionals" value={record.detalls_addicionals} fullWidth />
              </SectionCard>
            </div>

            {/* Gestió Interna */}
            <div className="lg:col-span-1">
              <div className="sticky top-0">
                <SectionCard title="Gestió Interna">
                  {mode === 'view' ? (
                    <div className="grid grid-cols-1 gap-y-4">
                      <Field label="Sistema de tramitació" value={record.sistema_tramitacio} />
                      <Field label="SEGEX" value={record.segex} />
                      <Field label="Motivació de no contractació" value={record.motivacio_no_contractacio} />
                      <Field label="Reg. Factura" value={record.reg_factura} />
                      <Field label="Relació Q" value={record.relacio_q} />
                      <Field label="Relació O" value={record.relacio_o} />
                      <div>
                        <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Finalitzat</span>
                        <div className="text-sm">
                          {record.finalitzat ? <span className="text-success font-medium flex items-center gap-1"><CheckCircle2 size={16} /> Sí</span> : <span className="text-text-secondary">No</span>}
                        </div>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Publicat</span>
                        <div className="text-sm">
                          {record.publicat ? <span className="text-success font-medium flex items-center gap-1"><CheckCircle2 size={16} /> Sí</span> : <span className="text-text-secondary">No</span>}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Sistema de tramitació</label>
                        <select
                          name="sistema_tramitacio"
                          value={formData.sistema_tramitacio}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"
                        >
                          <option value="">Sense assignar</option>
                          {SISTEMES_TRAMITACIO.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                          SEGEX
                        </label>
                        <input
                          type="text"
                          name="segex"
                          value={formData.segex}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Motivació de no contractació</label>
                        <select
                          name="motivacio_no_contractacio"
                          value={formData.motivacio_no_contractacio}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"
                        >
                          <option value="">Sense motivació</option>
                          {MOTIVACIO_OPTIONS.slice(1).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Reg. Factura</label>
                        <input
                          type="text"
                          name="reg_factura"
                          value={formData.reg_factura}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Relació Q</label>
                        <input
                          type="text"
                          name="relacio_q"
                          value={formData.relacio_q}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Relació O</label>
                        <input
                          type="text"
                          name="relacio_o"
                          value={formData.relacio_o}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>

                      <div className="pt-4 border-t border-border-light space-y-3">
                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 ${formData.finalitzat ? 'bg-success/5 border-success/20' : 'bg-white border-border-light'}`}>
                          <input
                            type="checkbox"
                            name="finalitzat"
                            checked={formData.finalitzat}
                            onChange={handleChange}
                            className="w-5 h-5 text-success rounded border-border-light focus:ring-success"
                          />
                          <span className="text-sm font-medium text-text-primary">Finalitzat</span>
                        </label>

                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 ${formData.publicat ? 'bg-primary/5 border-primary/20' : 'bg-white border-border-light'}`}>
                          <input
                            type="checkbox"
                            name="publicat"
                            checked={formData.publicat}
                            onChange={handleChange}
                            className="w-5 h-5 text-primary rounded border-border-light focus:ring-primary"
                          />
                          <span className="text-sm font-medium text-text-primary">Publicat</span>
                        </label>
                      </div>
                    </form>
                  )}
                </SectionCard>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-light bg-white flex justify-between items-center rounded-b-xl">
          <div>
            {mode === 'edit' && (user.role === 'Gestió' || user.role === 'Administrador') && (
              <button
                type="button"
                onClick={onDeleteRequest}
                className="px-4 py-2 text-sm font-medium text-white bg-danger border border-transparent rounded-md hover:bg-danger/90 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Trash2 size={16} /> Eliminar registre
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-primary bg-white border border-border-light rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel·lar
            </button>
            {mode === 'edit' && (
              <button
                type="submit"
                form="edit-form"
                className="px-4 py-2 text-sm font-medium text-white bg-accent border border-transparent rounded-md hover:bg-accent-dark transition-colors flex items-center gap-2 shadow-sm"
              >
                <Save size={16} /> Desar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
