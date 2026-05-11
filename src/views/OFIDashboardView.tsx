import React, { useState, useEffect } from 'react';
import { OFI, User } from '../types';
import { Plus, Eye, FileDown, Search, AlertCircle, FilePlus2, ChevronUp, ChevronDown, Filter, X, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { OFIInvoiceModal } from '../components/OFIInvoiceModal';
import { generateMemoriaOFI } from '../utils/generateInforme';
import * as XLSX from 'xlsx';

interface OFIDashboardViewProps {
  user: User;
  onNavigate: (view: any) => void;
}

export function OFIDashboardView({ user, onNavigate }: OFIDashboardViewProps) {
  const [ofis, setOfis] = useState<OFI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDataInici, setFilterDataInici] = useState('');
  const [filterDataFi, setFilterDataFi] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [selectedOfi, setSelectedOfi] = useState<OFI | null>(null);
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<keyof OFI>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchOfis = async () => {
    setLoading(true);
    try {
      const { data, error: sbError } = await (supabase as any)
        .from('ofi_with_aggregates')
        .select('*')
        .order('created_at', { ascending: false });

      if (sbError) throw sbError;
      setOfis(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfis();
  }, []);

  const handleClearFilters = () => {
    setFilterSearch('');
    setFilterDataInici('');
    setFilterDataFi('');
  };

  const handleExportExcel = () => {
    const dataToExport = sortedOfis.map(o => ({
      'Període': formatPeriod(o.data_min, o.data_max),
      'Codi OFI': o.codi_ofi,
      'Centre o servei': o.centre_servei,
      'Descripció': o.descripcio || '-',
      'Àrea': o.area || 'Sense assignar',
      'Nº de factures': o.num_factures,
      'Import total': o.total_import,
      'Expedient OFI': o.expedient_ofi,
      'Data creació': new Date(o.created_at).toLocaleDateString('ca-ES')
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'OFIs');
    XLSX.writeFile(wb, `OFIs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredOfis = ofis.filter(o => {
    if (filterSearch) {
      const searchLower = filterSearch.toLowerCase();
      const matchesSearch = 
        o.codi_ofi.toLowerCase().includes(searchLower) ||
        o.expedient_ofi.toLowerCase().includes(searchLower) ||
        o.centre_servei.toLowerCase().includes(searchLower) ||
        (o.descripcio && o.descripcio.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }

    if (filterDataInici || filterDataFi) {
      const recordDate = new Date(o.created_at);
      recordDate.setHours(0, 0, 0, 0);

      if (filterDataInici) {
        const startDate = new Date(filterDataInici);
        startDate.setHours(0, 0, 0, 0);
        if (recordDate < startDate) return false;
      }

      if (filterDataFi) {
        const endDate = new Date(filterDataFi);
        endDate.setHours(23, 59, 59, 999);
        if (recordDate > endDate) return false;
      }
    }

    return true;
  });

  const sortedOfis = [...filteredOfis].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    
    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    const modifier = sortDirection === 'asc' ? 1 : -1;
    
    if (typeof valA === 'string' && typeof valB === 'string') {
      return valA.localeCompare(valB) * modifier;
    }
    return (valA < valB ? -1 : 1) * modifier;
  });

  const handleSort = (field: keyof OFI) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIndicator = ({ field }: { field: keyof OFI }) => {
    if (sortField !== field) return <div className="w-4" />;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const handleGenerateDocument = async (ofi: OFI) => {
    setGeneratingId(ofi.id);
    try {
      await generateMemoriaOFI(ofi);
    } catch (err: any) {
      setError(err.message || 'Error en generar el document');
    } finally {
      setGeneratingId(null);
    }
  };

  const getExpedientUrl = (expedient: string | null) => {
    if (!expedient) return '#';
    const numericId = expedient.replace(/\D/g, '');
    return `https://imas.secimallorca.net/segex/expediente.aspx?id=${numericId}`;
  };

  const formatPeriod = (min?: string, max?: string) => {
    if (!min || !max) return '-';
    const dMin = new Date(min).toLocaleDateString('ca-ES');
    const dMax = new Date(max).toLocaleDateString('ca-ES');
    return `${dMin} - ${dMax}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden relative">
      
      {/* Mobile Sidebar Toggle */}
      <button
        className="md:hidden absolute bottom-4 right-4 z-30 bg-blue-900 text-white p-3 rounded-full shadow-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Filter size={24} />
      </button>

      {/* Sidebar Filters */}
      <aside className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 transition-transform duration-300 ease-in-out
        absolute md:relative z-20 md:z-0 w-72 h-full bg-white border-r border-slate-200 shadow-sm flex flex-col
      `}>
        <div className="p-4 border-b border-border-light bg-bg-light flex justify-between items-center bg-bg-light">
          <h2 className="font-bold text-primary flex items-center gap-2 text-sm uppercase tracking-wider">
            <Filter size={18} /> Filtres OFI
          </h2>
          <button className="md:hidden text-text-secondary hover:text-text-primary" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          {/* Search */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Cerca ràpida</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-text-secondary" />
              </div>
              <input
                type="text"
                placeholder="Codi, expedient..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-border-light rounded-md focus:ring-1 focus:ring-primary outline-none text-sm"
              />
            </div>
          </div>

          {/* Període creació */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Data de creació</label>
            <div className="flex flex-col gap-2">
              <div>
                <label className="block text-[10px] text-text-secondary uppercase mb-1">Des de</label>
                <input
                  type="date"
                  value={filterDataInici}
                  onChange={(e) => setFilterDataInici(e.target.value)}
                  className="w-full text-sm px-2 py-1.5 border border-border-light rounded-md focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-text-secondary uppercase mb-1">Fins a</label>
                <input
                  type="date"
                  value={filterDataFi}
                  onChange={(e) => setFilterDataFi(e.target.value)}
                  className="w-full text-sm px-2 py-1.5 border border-border-light rounded-md focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border-light bg-bg-light space-y-2">
          <button
            onClick={handleClearFilters}
            className="w-full py-2 px-4 bg-white border border-border-light text-text-primary rounded-md text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
          >
            Netejar filtres
          </button>
          <button
            onClick={handleExportExcel}
            className="w-full py-2 px-4 bg-green-600 border border-transparent text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <FileDown size={18} /> Descarregar Excel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border-light bg-white flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-text-primary">Control d'OFIs</h1>
            {(user.role === 'Administrador') && (
              <button
                onClick={() => onNavigate('ofi-form')}
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-bold rounded-lg transition-all shadow-sm transform active:scale-95"
              >
                <Plus size={18} />
                Nou OFI
              </button>
            )}
          </div>
          <span className="bg-primary-light text-primary text-xs font-bold px-3 py-1 rounded-full border border-primary/10">
            {sortedOfis.length} {sortedOfis.length === 1 ? 'registre' : 'registres'}
          </span>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 p-8 bg-white rounded-lg shadow-sm border border-red-100 max-w-2xl mx-auto">
              <AlertCircle className="mx-auto mb-2 text-red-500" size={32} />
              <p className="font-medium">Error en carregar les dades</p>
              <p className="text-sm mt-1">{error}</p>
              <button 
                onClick={fetchOfis}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-md text-sm transition-colors"
              >
                Tornar a intentar
              </button>
            </div>
          ) : sortedOfis.length === 0 ? (
            <div className="text-center text-slate-500 p-12 bg-white rounded-lg shadow-sm border border-border-light flex flex-col items-center max-w-2xl mx-auto">
              <FilePlus2 size={48} className="text-slate-300 mb-4" />
              <p className="text-lg font-medium text-slate-900">No s'han trobat OFIs</p>
              <p className="text-sm mt-1">
                {filterSearch ? "No hi ha cap OFI que coincideixi amb la cerca." : "Encara no s'ha creat cap OFI."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-border-light overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-primary">
                  <tr>
                    <th 
                      className="px-4 py-3 text-center text-[10px] font-bold text-white uppercase tracking-wider"
                    >
                      Període
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-colors"
                      onClick={() => handleSort('codi_ofi')}
                    >
                      <div className="flex items-center gap-1">
                        Codi OFI <SortIndicator field="codi_ofi" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-colors"
                      onClick={() => handleSort('centre_servei')}
                    >
                      <div className="flex items-center gap-1">
                        Centre o servei <SortIndicator field="centre_servei" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-colors"
                      onClick={() => handleSort('descripcio')}
                    >
                      <div className="flex items-center gap-1">
                        Descripció <SortIndicator field="descripcio" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-[10px] font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-colors"
                      onClick={() => handleSort('area')}
                    >
                      <div className="flex items-center gap-1">
                        Àrea <SortIndicator field="area" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-white uppercase tracking-wider">
                      Factures
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-white uppercase tracking-wider">
                      Import total
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-white uppercase tracking-wider">
                      Accions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {sortedOfis.map((ofi) => (
                    <tr key={ofi.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-slate-500 font-medium">
                        {formatPeriod(ofi.data_min, ofi.data_max)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-primary">
                        {ofi.codi_ofi}
                      </td>
                      <td className="px-4 py-4 text-sm text-text-secondary">
                        {ofi.centre_servei}
                      </td>
                      <td className="px-4 py-4 text-sm text-text-secondary italic line-clamp-1 max-w-[200px]" title={ofi.descripcio}>
                        {ofi.descripcio || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-text-secondary">
                        {ofi.area || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${ofi.num_factures && ofi.num_factures > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {ofi.num_factures || 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-bold text-text-primary">
                        {formatCurrency(ofi.total_import || 0)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleGenerateDocument(ofi)}
                            disabled={generatingId === ofi.id}
                            className={`flex items-center justify-center w-[28px] h-[28px] rounded transition-colors ${
                              generatingId === ofi.id 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                : 'hover:bg-slate-100 text-primary'
                            }`}
                            title="Descarregar Memòria justificativa"
                          >
                            {generatingId === ofi.id ? (
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <FileDown size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedOfi(ofi)}
                            className="flex items-center justify-center w-[28px] h-[28px] rounded hover:bg-slate-100 text-primary transition-colors"
                            title="Veure factures associades"
                          >
                            <Eye size={18} />
                          </button>
                          
                          {/* Expedient Badge */}
                          <div className="flex justify-start min-w-[100px] ml-2">
                            {ofi.expedient_ofi && (
                              <a
                                href={getExpedientUrl(ofi.expedient_ofi)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#5B21B6] hover:bg-[#DDD6FE] transition-colors whitespace-nowrap"
                                title="Obrir expedient SEGEX"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {ofi.expedient_ofi}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {selectedOfi && (
        <OFIInvoiceModal 
          ofi={selectedOfi} 
          user={user}
          onClose={() => setSelectedOfi(null)} 
          onRefresh={fetchOfis}
        />
      )}
    </div>
  );
}
