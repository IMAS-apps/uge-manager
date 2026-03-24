import React, { useState } from 'react';
import {
  User,
  ContractLot,
  CONTRACTE_TIPUS,
  CONTRACTE_ORGANS,
  CONTRACTE_RESPONSABLES,
  PROCEDIMENTS_ADJUDICACIO,
  CENTRES_IMAS,
} from '../types';
import {
  Save,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ContractFormViewProps {
  user: User;
  onSuccess: () => void;
}

type DocumentKey = 'ppt' | 'pcap' | 'resolucio';

const EMPTY_LOT: Omit<ContractLot, 'id' | 'contract_id' | 'created_at'> = {
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
  telefon: '',
  email: '',
  formalitzacio_document: null,
};

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1';
const sectionHeaderClass = 'bg-primary px-6 py-3 mb-4';
const sectionClass =
  'bg-white rounded-xl shadow-sm border border-border-light overflow-hidden';

export function ContractFormView({ user, onSuccess }: ContractFormViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── General fields ─────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    nom_contracte: '',
    tipus_contracte: '',
    dossier: '',
    segex: '',
    referencia_interna: '',
    organ_contractacio: '',
    responsable_contracte: '',
    duracio_inicial: '',
    prorrogable: false,
    prorrogues: '',
    procediment_adjudicacio: '',
    modificable: false,
    sense_lots: true,
    detalls_addicionals: '',
  });

  // ── Lots ───────────────────────────────────────────────────────────────────
  const [lots, setLots] = useState<typeof EMPTY_LOT[]>([{ ...EMPTY_LOT }]);
  const [lotFiles, setLotFiles] = useState<(File | null)[]>([null]);

  // ── Documents ──────────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState<Record<DocumentKey, File | null>>({
    ppt: null,
    pcap: null,
    resolucio: null,
  });

  const documentLabels: Record<DocumentKey, string> = {
    ppt: 'Plec de Prescripcions Tècniques (PPT)',
    pcap: 'Plec de Clàusules Administratives Particulars (PCAP)',
    resolucio: "Resolució d'Adjudicació",
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLotChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setLots((prev) =>
      prev.map((lot, i) =>
        i === index
          ? { ...lot, [name]: name === 'import_comes' ? (value === '' ? null : parseFloat(value)) : value }
          : lot
      )
    );
  };

  const handleLotCentreToggle = (lotIndex: number, centre: string) => {
    setLots((prev) =>
      prev.map((lot, i) => {
        if (i !== lotIndex) return lot;
        const has = lot.centres.includes(centre);
        return {
          ...lot,
          centres: has
            ? lot.centres.filter((c) => c !== centre)
            : [...lot.centres, centre],
        };
      })
    );
  };

  const addLot = () => {
    setLots((prev) => [...prev, { ...EMPTY_LOT }]);
    setLotFiles((prev) => [...prev, null]);
  };

  const removeLot = (index: number) => {
    setLots((prev) => prev.filter((_, i) => i !== index));
    setLotFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDocumentChange = (key: DocumentKey, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type !== 'application/pdf') {
      setError("Només s'accepten fitxers PDF.");
      return;
    }
    setDocuments((prev) => ({ ...prev, [key]: file }));
  };

  const removeDocument = (key: DocumentKey) => {
    setDocuments((prev) => ({ ...prev, [key]: null }));
  };

  const handleLotDocumentChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type !== 'application/pdf') {
      setError("Només s'accepten fitxers PDF.");
      return;
    }
    setLotFiles((prev) => prev.map((f, i) => (i === index ? file : f)));
  };

  const removeLotDocument = (index: number) => {
    setLotFiles((prev) => prev.map((f, i) => (i === index ? null : f)));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nom_contracte.trim()) {
      setError('El nom del contracte és obligatori.');
      return;
    }
    if (lots.length === 0) {
      setError("Cal afegir almenys un lot.");
      return;
    }
    // Validate lot names only if not in "sense_lots" mode (where name is auto-assigned)
    if (!formData.sense_lots) {
      for (let i = 0; i < lots.length; i++) {
        if (!lots[i].nom_lot.trim()) {
          setError(`El lot ${i + 1} necessita un nom.`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      // 1. Upload documents
      const uploadDoc = async (file: File, key: string) => {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}_${key}.${ext}`;
        const { error: upErr, data } = await supabase.storage
          .from('contractes_documents')
          .upload(path, file);
        if (upErr) throw upErr;
        return { name: file.name, path: data.path, size: file.size };
      };

      const pptMeta = documents.ppt ? await uploadDoc(documents.ppt, 'ppt') : null;
      const pcapMeta = documents.pcap ? await uploadDoc(documents.pcap, 'pcap') : null;
      const resolucioMeta = documents.resolucio
        ? await uploadDoc(documents.resolucio, 'resolucio')
        : null;

      // 1b. Upload lot documents
      const lotDocsMeta = await Promise.all(
        lotFiles.map(async (file, idx) => {
          if (!file) return null;
          return await uploadDoc(file, `lot_${idx}_formalitzacio`);
        })
      );

      // 2. Resolve effective sense_lots: if user enabled lots, sense_lots = false
      const effectiveSenseLots = formData.sense_lots;

      // Auto-name single lot if sense_lots
      const effectiveLots = effectiveSenseLots
        ? [{ ...lots[0], nom_lot: formData.nom_contracte }]
        : lots;

      // 3. Insert contract
      const { data: contract, error: dbErr } = await supabase
        .from('contracts')
        .insert({
          nom_contracte: formData.nom_contracte,
          tipus_contracte: formData.tipus_contracte,
          dossier: formData.dossier || null,
          segex: formData.segex || null,
          referencia_interna: formData.referencia_interna || null,
          organ_contractacio: formData.organ_contractacio,
          responsable_contracte: formData.responsable_contracte,
          duracio_inicial: formData.duracio_inicial || null,
          prorrogable: formData.prorrogable,
          prorrogues: formData.prorrogues || null,
          procediment_adjudicacio: formData.procediment_adjudicacio || null,
          modificable: formData.modificable,
          sense_lots: effectiveSenseLots,
          detalls_addicionals: formData.detalls_addicionals || null,
          ppt_document: pptMeta,
          pcap_document: pcapMeta,
          resolucio_document: resolucioMeta,
          created_by: user.id,
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      // 4. Insert lots
      const lotsToInsert = effectiveLots.map((lot, idx) => ({
        contract_id: contract.id,
        nom_lot: lot.nom_lot,
        cpv: lot.cpv || null,
        adjudicatari: lot.adjudicatari || null,
        import_comes: lot.import_comes ?? null,
        data_inici: lot.data_inici || null,
        data_fi: lot.data_fi || null,
        data_limit_comunicacio_proroga: lot.data_limit_comunicacio_proroga || null,
        data_inici_proroga: lot.data_inici_proroga || null,
        data_fi_proroga: lot.data_fi_proroga || null,
        centres: lot.centres,
        telefon: lot.telefon || null,
        email: lot.email || null,
        formalitzacio_document: lotDocsMeta[idx],
      }));

      const { error: lotsErr } = await supabase.from('contract_lots').insert(lotsToInsert);
      if (lotsErr) throw lotsErr;

      setSuccess(`Contracte "${contract.nom_contracte}" creat correctament (ID: ${contract.id}).`);

      // Reset form
      setFormData({
        nom_contracte: '', tipus_contracte: '', dossier: '', segex: '',
        referencia_interna: '', organ_contractacio: '', responsable_contracte: '',
        duracio_inicial: '', prorrogable: false, prorrogues: '',
        procediment_adjudicacio: '', modificable: false,
        sense_lots: true, detalls_addicionals: '',
      });
      setLots([{ ...EMPTY_LOT }]);
      setLotFiles([null]);
      setDocuments({ ppt: null, pcap: null, resolucio: null });

      setTimeout(() => onSuccess(), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Nou contracte</h1>
        <p className="text-slate-500 mt-1">Empleneu el formulari per registrar un nou contracte.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-md flex items-start gap-3">
          <CheckCircle2 className="text-green-500 mt-0.5 shrink-0" size={20} />
          <p className="text-green-700 text-sm font-medium">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Dades generals ───────────────────────────────────────────── */}
        <section className={sectionClass}>
          <div className={sectionHeaderClass}>
            <h2 className="text-lg font-bold text-white">Dades generals del contracte</h2>
          </div>
          <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>Nom del contracte *</label>
              <input required type="text" name="nom_contracte" value={formData.nom_contracte}
                onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tipus de contracte *</label>
              <select required name="tipus_contracte" value={formData.tipus_contracte}
                onChange={handleChange} className={inputClass}>
                <option value="">Seleccioni un tipus</option>
                {CONTRACTE_TIPUS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Procediment d'adjudicació</label>
              <select name="procediment_adjudicacio" value={formData.procediment_adjudicacio}
                onChange={handleChange} className={inputClass}>
                <option value="">Seleccioni una opció</option>
                {PROCEDIMENTS_ADJUDICACIO.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Òrgan de contractació *</label>
              <select required name="organ_contractacio" value={formData.organ_contractacio}
                onChange={handleChange} className={inputClass}>
                <option value="">Seleccioni una opció</option>
                {CONTRACTE_ORGANS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Responsable del contracte *</label>
              <select required name="responsable_contracte" value={formData.responsable_contracte}
                onChange={handleChange} className={inputClass}>
                <option value="">Seleccioni una opció</option>
                {CONTRACTE_RESPONSABLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Dossier</label>
              <input type="text" name="dossier" value={formData.dossier}
                onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>SEGEX</label>
              <input type="text" name="segex" value={formData.segex}
                onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Referència interna</label>
              <input type="text" name="referencia_interna" value={formData.referencia_interna}
                onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Duració inicial</label>
              <input type="text" name="duracio_inicial" value={formData.duracio_inicial}
                onChange={handleChange} placeholder="p.e. 2 anys" className={inputClass} />
            </div>

            {/* Prorrogable */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input type="checkbox" id="prorrogable" name="prorrogable"
                  checked={formData.prorrogable} onChange={handleChange}
                  className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary" />
                <label htmlFor="prorrogable" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Prorrogable
                </label>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input type="checkbox" id="modificable" name="modificable"
                  checked={formData.modificable} onChange={handleChange}
                  className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary" />
                <label htmlFor="modificable" className="text-sm font-medium text-slate-700 cursor-pointer">
                  Modificable
                </label>
              </div>
            </div>

            {formData.prorrogable && (
              <div>
                <label className={labelClass}>Pròrrogues</label>
                <input type="text" name="prorrogues" value={formData.prorrogues}
                  onChange={handleChange} placeholder="p.e. 2 (anuals)" className={inputClass} />
              </div>
            )}

            {/* Sense lots toggle */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <input type="checkbox" id="sense_lots" name="sense_lots"
                  checked={formData.sense_lots} onChange={handleChange}
                  className="h-4 w-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500" />
                <label htmlFor="sense_lots" className="text-sm font-medium text-amber-800 cursor-pointer">
                  Contracte sense lots (el lot s'anomena com el contracte)
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* ── Lots ─────────────────────────────────────────────────────── */}
        <section className={sectionClass}>
          <div className={`${sectionHeaderClass} flex justify-between items-center`}>
            <h2 className="text-lg font-bold text-white">
              {formData.sense_lots ? 'Lot únic (sense lots)' : 'Lots del contracte'}
            </h2>
            {!formData.sense_lots && (
              <button type="button" onClick={addLot}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-md transition-colors">
                <Plus size={16} /> Afegir lot
              </button>
            )}
          </div>
          <div className="px-6 pb-6 space-y-8">
            {lots.map((lot, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-4 py-2 flex justify-between items-center">
                  <span className="text-sm font-semibold text-slate-700">
                    {formData.sense_lots ? 'Lot únic' : `Lot ${idx + 1}`}
                  </span>
                  {!formData.sense_lots && lots.length > 1 && (
                    <button type="button" onClick={() => removeLot(idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {!formData.sense_lots && (
                    <div className="md:col-span-2 lg:col-span-3">
                      <label className={labelClass}>Nom del lot *</label>
                      <input required={!formData.sense_lots} type="text" name="nom_lot"
                        value={lot.nom_lot} onChange={(e) => handleLotChange(idx, e)} className={inputClass} />
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>CPV</label>
                    <input type="text" name="cpv" value={lot.cpv}
                      onChange={(e) => handleLotChange(idx, e)} className={inputClass} placeholder="p.e. 55321000" />
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
                    <input type="number" step="0.01" min="0" name="import_comes"
                      value={lot.import_comes ?? ''} onChange={(e) => handleLotChange(idx, e)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Data d'inici</label>
                    <input type="date" name="data_inici" value={lot.data_inici}
                      onChange={(e) => handleLotChange(idx, e)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Data de fi</label>
                    <input type="date" name="data_fi" value={lot.data_fi}
                      onChange={(e) => handleLotChange(idx, e)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Data límit comunicació pròrroga</label>
                    <input type="date" name="data_limit_comunicacio_proroga"
                      value={lot.data_limit_comunicacio_proroga}
                      onChange={(e) => handleLotChange(idx, e)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Data inici pròrroga</label>
                    <input type="date" name="data_inici_proroga" value={lot.data_inici_proroga}
                      onChange={(e) => handleLotChange(idx, e)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Data fi pròrroga</label>
                    <input type="date" name="data_fi_proroga" value={lot.data_fi_proroga}
                      onChange={(e) => handleLotChange(idx, e)} className={inputClass} />
                  </div>

                  {/* Centres */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className={labelClass}>Centres afectats</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-1">
                      {CENTRES_IMAS.map((centre) => {
                        const isChecked = lot.centres.includes(centre);
                        return (
                          <label key={centre}
                            className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer text-xs transition-colors ${isChecked ? 'bg-blue-50 border-blue-400 text-blue-800 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                            <input type="checkbox" checked={isChecked}
                              onChange={() => handleLotCentreToggle(idx, centre)}
                              className="h-3.5 w-3.5 rounded text-primary border-slate-300 focus:ring-primary" />
                            {centre}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lot Document */}
                  <div className="md:col-span-2 lg:col-span-3 border-t border-slate-200 mt-4 pt-4">
                    <label className={labelClass}>Formalització de contracte (PDF)</label>
                    {lotFiles[idx] ? (
                      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-bold shrink-0">PDF</div>
                          <span className="text-xs text-slate-700 truncate">{lotFiles[idx]!.name}</span>
                        </div>
                        <button type="button" onClick={() => removeLotDocument(idx)}
                          className="text-slate-400 hover:text-red-500 p-1 shrink-0">
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                        <UploadCloud className="w-5 h-5 mb-1 text-slate-400" />
                        <p className="text-xs text-slate-500">Feu clic per pujar la formalització (PDF)</p>
                        <input type="file" className="hidden" accept="application/pdf"
                          onChange={(e) => handleLotDocumentChange(idx, e)} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Documents ────────────────────────────────────────────────── */}
        <section className={sectionClass}>
          <div className={sectionHeaderClass}>
            <h2 className="text-lg font-bold text-white">Documents</h2>
          </div>
          <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['ppt', 'pcap', 'resolucio'] as DocumentKey[]).map((key) => (
              <div key={key}>
                <label className={labelClass}>{documentLabels[key]}</label>
                {documents[key] ? (
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-xs font-bold shrink-0">PDF</div>
                      <span className="text-xs text-slate-700 truncate">{documents[key]!.name}</span>
                    </div>
                    <button type="button" onClick={() => removeDocument(key)}
                      className="text-slate-400 hover:text-red-500 p-1 shrink-0">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <UploadCloud className="w-6 h-6 mb-1 text-slate-400" />
                    <p className="text-xs text-slate-500">Feu clic per pujar (PDF)</p>
                    <input type="file" className="hidden" accept="application/pdf"
                      onChange={(e) => handleDocumentChange(key, e)} />
                  </label>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Detalls addicionals ───────────────────────────────────────── */}
        <section className={sectionClass}>
          <div className={sectionHeaderClass}>
            <h2 className="text-lg font-bold text-white">Notes i detalls addicionals</h2>
          </div>
          <div className="px-6 pb-6">
            <label className={labelClass}>Detalls addicionals (Opcional)</label>
            <textarea name="detalls_addicionals" value={formData.detalls_addicionals}
              onChange={handleChange} rows={4} className={inputClass} />
          </div>
        </section>

        <div className="flex justify-end pt-2">
          <button type="submit" disabled={loading}
            className="bg-accent hover:bg-accent-dark text-white font-medium py-3 px-8 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Save size={20} /> Desar contracte</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
