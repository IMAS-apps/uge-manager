import React, { useState, useEffect, useRef } from 'react';
import { Record, User, SISTEMES_TRAMITACIO, MOTIVACIO_OPTIONS, JUSTIFICACIO_PREU_OPTIONS, RESPONSABLES, ORGANS, PARTIDES_ORGANIQUES, CENTRES_SERVEI, Factura } from '../types';
import { X, FileText, Download, Save, Info, Trash2, CheckCircle2, Wand2, UploadCloud, Plus, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CpvDescription } from './CpvDescription';

interface EditModalProps {
  record: Record;
  mode: 'view' | 'edit';
  user: User;
  onClose: () => void;
  onSave: (data: Partial<Record>) => void | Promise<void>;
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
    centre_servei: record.centre_servei || '',
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
    num_rc: record.num_rc || '',
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
    explicacio_no_contractacio: record.explicacio_no_contractacio || '',
    justificacio_preu: record.justificacio_preu || '',
    explicacio_preu: record.explicacio_preu || '',
    data_ofi_inicial: record.data_ofi_inicial || '',
    adjudicatari: record.adjudicatari || '',
    nif: record.nif || '',
    detalls_addicionals: record.detalls_addicionals || ''
  });

  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [localFiles, setLocalFiles] = useState<{ name: string; path: string; size: number }[]>(
    (record.fitxers_pressupost as { name: string; path: string; size: number }[]) || []
  );
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [factures, setFactures] = useState<Factura[]>([]);
  const [isFacturesLoading, setIsFacturesLoading] = useState(false);
  const [showAddFactura, setShowAddFactura] = useState(false);
  
  const [editingFacturaId, setEditingFacturaId] = useState<number | null>(null);
  const [editFactura, setEditFactura] = useState<Partial<Factura> & { import_total_str?: string }>({});

  const [newFactura, setNewFactura] = useState<Partial<Factura> & { import_total_str?: string }>({
    data: '',
    expedient: '',
    numero_registre: '',
    descripcio: '',
    periode: '',
    numero_factura: '',
    import_total_str: ''
  });

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (record.id) {
      const loadFactures = async () => {
        setIsFacturesLoading(true);
        try {
          const { data, error } = await supabase
            .from('factures')
            .select('*')
            .eq('record_id', record.id)
            .order('created_at', { ascending: false });
          if (error) throw error;
          setFactures(data || []);
        } catch (err) {
          console.error('Error loading factures', err);
        } finally {
          setIsFacturesLoading(false);
        }
      };
      loadFactures();
    }
  }, [record.id]);

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

  const handleAIAssist = async (field: 'justificacio' | 'objecte_contracte' | 'caracteristiques_tecniques') => {
    if (mode !== 'edit' || user.role !== 'Administrador') return;
    if (!formData[field].trim()) return;
    
    setAiLoading(field);
    try {
      const { processTextWithAI } = await import('../lib/ai');
      const result = await processTextWithAI(formData[field]);
      setFormData(prev => ({ ...prev, [field]: result }));
    } catch (err: any) {
      alert(err.message || 'Error en processar el text amb IA');
    } finally {
      setAiLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setUploadError('');
    try {
      let updatedFiles = [...localFiles];
      if (pendingFiles.length > 0) {
        const timestamp = Date.now();
        for (const file of pendingFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${record.created_by}/${fileName}`;
          const { error: uploadErr, data } = await supabase.storage
            .from('peticions_pressupostos')
            .upload(filePath, file);
          if (uploadErr) throw uploadErr;
          updatedFiles.push({ name: file.name, path: data.path, size: file.size });
        }
      }
      const payload = {
        ...formData,
        termini_execucio: formData.termini_execucio ? parseInt(String(formData.termini_execucio)) : null,
        base_imposable: formData.base_imposable ? parseFloat(String(formData.base_imposable)) : 0,
        quota_iva: formData.quota_iva ? parseFloat(String(formData.quota_iva)) : 0,
        num_rc: formData.num_rc || null,
        data_ofi_inicial: formData.data_ofi_inicial || null,
        fitxers_pressupost: updatedFiles,
      };
      await onSave(payload as any);
      // We don't setIsSaving(false) here because on success the modal is closed by the parent.
      // But if onSave caught an error and returned, we should allow retrying.
      setIsSaving(false);
    } catch (err: any) {
      setUploadError(err.message || "Error en pujar els fitxers.");
      setIsSaving(false);
    }
  };

  const handleRemoveExistingFile = (index: number) => {
    setLocalFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files) as File[];
    const valid = selected.filter(f => f.type === 'application/pdf');
    if (valid.length !== selected.length) setUploadError("Només s'accepten fitxers PDF.");
    setPendingFiles(prev => {
      const combined = [...prev, ...valid];
      const total = localFiles.length + combined.length;
      if (total > 3) {
        setUploadError('El màxim és 3 fitxers en total.');
        return combined.slice(0, Math.max(0, 3 - localFiles.length));
      }
      return combined;
    });
    e.target.value = '';
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddFactura = async () => {
    try {
      const payload = {
        record_id: record.id,
        data: newFactura.data,
        expedient: newFactura.expedient,
        numero_registre: newFactura.numero_registre,
        descripcio: newFactura.descripcio,
        periode: newFactura.periode,
        numero_factura: newFactura.numero_factura,
        import_total: newFactura.import_total_str ? Number(newFactura.import_total_str.replace(',', '.').replace('/', '.')) : 0
      };
      
      const { data, error } = await supabase
        .from('factures')
        .insert([payload])
        .select();
        
      if (error) throw error;
      if (data) {
        setFactures([data[0], ...factures]);
        setNewFactura({
          data: '',
          expedient: '',
          numero_registre: '',
          descripcio: '',
          periode: '',
          numero_factura: '',
          import_total_str: ''
        });
        setShowAddFactura(false);
      }
    } catch (err: any) {
      alert(err.message || 'Error en afegir la factura');
    }
  };

  const handleUpdateFactura = async () => {
    if (!editingFacturaId) return;
    try {
      const payload = {
        data: editFactura.data,
        expedient: editFactura.expedient,
        numero_registre: editFactura.numero_registre,
        descripcio: editFactura.descripcio,
        periode: editFactura.periode,
        numero_factura: editFactura.numero_factura,
        import_total: editFactura.import_total_str ? Number(editFactura.import_total_str.replace(',', '.').replace('/', '.')) : 0
      };
      
      const { data, error } = await supabase
        .from('factures')
        .update(payload)
        .eq('id', editingFacturaId)
        .select();
        
      if (error) throw error;
      if (data) {
        setFactures(factures.map(f => f.id === editingFacturaId ? data[0] : f));
        setEditingFacturaId(null);
        setEditFactura({});
      }
    } catch (err: any) {
      alert(err.message || 'Error en actualitzar la factura');
    }
  };

  const handleDeleteFactura = async (id: number) => {
    if (!confirm('Segur que vols eliminar aquesta factura?')) return;
    try {
      const { error } = await supabase
        .from('factures')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setFactures(factures.filter(f => f.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error en eliminar la factura');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };



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
  const creditReconegut = factures.reduce((acc, f) => acc + Number(f.import_total), 0);
  const creditDisponible = totalIva - creditReconegut;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true">
      <div ref={modalRef} className="bg-bg-light rounded-xl shadow-2xl w-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden">

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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            <div className={formData.sistema_tramitacio === 'OFI' ? "lg:col-span-5" : "lg:col-span-7"}>
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
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Centre/Servei</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <select name="centre_servei" value={formData.centre_servei} onChange={handleChange} form="edit-form" className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm">
                        <option value="">Seleccioni una opció</option>
                        {CENTRES_SERVEI.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.centre_servei || '—'}</div>
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">Justificació de la necessitat</label>
                      {mode === 'edit' && user.role === 'Administrador' && formData.justificacio.trim() && (
                        <button
                          type="button"
                          onClick={() => handleAIAssist('justificacio')}
                          disabled={aiLoading !== null}
                          className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                          title="Millorar i traduir text amb IA"
                        >
                          {aiLoading === 'justificacio' ? (
                            <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Wand2 size={12} />
                          )}
                          <span>Millorar text</span>
                        </button>
                      )}
                    </div>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <textarea name="justificacio" value={formData.justificacio} onChange={handleChange} form="edit-form" rows={3} className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"></textarea>
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.justificacio || '—'}</div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">Objecte del contracte</label>
                      {mode === 'edit' && user.role === 'Administrador' && formData.objecte_contracte.trim() && (
                        <button
                          type="button"
                          onClick={() => handleAIAssist('objecte_contracte')}
                          disabled={aiLoading !== null}
                          className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                          title="Millorar i traduir text amb IA"
                        >
                          {aiLoading === 'objecte_contracte' ? (
                            <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Wand2 size={12} />
                          )}
                          <span>Millorar text</span>
                        </button>
                      )}
                    </div>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <textarea name="objecte_contracte" value={formData.objecte_contracte} onChange={handleChange} form="edit-form" rows={4} className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"></textarea>
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.objecte_contracte || '—'}</div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">Característiques tècniques (Opcional)</label>
                      {mode === 'edit' && user.role === 'Administrador' && formData.caracteristiques_tecniques.trim() && (
                        <button
                          type="button"
                          onClick={() => handleAIAssist('caracteristiques_tecniques')}
                          disabled={aiLoading !== null}
                          className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                          title="Millorar i traduir text amb IA"
                        >
                          {aiLoading === 'caracteristiques_tecniques' ? (
                            <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Wand2 size={12} />
                          )}
                          <span>Millorar text</span>
                        </button>
                      )}
                    </div>
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
                      <>
                        <input type="text" pattern="\d{8}" title="Ha de tenir 8 dígits" name="codi_cpv" value={formData.codi_cpv} onChange={handleChange} form="edit-form" placeholder="12340000" className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm" />
                        <CpvDescription code={formData.codi_cpv} />
                        {formData.codi_cpv.length === 8 && !formData.codi_cpv.endsWith('0000') && (
                          <p className="text-red-600 text-xs mt-1 font-medium">
                            S'ha d'introduir un CPV amb nivell de 4 dígits (XXXX0000)
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.codi_cpv || '—'}</div>
                        <CpvDescription code={formData.codi_cpv} />
                      </>
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
                      <input type="text" pattern="\d{5}" title="Ha de tenir 5 dígits" name="partida_programa" value={formData.partida_programa} onChange={handleChange} form="edit-form" placeholder="21300" className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm" />
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.partida_programa || '—'}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Partida Econòmica</label>
                    {mode === 'edit' && user.role === 'Administrador' ? (
                      <input type="text" pattern="\d{5}" title="Ha de tenir 5 dígits" name="partida_economica" value={formData.partida_economica} onChange={handleChange} form="edit-form" placeholder="22199" className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm" />
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.partida_economica || '—'}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Nº operació RC</label>
                    {mode === 'edit' ? (
                      <input type="text" inputMode="numeric" pattern="[0-9]*" name="num_rc" value={formData.num_rc || ''} onChange={handleChange} form="edit-form" className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm" placeholder="ex: 220260015212" />
                    ) : (
                      <div className="text-text-primary text-sm whitespace-pre-wrap">{formData.num_rc ? formData.num_rc.toString() : '—'}</div>
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
                {mode === 'edit' && user.role === 'Administrador' ? (
                  <div className="space-y-3">
                    {uploadError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs font-medium">
                        {uploadError}
                      </div>
                    )}

                    {localFiles.length > 0 && (
                      <ul className="space-y-2">
                        {localFiles.map((file: any, index: number) => (
                          <li key={index} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-md gap-2">
                            <a
                              href={getFileUrl(file.path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-primary hover:text-primary-dark hover:underline text-sm font-medium truncate min-w-0"
                            >
                              <Download size={14} className="flex-shrink-0" />
                              <span className="truncate">{file.name}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingFile(index)}
                              className="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                              title="Eliminar fitxer"
                            >
                              <X size={15} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {pendingFiles.length > 0 && (
                      <ul className="space-y-2">
                        {pendingFiles.map((file, index) => (
                          <li key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-md gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="flex-shrink-0 bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-bold">PDF</span>
                              <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                              <span className="flex-shrink-0 text-xs text-slate-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePendingFile(index)}
                              className="flex-shrink-0 p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                            >
                              <X size={15} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {(localFiles.length + pendingFiles.length) < 3 && (
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex flex-col items-center justify-center py-3">
                          <UploadCloud className="w-6 h-6 mb-1 text-slate-400" />
                          <p className="text-xs text-slate-500 text-center">
                            <span className="font-semibold">Afegir fitxer PDF</span><br />
                            (màx. 3 fitxers en total)
                          </p>
                        </div>
                        <input type="file" className="hidden" accept="application/pdf" onChange={handleNewFileChange} />
                      </label>
                    )}

                    {localFiles.length === 0 && pendingFiles.length === 0 && (
                      <p className="text-sm text-slate-400 italic">Cap fitxer adjuntat.</p>
                    )}
                  </div>
                ) : (
                  localFiles.length > 0 ? (
                    <ul className="space-y-2">
                      {localFiles.map((file: any, index: number) => (
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
                  )
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
            <div className="lg:col-span-2">
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

                    {/* The following fields are editable for ALL roles */}

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Adjudicatari</label>
                      <input
                        type="text"
                        name="adjudicatari"
                        value={formData.adjudicatari}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">NIF</label>
                      <input
                        type="text"
                        name="nif"
                        value={formData.nif}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>

                    {/* Camps Reg. Factura, Relació Q, Relació O ocultats a la UI, es mantenen a la base de dades */}

                    {(formData.sistema_tramitacio === 'AD' || formData.sistema_tramitacio === 'ADO') && (
                      <div className="pt-4 border-t border-border-light space-y-3">
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
                        
                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 ${formData.adjudicat ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white border-border-light'}`}>
                          <input
                            type="checkbox"
                            name="adjudicat"
                            checked={formData.adjudicat || false}
                            onChange={handleChange}
                            className="w-5 h-5 text-amber-500 rounded border-border-light focus:ring-amber-500"
                          />
                          <span className="text-sm font-medium text-text-primary">Adjudicat</span>
                        </label>

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
                      </div>
                    )}
                  </form>
                </SectionCard>
              </div>
            </div>

            {/* Detalls OFI — visible only when sistema_tramitacio === 'OFI' */}
            {(formData.sistema_tramitacio === 'OFI' || record.sistema_tramitacio === 'OFI') && (
              <div className="lg:col-span-2">
                <div className="sticky top-0">
                  <SectionCard title="Detalls OFI">
                    <div className="space-y-4">

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
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Explicació de no contractació</label>
                        <textarea
                          name="explicacio_no_contractacio"
                          value={formData.explicacio_no_contractacio}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"
                          placeholder="Detalli la motivació..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Justificació del preu</label>
                        <select
                          name="justificacio_preu"
                          value={formData.justificacio_preu}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"
                        >
                          <option value="">Sense justificació</option>
                          {JUSTIFICACIO_PREU_OPTIONS.slice(1).map(opt => (
                            <option key={opt.charAt(0)} value={opt}>{opt}</option>
                          ))}
                        </select>
                        {formData.justificacio_preu && (
                          <p className="mt-2 text-xs text-text-secondary whitespace-pre-wrap leading-relaxed bg-slate-50 border border-border-light rounded p-2">
                            {formData.justificacio_preu}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Explicació del preu</label>
                        <textarea
                          name="explicacio_preu"
                          value={formData.explicacio_preu}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"
                          placeholder="Detalli la justificació del preu..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Tramitat per OFI des de</label>
                        <input
                          type="date"
                          name="data_ofi_inicial"
                          value={formData.data_ofi_inicial || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>

                    </div>
                  </SectionCard>
                </div>
              </div>
            )}

            {/* Factures */}
            <div className="lg:col-span-3">
              <div className="sticky top-0">
                <SectionCard title="Factures">
                  <div className="space-y-4">
                    {isFacturesLoading ? (
                      <div className="text-sm text-text-secondary">Carregant factures...</div>
                    ) : (
                      <>
                        {factures.length > 0 ? (
                          <div className="space-y-3">
                            {factures.map((factura) => (
                              <div key={factura.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md relative group">
                                {editingFacturaId === factura.id ? (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs text-text-secondary mb-1">Data</label>
                                        <input type="date" value={editFactura.data} onChange={e => setEditFactura({...editFactura, data: e.target.value})} className="w-full px-2 py-1.5 border border-border-light rounded text-sm" />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-text-secondary mb-1">Expedient</label>
                                        <input type="text" value={editFactura.expedient || ''} onChange={e => setEditFactura({...editFactura, expedient: e.target.value})} className="w-full px-2 py-1.5 border border-border-light rounded text-sm" />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs text-text-secondary mb-1">Núm Registre</label>
                                        <input type="text" value={editFactura.numero_registre} onChange={e => setEditFactura({...editFactura, numero_registre: e.target.value})} className="w-full px-2 py-1.5 border border-border-light rounded text-sm" placeholder="ex: F/any/num" />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-text-secondary mb-1">Núm Factura</label>
                                        <input type="text" value={editFactura.numero_factura} onChange={e => setEditFactura({...editFactura, numero_factura: e.target.value})} className="w-full px-2 py-1.5 border border-border-light rounded text-sm" />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs text-text-secondary mb-1">Període</label>
                                      <input type="text" value={editFactura.periode} onChange={e => setEditFactura({...editFactura, periode: e.target.value})} className="w-full px-2 py-1.5 border border-border-light rounded text-sm" placeholder="ex: Gener 2024" />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-text-secondary mb-1">Descripció</label>
                                      <textarea value={editFactura.descripcio} onChange={e => setEditFactura({...editFactura, descripcio: e.target.value})} className="w-full px-2 py-1.5 border border-border-light rounded text-sm" rows={2} />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-text-secondary mb-1">Import total</label>
                                      <input type="text" value={editFactura.import_total_str || ''} onChange={e => setEditFactura({...editFactura, import_total_str: e.target.value})} className="w-full px-2 py-1.5 border border-border-light rounded text-sm" />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                      <button type="button" onClick={handleUpdateFactura} className="flex-1 py-1.5 bg-accent text-white text-xs font-bold rounded hover:bg-accent-dark transition-colors">Guardar</button>
                                      <button type="button" onClick={() => { setEditingFacturaId(null); setEditFactura({}); }} className="flex-1 py-1.5 bg-white text-text-secondary border border-border-light text-xs font-bold rounded hover:bg-slate-50 transition-colors">Cancel·lar</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="text-xs text-text-secondary mb-1">{new Date(factura.data).toLocaleDateString('ca-ES')}</div>
                                    <div className="text-sm font-medium">{factura.descripcio || 'Sense descripció'}</div>
                                    <div className="text-xs text-text-secondary mt-1 grid grid-cols-2 gap-1">
                                      {factura.expedient && <span className="col-span-2">Exp: {factura.expedient}</span>}
                                      <span>Reg: {factura.numero_registre || '-'}</span>
                                      <span>Fac: {factura.numero_factura || '-'}</span>
                                      <span className="col-span-2">Període: {factura.periode || '-'}</span>
                                    </div>
                                    <div className="text-sm font-bold text-primary mt-2">{formatCurrency(Number(factura.import_total))}</div>
                                    
                                    {(user.role === 'Administrador' || user.role === 'Gestió') && (
                                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => {
                                            setEditingFacturaId(factura.id!);
                                            setEditFactura({ ...factura, import_total_str: String(factura.import_total || '') });
                                          }}
                                          className="p-1 text-slate-400 hover:text-accent rounded"
                                          title="Editar factura"
                                        >
                                          <Pencil size={16} />
                                        </button>
                                        <button
                                          onClick={() => factura.id && handleDeleteFactura(factura.id)}
                                          className="p-1 text-slate-400 hover:text-danger rounded"
                                          title="Eliminar factura"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-text-secondary italic">No hi ha factures vinculades.</div>
                        )}

                        {(user.role === 'Administrador' || user.role === 'Gestió') && (
                          <div className="pt-2 border-t border-border-light">
                            {!showAddFactura ? (
                              <button
                                type="button"
                                onClick={() => setShowAddFactura(true)}
                                className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-accent border border-accent rounded-md hover:bg-accent/5 transition-colors"
                              >
                                <Plus size={16} /> Afegir factura
                              </button>
                            ) : (
                              <div className="p-3 bg-blue-50 border border-blue-100 rounded-md space-y-3">
                                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Nova Factura</h4>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs text-text-secondary mb-1">Data</label>
                                    <input type="date" value={newFactura.data} onChange={e => setNewFactura({...newFactura, data: e.target.value})} className="w-full px-2 py-1.5 border border-border-light rounded text-sm" />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-text-secondary mb-1">Expedient</label>
                                    <input type="text" value={newFactura.expedient || ''} onChange={e => setNewFactura({...newFactura, expedient: e.target.value})} className="w-full px-2 py-1.5 border border-border-light rounded text-sm" />
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs text-text-secondary mb-1">Núm Registre</label>
                                    <input type="text" value={newFactura.numero_registre} onChange={e => setNewFactura({...newFactura, numero_registre: e.target.value})} className="w-full px-2 py-1.5 border border-border-light rounded text-sm" placeholder="ex: F/any/num" />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-text-secondary mb-1">Núm Factura</label>
                                    <input type="text" value={newFactura.numero_factura} onChange={e => setNewFactura({...newFactura, numero_factura: e.target.value})} className="w-full px-2 py-1.5 border border-border-light rounded text-sm" />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-text-secondary mb-1">Període</label>
                                  <input type="text" value={newFactura.periode} onChange={e => setNewFactura({...newFactura, periode: e.target.value})} className="w-full px-2 py-1.5 border border-border-light rounded text-sm" placeholder="ex: Gener 2024" />
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-text-secondary mb-1">Descripció</label>
                                  <textarea value={newFactura.descripcio} onChange={e => setNewFactura({...newFactura, descripcio: e.target.value})} className="w-full px-2 py-1.5 border border-border-light rounded text-sm" rows={2} />
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-text-secondary mb-1">Import total</label>
                                  <input type="text" value={newFactura.import_total_str || ''} onChange={e => setNewFactura({...newFactura, import_total_str: e.target.value})} className="w-full px-2 py-1.5 border border-border-light rounded text-sm" />
                                </div>
                                
                                <div className="flex gap-2 pt-2">
                                  <button
                                    type="button"
                                    onClick={handleAddFactura}
                                    className="flex-1 py-1.5 bg-accent text-white text-xs font-bold rounded hover:bg-accent-dark transition-colors"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowAddFactura(false)}
                                    className="flex-1 py-1.5 bg-white text-text-secondary border border-border-light text-xs font-bold rounded hover:bg-slate-50 transition-colors"
                                  >
                                    Cancel·lar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border-light space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary font-medium">Crèdit reconegut:</span>
                      <span className="font-bold text-text-primary">{formatCurrency(creditReconegut)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary font-medium">Crèdit disponible:</span>
                      <span className={`font-bold ${creditDisponible < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(creditDisponible)}</span>
                    </div>
                  </div>
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
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-accent border border-transparent rounded-md hover:bg-accent-dark transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isSaving ? 'Desant...' : 'Desar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
