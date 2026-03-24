import React, { useState, useEffect } from 'react';
import {
  Contract,
  ContractLot,
  User,
  CONTRACTE_TIPUS,
  CONTRACTE_ORGANS,
  CONTRACTE_RESPONSABLES,
  PROCEDIMENTS_ADJUDICACIO,
  CENTRES_IMAS,
} from '../types';
import {
  X,
  Edit,
  Trash2,
  ExternalLink,
  Save,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  UploadCloud,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ContractEditModalProps {
  contract: Contract;
  user: User;
  onClose: () => void;
  onSave: (updated: Partial<Contract>, updatedLots: ContractLot[]) => Promise<void>;
  onDeleteRequest: () => void;
}

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm';
const labelClass = 'block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1';
const readValueClass = 'text-sm text-slate-800 font-medium';

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className={readValueClass}>{value || <span className="text-slate-400 italic">—</span>}</p>
    </div>
  );
}

function BoolField({ label, value }: { label: string; value: boolean }) {
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
          value ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
        }`}
      >
        {value ? 'Sí' : 'No'}
      </span>
    </div>
  );
}

export function ContractEditModal({
  contract,
  user,
  onClose,
  onSave,
  onDeleteRequest,
}: ContractEditModalProps) {
  const isAdmin = user.role === 'Administrador';
  const [mode, setMode] = useState<'view' | 'edit'>(isAdmin ? 'view' : 'view');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedLots, setExpandedLots] = useState<Record<number, boolean>>({ 0: true });

  // Edit state
  const [editGeneral, setEditGeneral] = useState<Partial<Contract>>({});
  const [editLots, setEditLots] = useState<ContractLot[]>([]);
  const [lotFiles, setLotFiles] = useState<Record<number, File | null>>({});

  useEffect(() => {
    if (mode === 'edit') {
      setEditGeneral({ ...contract });
      setEditLots(contract.lots ? contract.lots.map((l) => ({ ...l })) : []);
    }
  }, [mode, contract]);

  const handleGeneralChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setEditGeneral((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLotChange = (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditLots((prev) =>
      prev.map((lot, i) =>
        i === idx
          ? {
              ...lot,
              [name]:
                name === 'import_comes'
                  ? value === ''
                    ? null
                    : parseFloat(value)
                  : value,
            }
          : lot
      )
    );
  };

  const handleLotCentre = (lotIdx: number, centre: string) => {
    setEditLots((prev) =>
      prev.map((lot, i) => {
        if (i !== lotIdx) return lot;
        const has = lot.centres.includes(centre);
        return {
          ...lot,
          centres: has ? lot.centres.filter((c) => c !== centre) : [...lot.centres, centre],
        };
      })
    );
  };

  const addLot = () => {
    setEditLots((prev) => [
      ...prev,
      {
        nom_lot: '',
        cpv: '',
        adjudicatari: '',
        import_comes: null,
        data_inici: '',
        data_fi: '',
        data_limit_comunicacio_proroga: '',
        data_inici_proroga: '',
        data_fi_proroga: '',
        centres: [],
        contract_id: contract.id,
        formalitzacio_document: null,
        telefon: '',
        email: '',
      },
    ]);
    setExpandedLots((prev) => ({ ...prev, [editLots.length]: true }));
  };

  const removeLot = (idx: number) => {
    setEditLots((prev) => prev.filter((_, i) => i !== idx));
    const newFiles = { ...lotFiles };
    delete newFiles[idx];
    setLotFiles(newFiles);
  };

  const handleLotFileChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type !== 'application/pdf') {
      setError("Només s'accepten fitxers PDF.");
      return;
    }
    setLotFiles((prev) => ({ ...prev, [idx]: file }));
  };

  const removeLotFile = (idx: number) => {
    setLotFiles((prev) => ({ ...prev, [idx]: null }));
  };

  const toggleLot = (idx: number) => {
    setExpandedLots((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Upload any new lot files
      const finalLots = await Promise.all(
        editLots.map(async (lot, idx) => {
          const file = lotFiles[idx];
          if (!file) return lot;

          const ext = file.name.split('.').pop();
          const path = `${user.id}/${Date.now()}_lot_${idx}_formalitzacio.${ext}`;
          const { error: upErr, data } = await supabase.storage
            .from('contractes_documents')
            .upload(path, file);
          if (upErr) throw upErr;

          return {
            ...lot,
            formalitzacio_document: { name: file.name, path: data.path, size: file.size },
          };
        })
      );

      await onSave(editGeneral, finalLots);
      setMode('view');
      setLotFiles({});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getDocUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from('contractes_documents')
      .createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const displayLots = mode === 'edit' ? editLots : contract.lots || [];
  const displayGeneral = mode === 'edit' ? editGeneral : contract;

  const formatDate = (d?: string | null) => {
    if (!d) return null;
    try {
      const dt = new Date(d + 'T00:00:00');
      return dt.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const formatCurrency = (v?: number | null) => {
    if (v == null) return null;
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(v);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-slate-900/50 backdrop-blur-sm">
      <div className="relative bg-white h-full w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-white px-6 py-4 flex items-start justify-between shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-xs text-primary-light uppercase tracking-wider mb-0.5">Contracte #{contract.id}</p>
            <h2 className="text-lg font-bold truncate">{contract.nom_contracte}</h2>
            <p className="text-sm text-primary-light mt-0.5">{contract.organ_contractacio}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && mode === 'view' && (
              <>
                <button
                  onClick={() => setMode('edit')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors"
                >
                  <Edit size={15} /> Editar
                </button>
                <button
                  onClick={onDeleteRequest}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 rounded-md text-sm font-medium transition-colors"
                >
                  <Trash2 size={15} /> Eliminar
                </button>
              </>
            )}
            {mode === 'edit' && (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 rounded-md text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={15} /> Desar</>}
                </button>
                <button
                  onClick={() => { setMode('view'); setError(''); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-sm font-medium transition-colors"
                >
                  Cancel·lar
                </button>
              </>
            )}
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2 text-red-700 text-sm shrink-0">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── General ── */}
          <section>
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
              Dades generals
            </h3>
            {mode === 'view' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Tipus de contracte" value={contract.tipus_contracte} />
                <Field label="Procediment d'adjudicació" value={contract.procediment_adjudicacio} />
                <Field label="Òrgan de contractació" value={contract.organ_contractacio} />
                <Field label="Responsable" value={contract.responsable_contracte} />
                <Field label="Dossier" value={contract.dossier} />
                <Field label="SEGEX" value={contract.segex} />
                <Field label="Referència interna" value={contract.referencia_interna} />
                <Field label="Duració inicial" value={contract.duracio_inicial} />
                <BoolField label="Prorrogable" value={contract.prorrogable} />
                {contract.prorrogable && <Field label="Pròrrogues" value={contract.prorrogues} />}
                <BoolField label="Modificable" value={contract.modificable} />
                {contract.modificat && <Field label="Modificat" value={contract.modificat} />}
                {contract.detalls_addicionals && (
                  <div className="col-span-2 md:col-span-3">
                    <Field label="Detalls addicionals" value={contract.detalls_addicionals} />
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nom del contracte</label>
                  <input type="text" name="nom_contracte"
                    value={(editGeneral as Contract).nom_contracte || ''}
                    onChange={handleGeneralChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Tipus de contracte</label>
                  <select name="tipus_contracte"
                    value={(editGeneral as Contract).tipus_contracte || ''}
                    onChange={handleGeneralChange} className={inputClass}>
                    <option value="">—</option>
                    {CONTRACTE_TIPUS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Procediment d'adjudicació</label>
                  <select name="procediment_adjudicacio"
                    value={(editGeneral as Contract).procediment_adjudicacio || ''}
                    onChange={handleGeneralChange} className={inputClass}>
                    <option value="">—</option>
                    {PROCEDIMENTS_ADJUDICACIO.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Òrgan de contractació</label>
                  <select name="organ_contractacio"
                    value={(editGeneral as Contract).organ_contractacio || ''}
                    onChange={handleGeneralChange} className={inputClass}>
                    <option value="">—</option>
                    {CONTRACTE_ORGANS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Responsable del contracte</label>
                  <select name="responsable_contracte"
                    value={(editGeneral as Contract).responsable_contracte || ''}
                    onChange={handleGeneralChange} className={inputClass}>
                    <option value="">—</option>
                    {CONTRACTE_RESPONSABLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Dossier</label>
                  <input type="text" name="dossier"
                    value={(editGeneral as Contract).dossier || ''}
                    onChange={handleGeneralChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>SEGEX</label>
                  <input type="text" name="segex"
                    value={(editGeneral as Contract).segex || ''}
                    onChange={handleGeneralChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Referència interna</label>
                  <input type="text" name="referencia_interna"
                    value={(editGeneral as Contract).referencia_interna || ''}
                    onChange={handleGeneralChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Duració inicial</label>
                  <input type="text" name="duracio_inicial"
                    value={(editGeneral as Contract).duracio_inicial || ''}
                    onChange={handleGeneralChange} className={inputClass} />
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { name: 'prorrogable', label: 'Prorrogable' },
                    { name: 'modificable', label: 'Modificable' },
                  ].map(({ name, label }) => (
                    <label key={name} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name={name}
                        checked={!!(editGeneral as any)[name]}
                        onChange={handleGeneralChange}
                        className="h-4 w-4 text-primary rounded border-slate-300" />
                      <span className="text-sm text-slate-700">{label}</span>
                    </label>
                  ))}
                </div>
                {(editGeneral as Contract).prorrogable && (
                  <div>
                    <label className={labelClass}>Pròrrogues</label>
                    <input type="text" name="prorrogues"
                      value={(editGeneral as Contract).prorrogues || ''}
                      onChange={handleGeneralChange} className={inputClass} />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className={labelClass}>Modificat (post-alta)</label>
                  <textarea name="modificat" rows={3}
                    value={(editGeneral as Contract).modificat || ''}
                    onChange={handleGeneralChange} className={inputClass}
                    placeholder="Descriu les modificacions aplicades al contracte..." />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Detalls addicionals</label>
                  <textarea name="detalls_addicionals" rows={3}
                    value={(editGeneral as Contract).detalls_addicionals || ''}
                    onChange={handleGeneralChange} className={inputClass} />
                </div>
              </div>
            )}
          </section>

          {/* ── Lots ── */}
          <section>
            <div className="flex items-center justify-between mb-3 pb-1 border-b border-slate-200">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">
                Lots ({displayLots.length})
              </h3>
              {mode === 'edit' && !contract.sense_lots && (
                <button type="button" onClick={addLot}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium">
                  <Plus size={14} /> Afegir lot
                </button>
              )}
            </div>
            <div className="space-y-3">
              {displayLots.map((lot, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleLot(idx)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-sm font-semibold text-slate-700">
                      {lot.nom_lot || `Lot ${idx + 1}`}
                    </span>
                    <div className="flex items-center gap-2">
                      {mode === 'edit' && !contract.sense_lots && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); removeLot(idx); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); removeLot(idx); } }}
                          className="text-red-400 hover:text-red-600 p-1 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </span>
                      )}
                      {expandedLots[idx] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {expandedLots[idx] && (
                    <div className="p-4">
                      {mode === 'view' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <Field label="CPV" value={lot.cpv} />
                          <Field label="Adjudicatari" value={lot.adjudicatari} />
                          <Field label="Telèfon Adjudicatari" value={lot.telefon} />
                          <Field label="E-mail Adjudicatari" value={lot.email} />
                          <Field label="Import compromès" value={formatCurrency(lot.import_comes)} />
                          <Field label="Data d'inici" value={formatDate(lot.data_inici)} />
                          <Field label="Data de fi" value={formatDate(lot.data_fi)} />
                          <Field label="Límit comunicació pròrroga" value={formatDate(lot.data_limit_comunicacio_proroga)} />
                          <Field label="Inici pròrroga" value={formatDate(lot.data_inici_proroga)} />
                          <Field label="Fi pròrroga" value={formatDate(lot.data_fi_proroga)} />
                          {lot.formalitzacio_document && (
                            <div className="col-span-2 md:col-span-3">
                              <p className={labelClass}>Formalització de contracte</p>
                              <button
                                onClick={() => getDocUrl(lot.formalitzacio_document!.path)}
                                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors mt-1"
                              >
                                <ExternalLink size={14} />
                                <span className="truncate">{lot.formalitzacio_document.name}</span>
                              </button>
                            </div>
                          )}
                          {lot.centres.length > 0 && (
                            <div className="col-span-2 md:col-span-3">
                              <p className={labelClass}>Centres afectats</p>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {lot.centres.map((c) => (
                                  <span key={c} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {!contract.sense_lots && (
                            <div className="md:col-span-2 lg:col-span-3">
                              <label className={labelClass}>Nom del lot</label>
                              <input type="text" name="nom_lot"
                                value={lot.nom_lot} onChange={(e) => handleLotChange(idx, e)} className={inputClass} />
                            </div>
                          )}
                          <div>
                            <label className={labelClass}>CPV</label>
                            <input type="text" name="cpv" value={lot.cpv}
                              onChange={(e) => handleLotChange(idx, e)} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Adjudicatari</label>
                            <input type="text" name="adjudicatari" value={lot.adjudicatari}
                              onChange={(e) => handleLotChange(idx, e)} className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Telèfon Adjudicatari</label>
                            <input type="text" name="telefon" value={lot.telefon || ''}
                              maxLength={9}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 9) {
                                  handleLotChange(idx, { ...e, target: { ...e.target, name: 'telefon', value: val } } as any);
                                }
                              }}
                              className={inputClass} placeholder="9 digits" />
                          </div>
                          <div>
                            <label className={labelClass}>E-mail Adjudicatari</label>
                            <input type="email" name="email" value={lot.email || ''}
                              onChange={(e) => handleLotChange(idx, e)} className={inputClass} placeholder="email@exemple.com" />
                          </div>
                          <div>
                            <label className={labelClass}>Import compromès (€)</label>
                            <input type="number" step="0.01" name="import_comes"
                              value={lot.import_comes ?? ''}
                              onChange={(e) => handleLotChange(idx, e)} className={inputClass} />
                          </div>
                          {[
                            { name: 'data_inici', label: "Data d'inici" },
                            { name: 'data_fi', label: 'Data de fi' },
                            { name: 'data_limit_comunicacio_proroga', label: 'Límit comunicació pròrroga' },
                            { name: 'data_inici_proroga', label: 'Inici pròrroga' },
                            { name: 'data_fi_proroga', label: 'Fi pròrroga' },
                          ].map(({ name, label }) => (
                            <div key={name}>
                              <label className={labelClass}>{label}</label>
                              <input type="date" name={name}
                                value={(lot as any)[name] || ''}
                                onChange={(e) => handleLotChange(idx, e)} className={inputClass} />
                            </div>
                          ))}
                          <div className="md:col-span-2 lg:col-span-3">
                            <label className={labelClass}>Centres afectats</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1">
                              {CENTRES_IMAS.map((centre) => {
                                const isChecked = lot.centres.includes(centre);
                                return (
                                  <label key={centre}
                                    className={`flex items-center gap-2 p-1.5 rounded border cursor-pointer text-xs transition-colors ${isChecked ? 'bg-blue-50 border-blue-400 text-blue-800 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    <input type="checkbox" checked={isChecked}
                                      onChange={() => handleLotCentre(idx, centre)}
                                      className="h-3.5 w-3.5 rounded text-primary border-slate-300" />
                                    {centre}
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          {/* Lot Document Edit */}
                          <div className="md:col-span-2 lg:col-span-3 border-t border-slate-200 mt-4 pt-4">
                            <label className={labelClass}>Formalització de contracte (PDF)</label>
                            {lotFiles[idx] ? (
                              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <div className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-bold shrink-0">PDF</div>
                                  <span className="text-xs text-slate-700 truncate">{lotFiles[idx]!.name}</span>
                                </div>
                                <button type="button" onClick={() => removeLotFile(idx)}
                                  className="text-slate-400 hover:text-red-500 p-1 shrink-0">
                                  <X size={16} />
                                </button>
                              </div>
                            ) : lot.formalitzacio_document ? (
                              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <div className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-xs font-bold shrink-0">PDF</div>
                                  <span className="text-xs text-blue-700 truncate">{lot.formalitzacio_document.name}</span>
                                </div>
                                <label className="text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer underline">
                                  Canviar
                                  <input type="file" className="hidden" accept="application/pdf"
                                    onChange={(e) => handleLotFileChange(idx, e)} />
                                </label>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                <UploadCloud className="w-5 h-5 mb-1 text-slate-400" />
                                <p className="text-xs text-slate-500">Feu clic per pujar la formalització (PDF)</p>
                                <input type="file" className="hidden" accept="application/pdf"
                                  onChange={(e) => handleLotFileChange(idx, e)} />
                              </label>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Documents ── */}
          <section>
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
              Documents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { key: 'ppt_document', label: 'PPT' },
                { key: 'pcap_document', label: 'PCAP' },
                { key: 'resolucio_document', label: "Resolució d'Adjudicació" },
              ] as const).map(({ key, label }) => {
                const doc = contract[key];
                return (
                  <div key={key} className="border border-slate-200 rounded-lg p-3">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">{label}</p>
                    {doc ? (
                      <button
                        onClick={() => getDocUrl(doc.path)}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        <ExternalLink size={14} />
                        <span className="truncate">{doc.name}</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No adjuntat</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
