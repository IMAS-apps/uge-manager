import React, { useState } from 'react';
import { User, AREES_OFI, TEXTOS_JUSTIFICACIO_OFI } from '../types';
import { Save, AlertCircle, CheckCircle2, FilePlus2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OFIFormViewProps {
  user: User;
  onSuccess: () => void;
}

export function OFIFormView({ user, onSuccess }: OFIFormViewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    codi_ofi: '',
    expedient_ofi: '',
    centre_servei: '',
    area: '',
    justificacio_general: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (user.role !== 'Administrador' && user.role !== 'Gestió') {
      setError('No tens permisos per crear OFIs.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: dbError } = await (supabase as any)
        .from('ofi')
        .insert({
          codi_ofi: formData.codi_ofi,
          expedient_ofi: formData.expedient_ofi,
          centre_servei: formData.centre_servei,
          area: formData.area,
          justificacio_general: TEXTOS_JUSTIFICACIO_OFI[formData.area] || '',
          created_by: user.id
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setSuccess(`OFI #${data.id} creat correctament.`);
      setFormData({
        codi_ofi: '',
        expedient_ofi: '',
        centre_servei: '',
        area: '',
        justificacio_general: ''
      });

      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <FilePlus2 className="text-primary" />
          Nou OFI
        </h1>
        <p className="text-text-secondary mt-1">Introduïu les dades de la nova Ordre de Facturació Interna.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-danger rounded-r-md flex items-start gap-3">
          <AlertCircle className="text-danger mt-0.5" size={20} />
          <p className="text-danger text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-success rounded-r-md flex items-start gap-3">
          <CheckCircle2 className="text-success mt-0.5" size={20} />
          <p className="text-success text-sm font-medium">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-border-light overflow-hidden">
          <div className="bg-primary px-6 py-3">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider text-sm">Dades de l'OFI</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Codi OFI *</label>
                <input
                  required
                  type="text"
                  name="codi_ofi"
                  value={formData.codi_ofi}
                  onChange={handleChange}
                  placeholder="ex: 001/26"
                  className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Expedient OFI *</label>
                <input
                  required
                  type="text"
                  name="expedient_ofi"
                  value={formData.expedient_ofi}
                  onChange={handleChange}
                  placeholder="ex: 1234567A"
                  className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Centre o servei *</label>
              <input
                required
                type="text"
                name="centre_servei"
                value={formData.centre_servei}
                onChange={handleChange}
                placeholder="Introduïu el centre o servei..."
                className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Àrea *</label>
              <select
                required
                name="area"
                value={formData.area}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border-light rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              >
                <option value="">Selecciona una àrea...</option>
                {AREES_OFI.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-accent hover:bg-accent-dark text-white font-bold py-3 px-10 rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-70 transform active:scale-95"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <><Save size={20} /> Desar OFI</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
