import React, { useState, useEffect, useRef } from 'react';
import { Record, User, SISTEMES_TRAMITACIO, MOTIVACIO_OPTIONS, RESPONSABLES, ORGANS, PARTIDES_ORGANIQUES } from '../types';
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
    responsable_contracte: record.responsable_contracte || '',
    organ_contractacio: record.organ_contractacio || '',
    justificacio: record.justificacio || '',
    objecte_contracte: record.objecte_contracte || '',
    caracteristiques_tecniques: record.caracteristiques_tecniques || '',
    tipus_contracte: record.tipus_contracte || '',
    tipus_despesa: record.tipus_despesa || '',
    termini_execucio: record.termini_execucio || '',
    codi_cpv: record.codi_cpv || '',
    partida_organica: record.partida_organica || '',
    partida_programa: record.partida_programa || '',
    partida_economica: record.partida_economica || '',
    projecte_despesa_cap_vi: record.projecte_despesa_cap_vi || '',
    base_imposable: record.base_imposable || 0,
    quota_iva: record.quota_iva || 0,
    sistema_tramitacio: record.sistema_tramitacio || '',
    segex: record.segex || '',
    reg_factura: record.reg_factura || '',
    relacio_q: record.relacio_q || '',
    relacio_o: record.relacio_o || '',
    finalitzat: record.finalitzat,
    publicat: record.publicat,
    motivacio_no_contractacio: record.motivacio_no_contractacio || '',
    detalls_addicionals: record.detalls_addicionals || ''
  });

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    const payload = {
      ...formData,
      termini_execucio: formData.termini_execucio ? Number(formData.termini_execucio) : null,
      base_imposable: formData.base_imposable ? Number(formData.base_imposable) : 0,
      quota_iva: formData.quota_iva ? Number(formData.quota_iva) : 0,
    };
    onSave(payload as any);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const files = record.fitxers_pressupost || [];

  const getFileUrl = (path: string) => {
    // If the path is already a full URL (e.g. a SharePoint link loaded manually),
    // return it directly instead of treating it as a Supabase Storage key.
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const { data } = supabase.storage
      .from('peticions_pressupostos')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const totalIva = Number(formData.base_imposable) + Number(formData.quota_iva);


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
                  
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Responsable del contracte</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <select name="responsable_contracte" value={formData.responsable_contracte} onChange={handleChange} form="edit-form" className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm">
                        <option value="">Seleccioni una opció</option>
                        {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.responsable_contracte || '—'}</div>
                    )}
                  </div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Òrgan de contractació</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <select name="organ_contractacio" value={formData.organ_contractacio} onChange={handleChange} form="edit-form" className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm">
                        <option value="">Seleccioni una opció</option>
                        {ORGANS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.organ_contractacio || '—'}</div>
                    )}
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Descripció">
                <div className="grid grid-cols-1 gap-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Justificació de la necessitat</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <textarea name="justificacio" value={formData.justificacio} onChange={handleChange} form="edit-form" rows={3} className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"></textarea>
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.justificacio || '—'}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Objecte del contracte</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <textarea name="objecte_contracte" value={formData.objecte_contracte} onChange={handleChange} form="edit-form" rows={4} className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"></textarea>
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.objecte_contracte || '—'}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Característiques tècniques</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <textarea name="caracteristiques_tecniques" value={formData.caracteristiques_tecniques} onChange={handleChange} form="edit-form" rows={4} className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"></textarea>
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.caracteristiques_tecniques || '—'}</div>
                    )}
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Tipologia">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Tipus de contracte</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <select name="tipus_contracte" value={formData.tipus_contracte} onChange={handleChange} form="edit-form" className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm">
                        <option value="">Selecciona un tipus</option>
                        <option value="Subministrament">Subministrament</option>
                        <option value="Servei">Servei</option>
                        <option value="Obra">Obra</option>
                      </select>
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.tipus_contracte || '—'}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Tipus de despesa</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <select name="tipus_despesa" value={formData.tipus_despesa} onChange={handleChange} form="edit-form" className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm">
                        <option value="">Seleccioni una opció</option>
                        <option value="Puntual">Puntual</option>
                        <option value="Recurrent">Recurrent</option>
                      </select>
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.tipus_despesa || '—'}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Termini d'execució (dies)</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <input type="number" min="1" name="termini_execucio" value={formData.termini_execucio} onChange={handleChange} form="edit-form" className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm" />
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.termini_execucio || '—'}</div>
                    )}
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Codificació Pressupostària">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Codi CPV</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <input type="text" pattern="\d{8}" title="Ha de tenir 8 dígits" name="codi_cpv" value={formData.codi_cpv} onChange={handleChange} form="edit-form" className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm" />
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.codi_cpv || '—'}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Partida Orgànica</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <select name="partida_organica" value={formData.partida_organica} onChange={handleChange} form="edit-form" className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm">
                        <option value="">Seleccioni</option>
                        {PARTIDES_ORGANIQUES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.partida_organica || '—'}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Partida Programa</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <input type="text" pattern="\d{5}" title="Ha de tenir 5 dígits" name="partida_programa" value={formData.partida_programa} onChange={handleChange} form="edit-form" className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm" />
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.partida_programa || '—'}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Partida Econòmica</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <input type="text" pattern="\d{5}" title="Ha de tenir 5 dígits" name="partida_economica" value={formData.partida_economica} onChange={handleChange} form="edit-form" className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm" />
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.partida_economica || '—'}</div>
                    )}
                  </div>
                  
                  {formData.partida_economica && formData.partida_economica.startsWith('6') && (
                    <div className="col-span-1 md:col-span-2 mt-2 p-4 bg-red-50 rounded-lg border border-red-100">
                      <label className="block text-xs font-semibold text-red-800 uppercase tracking-wider mb-1">Projecte de despesa cap. VI</label>
                      {mode === 'edit' && user.role === 'Administrador' ? (
                        <input type="text" name="projecte_despesa_cap_vi" value={formData.projecte_despesa_cap_vi} onChange={handleChange} form="edit-form" className="w-full px-3 py-2 border border-red-200 rounded-md focus:ring-2 focus:ring-red-400 text-sm" placeholder="Introduir projecte..." />
                      ) : (
                        <div className="text-red-900 text-sm font-medium whitespace-pre-wrap">{formData.projecte_despesa_cap_vi || '—'}</div>
                      )}
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Imports">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Base Imposable (sense IVA)</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <div className="relative">
                        <input type="number" step="0.01" min="0" name="base_imposable" value={formData.base_imposable} onChange={handleChange} form="edit-form" className="w-full px-3 py-2 pr-8 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm" />
                        <span className="absolute right-3 top-2 text-text-secondary">€</span>
                      </div>
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formatCurrency(Number(formData.base_imposable))}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Quota d'IVA</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <div className="relative">
                        <input type="number" step="0.01" min="0" name="quota_iva" value={formData.quota_iva} onChange={handleChange} form="edit-form" className="w-full px-3 py-2 pr-8 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm" />
                        <span className="absolute right-3 top-2 text-text-secondary">€</span>
                      </div>
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formatCurrency(Number(formData.quota_iva))}</div>
                    )}
                  </div>
                  
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
                {user.role === 'Administrador' ? (
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Detalls addicionals</label>
                    <textarea
                      name="detalls_addicionals"
                      value={formData.detalls_addicionals}
                      onChange={handleChange}
                      form="edit-form"
                      rows={5}
                      className="w-full px-4 py-3 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm resize-y"
                      placeholder="Escriu les notes i detalls addicionals aquí..."
                    />
                  </div>
                ) : (
                  <Field label="Detalls addicionals" value={record.detalls_addicionals} fullWidth />
                )}
              </SectionCard>
            </div>

            {/* Gestió Interna */}
            <div className="lg:col-span-1">
              <div className="sticky top-0">
                <SectionCard title="Gestió Interna">
                  <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">

                    {/* Sistema de tramitació — only editable for Gestió/Admin */}
                    {mode === 'edit' ? (
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
                    ) : (
                      <Field label="Sistema de tramitació" value={record.sistema_tramitacio} />
                    )}

                    {/* SEGEX — only editable for Gestió/Admin */}
                    {mode === 'edit' ? (
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">SEGEX</label>
                        <input
                          type="text"
                          name="segex"
                          value={formData.segex}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>
                    ) : (
                      <Field label="SEGEX" value={record.segex} />
                    )}

                    {/* The following 6 fields are editable for ALL roles */}
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
            <button
              type="submit"
              form="edit-form"
              className="px-4 py-2 text-sm font-medium text-white bg-accent border border-transparent rounded-md hover:bg-accent-dark transition-colors flex items-center gap-2 shadow-sm"
            >
              <Save size={16} /> Desar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
