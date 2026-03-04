import React, { useState, useEffect } from 'react';
import { User, RESPONSABLES, ORGANS, PARTIDES_ORGANIQUES } from '../types';
import { Save, AlertCircle, CheckCircle2, UploadCloud, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FormViewProps {
  user: User;
  onSuccess: () => void;
}

export function FormView({ user, onSuccess }: FormViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  const [formData, setFormData] = useState({
    responsable_contracte: '',
    organ_contractacio: '',
    justificacio: '',
    objecte_contracte: '',
    caracteristiques_tecniques: '',
    tipus_contracte: '',
    tipus_despesa: '',
    termini_execucio: '',
    codi_cpv: '',
    partida_organica: '',
    partida_programa: '',
    partida_economica: '',
    base_imposable: '',
    quota_iva: '',
    detalls_addicionals: ''
  });

  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(`${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      const validFiles = selectedFiles.filter(f => f.type === 'application/pdf');

      if (validFiles.length !== selectedFiles.length) {
        setError("Només s'accepten fitxers PDF.");
      }

      setFiles(prev => {
        const newFiles = [...prev, ...validFiles];
        if (newFiles.length > 3) {
          setError('Pots pujar un màxim de 3 fitxers.');
          return newFiles.slice(0, 3);
        }
        return newFiles;
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (files.length === 0 || files.length > 3) {
      setError("S'han d'adjuntar entre 1 i 3 fitxers PDF.");
      return;
    }

    if (!/^\d{8}$/.test(formData.codi_cpv)) {
      setError('El codi CPV ha de tenir exactament 8 dígits.');
      return;
    }

    if (!/^\d{5}$/.test(formData.partida_programa)) {
      setError('La partida programa ha de tenir exactament 5 dígits.');
      return;
    }

    if (!/^\d{5}$/.test(formData.partida_economica)) {
      setError('La partida econòmica ha de tenir exactament 5 dígits.');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload files to Supabase Storage
      const uploadedFilesMetadata = [];
      const timestamp = Date.now();

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('peticions_pressupostos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        uploadedFilesMetadata.push({
          name: file.name,
          path: data.path,
          size: file.size
        });
      }

      // 2. Insert record into database
      const { data: record, error: dbError } = await supabase
        .from('records')
        .insert({
          responsable_contracte: formData.responsable_contracte,
          organ_contractacio: formData.organ_contractacio,
          justificacio: formData.justificacio,
          objecte_contracte: formData.objecte_contracte,
          caracteristiques_tecniques: formData.caracteristiques_tecniques,
          tipus_contracte: formData.tipus_contracte,
          tipus_despesa: formData.tipus_despesa,
          termini_execucio: parseInt(formData.termini_execucio),
          codi_cpv: formData.codi_cpv,
          partida_organica: formData.partida_organica,
          partida_programa: formData.partida_programa,
          partida_economica: formData.partida_economica,
          base_imposable: parseFloat(formData.base_imposable),
          quota_iva: parseFloat(formData.quota_iva),
          detalls_addicionals: formData.detalls_addicionals || null,
          email: user.email,
          nom: user.full_name,
          hora: new Date().toISOString(),
          created_by: user.id,
          fitxers_pressupost: uploadedFilesMetadata
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setSuccess(`Petició #${record.id} creada correctament.`);
      setFormData({
        responsable_contracte: '', organ_contractacio: '', justificacio: '', objecte_contracte: '',
        caracteristiques_tecniques: '', tipus_contracte: '', tipus_despesa: '', termini_execucio: '',
        codi_cpv: '', partida_organica: '', partida_programa: '', partida_economica: '',
        base_imposable: '', quota_iva: '', detalls_addicionals: ''
      });
      setFiles([]);

      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalIva = (parseFloat(formData.base_imposable || '0') + parseFloat(formData.quota_iva || '0')).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Nova sol·licitud</h1>
        <p className="text-slate-500 mt-1">Empleneu el formulari per registrar una nova sol·licitud.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-md flex items-start gap-3">
          <AlertCircle className="text-red-500 mt-0.5" size={20} />
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-md flex items-start gap-3">
          <CheckCircle2 className="text-green-500 mt-0.5" size={20} />
          <p className="text-green-700 text-sm font-medium">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Auto-displayed fields */}
        <div className="bg-slate-100 p-4 rounded-lg flex flex-wrap gap-6 text-sm text-slate-600 border border-slate-200">
          <div><span className="font-semibold">Hora:</span> {currentTime}</div>
          <div><span className="font-semibold">Sol·licitant:</span> {user.full_name}</div>
          <div><span className="font-semibold">Correu:</span> {user.email}</div>
        </div>

        {/* Identificació */}
        <section className="bg-white rounded-xl shadow-sm border border-border-light overflow-hidden">
          <div className="bg-primary px-6 py-3 mb-4">
            <h2 className="text-lg font-bold text-white">Identificació</h2>
          </div>
          <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsable del contracte *</label>
              <select required name="responsable_contracte" value={formData.responsable_contracte} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Seleccioni una opció</option>
                {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Òrgan de contractació *</label>
              <select required name="organ_contractacio" value={formData.organ_contractacio} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Seleccioni una opció</option>
                {ORGANS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Descripció de la Necessitat */}
        <section className="bg-white rounded-xl shadow-sm border border-border-light overflow-hidden">
          <div className="bg-primary px-6 py-3 mb-4">
            <h2 className="text-lg font-bold text-white">Descripció de la Necessitat</h2>
          </div>
          <div className="px-6 pb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Justificació de la necessitat *</label>
              <textarea required name="justificacio" value={formData.justificacio} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Objecte del contracte *</label>
              <textarea required name="objecte_contracte" value={formData.objecte_contracte} onChange={handleChange} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Característiques tècniques *</label>
              <textarea required name="caracteristiques_tecniques" value={formData.caracteristiques_tecniques} onChange={handleChange} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
            </div>
          </div>
        </section>

        {/* Tipologia */}
        <section className="bg-white rounded-xl shadow-sm border border-border-light overflow-hidden">
          <div className="bg-primary px-6 py-3 mb-4">
            <h2 className="text-lg font-bold text-white">Tipologia</h2>
          </div>
          <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipus de contracte *</label>
              <select required name="tipus_contracte" value={formData.tipus_contracte} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Selecciona un tipus</option>
                <option value="Subministrament">Subministrament</option>
                <option value="Servei">Servei</option>
                <option value="Obra">Obra</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipus de despesa *</label>
              <select required name="tipus_despesa" value={formData.tipus_despesa} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Seleccioni una opció</option>
                <option value="Puntual">Puntual</option>
                <option value="Recurrent">Recurrent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Termini d'execució (dies) *</label>
              <input required type="number" min="1" name="termini_execucio" value={formData.termini_execucio} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </section>

        {/* Codificació Pressupostària */}
        <section className="bg-white rounded-xl shadow-sm border border-border-light overflow-hidden">
          <div className="bg-primary px-6 py-3 mb-4">
            <h2 className="text-lg font-bold text-white">Codificació Pressupostària</h2>
          </div>
          <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Codi d'objecte (CPV) *</label>
              <input required type="text" pattern="\d{8}" title="Ha de tenir 8 dígits" name="codi_cpv" value={formData.codi_cpv} onChange={handleChange} placeholder="12345678" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Partida Orgànica *</label>
              <select required name="partida_organica" value={formData.partida_organica} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Seleccioni</option>
                {PARTIDES_ORGANIQUES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Partida Programa *</label>
              <input required type="text" pattern="\d{5}" title="Ha de tenir 5 dígits" name="partida_programa" value={formData.partida_programa} onChange={handleChange} placeholder="12345" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Partida Econòmica *</label>
              <input required type="text" pattern="\d{5}" title="Ha de tenir 5 dígits" name="partida_economica" value={formData.partida_economica} onChange={handleChange} placeholder="12345" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </section>

        {/* Imports */}
        <section className="bg-white rounded-xl shadow-sm border border-border-light overflow-hidden">
          <div className="bg-primary px-6 py-3 mb-4">
            <h2 className="text-lg font-bold text-white">Imports</h2>
          </div>
          <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Base Imposable (sense IVA) *</label>
              <div className="relative">
                <input required type="number" step="0.01" min="0" name="base_imposable" value={formData.base_imposable} onChange={handleChange} className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <span className="absolute right-3 top-2 text-slate-500">€</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quota d'IVA *</label>
              <div className="relative">
                <input required type="number" step="0.01" min="0" name="quota_iva" value={formData.quota_iva} onChange={handleChange} className="w-full px-3 py-2 pr-8 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <span className="absolute right-3 top-2 text-slate-500">€</span>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex justify-between items-center h-[42px]">
              <span className="font-medium text-amber-800">Total (amb IVA):</span>
              <span className="font-bold text-amber-900 text-lg">{totalIva} €</span>
            </div>
          </div>
        </section>

        {/* Documentació */}
        <section className="bg-white rounded-xl shadow-sm border border-border-light overflow-hidden">
          <div className="bg-primary px-6 py-3 mb-4">
            <h2 className="text-lg font-bold text-white">Documentació</h2>
          </div>
          <div className="px-6 pb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Pressupost sol·licitat (PDF, 1-3 fitxers) *</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-3 text-slate-400" />
                  <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Feu clic per pujar</span> o arrossegueu els fitxers</p>
                  <p className="text-xs text-slate-500">PDF (Màx. 3 fitxers)</p>
                </div>
                <input type="file" className="hidden" accept="application/pdf" multiple onChange={handleFileChange} disabled={files.length >= 3} />
              </label>
            </div>

            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-red-100 text-red-600 p-1.5 rounded">
                        <span className="text-xs font-bold">PDF</span>
                      </div>
                      <span className="text-sm font-medium text-slate-700 truncate">{file.name}</span>
                      <span className="text-xs text-slate-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button type="button" onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-500 p-1">
                      <X size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Notes */}
        <section className="bg-white rounded-xl shadow-sm border border-border-light overflow-hidden">
          <div className="bg-primary px-6 py-3 mb-4">
            <h2 className="text-lg font-bold text-white">Notes</h2>
          </div>
          <div className="px-6 pb-6">
            <label className="block text-sm font-medium text-slate-700 mb-1">Detalls addicionals (Opcional)</label>
            <textarea name="detalls_addicionals" value={formData.detalls_addicionals} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-accent hover:bg-accent-dark text-white font-medium py-3 px-8 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <><Save size={20} /> Desar</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
