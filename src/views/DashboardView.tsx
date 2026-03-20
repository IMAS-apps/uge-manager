import React, { useState, useEffect } from 'react';
import { Record, User, RESPONSABLES, ORGANS, SISTEMES_TRAMITACIO } from '../types';
import { Filter, X, Eye, CheckCircle2, AlertCircle, Search, FileText, ChevronUp, ChevronDown, FileDown } from 'lucide-react';
import { EditModal } from '../components/EditModal';
import { supabase } from '../lib/supabase';
// import { generateInforme } from '../utils/generateInforme'; // Switched to dynamic import below

interface DashboardViewProps {
  user: User;
  pendingOpenPeticioId?: number | null;
  onPendingOpenHandled?: () => void;
}

export function DashboardView({ user, pendingOpenPeticioId, onPendingOpenHandled }: DashboardViewProps) {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterTipusContracte, setFilterTipusContracte] = useState<string[]>([]);
  const [filterResponsable, setFilterResponsable] = useState('');
  const [filterOrgan, setFilterOrgan] = useState('');
  const [filterSistema, setFilterSistema] = useState('');
  const [filterDataInici, setFilterDataInici] = useState('');
  const [filterDataFi, setFilterDataFi] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal State
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<Record | null>(null);

  // Sorting State
  const [sortField, setSortField] = useState<string>('hora');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Toast
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error: sbError } = await supabase
        .from('records')
        .select('*')
        .order('hora', { ascending: false });

      if (sbError) throw sbError;

      setRecords(data as unknown as Record[]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (pendingOpenPeticioId && records.length > 0) {
      const record = records.find(r => r.id === pendingOpenPeticioId);
      if (record) {
        setSelectedRecord(record);
        setModalMode(user.role === 'Gestió' || user.role === 'Administrador' ? 'edit' : 'view');
        if (onPendingOpenHandled) {
          onPendingOpenHandled();
        }
      }
    }
  }, [pendingOpenPeticioId, records, user.role, onPendingOpenHandled]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleClearFilters = () => {
    setFilterSearch('');
    setFilterTipusContracte([]);
    setFilterResponsable('');
    setFilterOrgan('');
    setFilterSistema('');
    setFilterDataInici('');
    setFilterDataFi('');
  };

  const filteredRecords = records.filter(r => {
    if (filterSearch) {
      const searchLower = filterSearch.toLowerCase();
      const total = (r.base_imposable || 0) + (r.quota_iva || 0);
      const totalStr = String(total);
      const matchesSearch =
        (r.responsable_contracte?.toLowerCase() || '').includes(searchLower) ||
        (r.objecte_contracte?.toLowerCase() || '').includes(searchLower) ||
        (r.nom?.toLowerCase() || '').includes(searchLower) ||
        (r.email?.toLowerCase() || '').includes(searchLower) ||
        totalStr.includes(searchLower) ||
        (r.segex?.toLowerCase() || '').includes(searchLower) ||
        (r.codi_cpv?.toLowerCase() || '').includes(searchLower) ||
        (r.partida_programa?.toLowerCase() || '').includes(searchLower) ||
        (r.partida_economica?.toLowerCase() || '').includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filterTipusContracte.length > 0 && !filterTipusContracte.includes(r.tipus_contracte)) return false;
    if (filterResponsable && r.responsable_contracte !== filterResponsable) return false;
    if (filterOrgan && r.organ_contractacio !== filterOrgan) return false;
    if (filterSistema) {
      if (filterSistema === 'Sense assignar') {
        if (r.sistema_tramitacio && r.sistema_tramitacio !== '') return false;
      } else {
        if (r.sistema_tramitacio !== filterSistema) return false;
      }
    }

    if (filterDataInici || filterDataFi) {
      const recordDate = new Date(r.hora);
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

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let valA: any = a[sortField as keyof Record];
    let valB: any = b[sortField as keyof Record];

    // Special case for computed total
    if (sortField === 'total') {
      valA = (a.base_imposable || 0) + (a.quota_iva || 0);
      valB = (b.base_imposable || 0) + (b.quota_iva || 0);
    }

    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    const modifier = sortDirection === 'asc' ? 1 : -1;

    if (typeof valA === 'string') {
      return valA.localeCompare(valB) * modifier;
    }

    return (valA < valB ? -1 : 1) * modifier;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIndicator = ({ field }: { field: string }) => {
    if (sortField !== field) return <div className="w-4" />;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const handleSaveEdit = async (updatedData: Partial<Record>) => {
    if (!selectedRecord) return;
    try {
      const { error: sbError } = await supabase
        .from('records')
        .update(updatedData)
        .eq('id', selectedRecord.id);

      if (sbError) throw sbError;

      setToast({ msg: 'Petició actualitzada correctament', type: 'success' });
      setSelectedRecord(null);
      fetchRecords();
    } catch (err: any) {
      setToast({ msg: err.message, type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmRecord) return;
    try {
      const { error: sbError } = await supabase
        .from('records')
        .delete()
        .eq('id', deleteConfirmRecord.id);

      if (sbError) throw sbError;

      setToast({ msg: `La petició #${deleteConfirmRecord.id} ha estat eliminada correctament.`, type: 'success' });
      setDeleteConfirmRecord(null);
      setRecords(records.filter(r => r.id !== deleteConfirmRecord.id));
    } catch (err: any) {
      setToast({ msg: err.message, type: 'error' });
    }
  };

  const getSistemaBadge = (record: Record) => {
    const sistema = record.sistema_tramitacio;

    let badge;
    if (!sistema) {
      badge = <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border border-slate-200">Sense assignar</span>;
    } else {
      let colorClass = '';
      switch (sistema) {
        case 'D': colorClass = 'bg-blue-100 text-blue-800 border-blue-200'; break;
        case 'AD': colorClass = 'bg-indigo-100 text-indigo-800 border-indigo-200'; break;
        case 'ADO': colorClass = 'bg-purple-100 text-purple-800 border-purple-200'; break;
        case 'OFI': colorClass = 'bg-teal-100 text-teal-800 border-teal-200'; break;
        case 'REC': colorClass = 'bg-orange-100 text-orange-800 border-orange-200'; break;
        case 'CF': colorClass = 'bg-green-100 text-green-800 border-green-200'; break;
        case 'R. Patrimonial': colorClass = 'bg-red-100 text-red-800 border-red-200'; break;
        default: colorClass = 'bg-slate-100 text-slate-800 border-slate-200';
      }
      badge = <span className={`px-2 py-1 rounded text-xs font-bold border ${colorClass}`}>{sistema}</span>;
    }

    return (
      <div className="flex flex-col items-center gap-1">
        {badge}
      </div>
    );
  };

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

  const showResponsableColumn = filterResponsable === '' && filterOrgan === '';

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`absolute top-4 right-4 z-50 p-4 rounded-md shadow-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{toast.msg}</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Eliminar registre</h3>
            <p className="text-slate-600 mb-6">
              Estàs segur que vols eliminar la petició #{deleteConfirmRecord.id}? Aquesta acció no es pot desfer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  const rec = deleteConfirmRecord;
                  setDeleteConfirmRecord(null);
                  setSelectedRecord(rec);
                  setModalMode('edit');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancel·lar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 transition-colors shadow-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

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
        absolute md:relative z-20 md:z-0 w-72 h-full bg-bg-light border-r border-border-light shadow-sm flex flex-col
      `}>
        <div className="p-4 border-b border-border-light flex justify-between items-center bg-bg-light">
          <h2 className="font-bold text-primary flex items-center gap-2">
            <Filter size={18} /> Filtres
          </h2>
          <button className="md:hidden text-text-secondary hover:text-text-primary" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          {/* Global Search */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-text-secondary" />
              </div>
              <input
                type="text"
                placeholder="Cercar per text..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-border-light rounded-md focus:ring-1 focus:ring-primary outline-none text-sm"
              />
            </div>
          </div>

          {/* Període */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Període</label>
            <div className="flex flex-col gap-2">
              <div className="w-full">
                <label className="block text-[10px] text-text-secondary uppercase mb-1">Des de</label>
                <input
                  type="date"
                  value={filterDataInici}
                  onChange={(e) => setFilterDataInici(e.target.value)}
                  className="w-full text-sm px-2 py-1.5 border border-border-light rounded-md focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
              <div className="w-full">
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

          {/* Tipus de contracte */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Tipus de contracte</label>
            <div className="space-y-1">
              {['Subministrament', 'Servei', 'Obra'].map(tipus => {
                const isChecked = filterTipusContracte.includes(tipus);
                return (
                  <label
                    key={tipus}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors border-l-2 ${isChecked ? 'bg-primary-light border-primary' : 'border-transparent hover:bg-slate-100'}`}
                  >
                    <input
                      type="checkbox"
                      className="rounded border-border-light text-primary focus:ring-primary"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilterTipusContracte([...filterTipusContracte, tipus]);
                        } else {
                          setFilterTipusContracte(filterTipusContracte.filter(t => t !== tipus));
                        }
                      }}
                    />
                    <span className="text-sm text-text-primary">{tipus}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Responsable del contracte</label>
            <select
              value={filterResponsable}
              onChange={(e) => setFilterResponsable(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-border-light rounded-md focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Tots</option>
              {RESPONSABLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Òrgan de contractació</label>
            <select
              value={filterOrgan}
              onChange={(e) => setFilterOrgan(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-border-light rounded-md focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Tots</option>
              {ORGANS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Sistema de tramitació</label>
            <select
              value={filterSistema}
              onChange={(e) => setFilterSistema(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-border-light rounded-md focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Tots</option>
              <option value="Sense assignar">Sense assignar</option>
              {SISTEMES_TRAMITACIO.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-border-light bg-bg-light">
          <button
            onClick={handleClearFilters}
            className="w-full py-2 px-4 bg-white border border-border-light text-text-primary rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Netejar filtres
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border-light bg-white flex justify-between items-center">
          <h1 className="text-xl font-bold text-text-primary">Control de sol·licituds</h1>
          <span className="bg-primary-light text-primary-dark text-xs font-semibold px-2.5 py-0.5 rounded-full">
            Total: {sortedRecords.length} registres
          </span>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center text-danger p-8 bg-white rounded-lg shadow-sm border border-red-100">
              <AlertCircle className="mx-auto mb-2" size={32} />
              <p>{error}</p>
            </div>
          ) : sortedRecords.length === 0 ? (
            <div className="text-center text-text-secondary p-12 bg-white rounded-lg shadow-sm border border-border-light flex flex-col items-center">
              <FileText size={48} className="text-slate-300 mb-4" />
              <p className="text-lg font-medium text-text-primary">No s'han trobat peticions</p>
              <p className="text-sm mt-1">Prova de canviar els filtres o crea una nova petició.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-border-light overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border-light">
                  <thead className="bg-primary sticky top-0 z-10">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-colors whitespace-nowrap"
                        onClick={() => handleSort('hora')}
                      >
                        <div className="flex items-center gap-1">
                          DATA <SortIndicator field="hora" />
                        </div>
                      </th>
                      {showResponsableColumn && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-colors whitespace-nowrap"
                          onClick={() => handleSort('responsable_contracte')}
                        >
                          <div className="flex items-center gap-1">
                            Responsable <SortIndicator field="responsable_contracte" />
                          </div>
                        </th>
                      )}
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-colors w-full"
                        onClick={() => handleSort('objecte_contracte')}
                      >
                        <div className="flex items-center gap-1">
                          Objecte del contracte <SortIndicator field="objecte_contracte" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-colors whitespace-nowrap"
                        onClick={() => handleSort('total')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Total (amb IVA) <SortIndicator field="total" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-colors whitespace-nowrap"
                        onClick={() => handleSort('sistema_tramitacio')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Sistema <SortIndicator field="sistema_tramitacio" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-colors whitespace-nowrap"
                        onClick={() => handleSort('reg_factura')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Reg. Factura <SortIndicator field="reg_factura" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-colors whitespace-nowrap"
                        onClick={() => handleSort('relacio_q')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Relació Q <SortIndicator field="relacio_q" />
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Estat</th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Accions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border-light">
                    {sortedRecords.map((record) => {
                      const isPublicat = record.publicat === true;
                      const isFinalitzat = record.finalitzat === true;

                      return (
                        <tr key={record.id} className="hover:bg-primary-light transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">{formatDate(record.hora)}</td>
                          {showResponsableColumn && (
                            <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap" title={record.responsable_contracte}>{record.responsable_contracte}</td>
                          )}
                          <td className="px-4 py-3 text-sm text-text-secondary w-full" title={record.objecte_contracte}>
                            <div className="line-clamp-2 min-w-[200px] break-words">
                              {record.objecte_contracte}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary text-right font-medium">{formatCurrency(record.base_imposable + record.quota_iva)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            {getSistemaBadge(record)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-text-secondary font-medium">
                            {record.reg_factura || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-text-secondary font-medium">
                            {record.relacio_q || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            <div className="flex justify-center gap-1 items-center">
                              {!isPublicat && !isFinalitzat && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  No finalitzat
                                </span>
                              )}
                              {isPublicat && !isFinalitzat && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                  Publicat
                                </span>
                              )}
                              {!isPublicat && isFinalitzat && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  Finalitzat
                                </span>
                              )}
                              {isPublicat && isFinalitzat && (
                                <>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    Publicat
                                  </span>
                                  {' '}
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    Finalitzat
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-center">
                            <div className="flex items-center justify-center gap-2">
                              {['AD', 'ADO', 'OFI'].includes(record.sistema_tramitacio) && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const { generateInforme } = await import('../utils/generateInforme');
                                      await generateInforme(record);
                                    } catch (err: any) {
                                      alert(err.message);
                                    }
                                  }}
                                  className="flex items-center justify-center w-[28px] h-[28px] rounded hover:bg-slate-100 text-[#0072BC] transition-colors"
                                  title="Descarregar informe"
                                >
                                  <FileDown size={18} />
                                </button>
                              )}

                              <button
                                onClick={() => { setSelectedRecord(record); setModalMode(user.role === 'Gestió' || user.role === 'Administrador' ? 'edit' : 'view'); }}
                                className="flex items-center justify-center w-[28px] h-[28px] rounded hover:bg-slate-100 text-[#0072BC] transition-colors"
                                title="Veure detalls"
                              >
                                <Eye size={18} />
                              </button>

                              {record.segex && (
                                <a
                                  href={`https://imas.secimallorca.net/segex/expediente.aspx?id=${record.segex.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#5B21B6] hover:bg-[#DDD6FE] transition-colors"
                                  title="Obrir expedient SEGEX"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {record.segex}
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {selectedRecord && (
        <EditModal
          record={selectedRecord}
          mode={modalMode}
          user={user}
          onClose={() => setSelectedRecord(null)}
          onSave={handleSaveEdit}
          onDeleteRequest={() => {
            setDeleteConfirmRecord(selectedRecord);
            setSelectedRecord(null);
          }}
        />
      )}
    </div>
  );
}
