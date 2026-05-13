import React, { useState, useEffect } from 'react';
import { Record, User, RESPONSABLES, ORGANS, SISTEMES_TRAMITACIO } from '../types';
import { Filter, X, Eye, CheckCircle2, AlertCircle, Search, FileText, ChevronUp, ChevronDown, FileDown, Plus, Megaphone } from 'lucide-react';
import { EditModal } from '../components/EditModal';
import { CpvDescription } from '../components/CpvDescription';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';
import { formatDate } from '../utils/contractHelpers';

interface DashboardViewProps {
  user: User;
  onNavigate: (view: 'form' | 'dashboard' | 'users' | 'notifications' | 'contract-form' | 'contract-dashboard') => void;
  pendingOpenPeticioId?: number | null;
  onPendingOpenHandled?: () => void;
}

export function DashboardView({ user, onNavigate, pendingOpenPeticioId, onPendingOpenHandled }: DashboardViewProps) {
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
  const [filterCapitolVI, setFilterCapitolVI] = useState(false);
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
        .select('*, factures(import_total)')
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
        setModalMode(user.role !== 'Lectura' ? 'edit' : 'view');
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
    setFilterCapitolVI(false);
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
        (r.partida_economica?.toLowerCase() || '').includes(searchLower) ||
        (r.num_rc?.toLowerCase() || '').includes(searchLower);
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

    if (filterCapitolVI && !(r.partida_economica?.startsWith('6'))) return false;

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

    if (sortField === 'credit_disponible') {
      const totalA = (a.base_imposable || 0) + (a.quota_iva || 0);
      const consumedA = (a.factures || []).reduce((acc, f) => acc + (Number(f.import_total) || 0), 0);
      valA = totalA - consumedA;

      const totalB = (b.base_imposable || 0) + (b.quota_iva || 0);
      const consumedB = (b.factures || []).reduce((acc, f) => acc + (Number(f.import_total) || 0), 0);
      valB = totalB - consumedB;
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

  const handleExportExcel = () => {
    try {
      if (sortedRecords.length === 0) {
        setToast({ msg: 'No hi ha dades per exportar.', type: 'error' });
        return;
      }

      const exportData = sortedRecords.map(record => {
        const isPublicat = record.publicat === true;
        const isFinalitzat = record.finalitzat === true;
        let estat = 'No finalitzat';
        if (isPublicat && !isFinalitzat) estat = 'Publicat';
        if (!isPublicat && isFinalitzat) estat = 'Finalitzat';
        if (isPublicat && isFinalitzat) estat = 'Publicat i Finalitzat';

        return {
          'ID': record.id,
          'DATA': formatDate(record.hora),
          'EMAIL PETICIONARI': record.email || '',
          'NOM PETICIONARI': record.nom || '',
          'RESPONSABLE': record.responsable_contracte || '',
          'CENTRE / SERVEI': record.centre_servei || '',
          'ÒRGAN DE CONTRACTACIÓ': record.organ_contractacio || '',
          'JUSTIFICACIÓ': record.justificacio || '',
          'OBJECTE DEL CONTRACTE': record.objecte_contracte || '',
          'CARACTERÍSTIQUES TÈCNIQUES': record.caracteristiques_tecniques || '',
          'TIPUS DE CONTRACTE': record.tipus_contracte || '',
          'TIPUS DE DESPESA': record.tipus_despesa || '',
          'TERMINI EXECUCIÓ (MESOS)': record.termini_execucio || 0,
          'CODI CPV': record.codi_cpv || '',
          'PARTIDA ORGÀNICA': record.partida_organica || '',
          'PARTIDA PROGRAMA': record.partida_programa || '',
          'PARTIDA ECONÒMICA': record.partida_economica || '',
          'Nº OPERACIÓ RC': record.num_rc || '',
          'PROJECTE DESPESA CAP. VI': record.projecte_despesa_cap_vi || '',
          'BASE IMPOSABLE': record.base_imposable || 0,
          'QUOTA IVA': record.quota_iva || 0,
          'TOTAL (BASE + IVA)': (record.base_imposable || 0) + (record.quota_iva || 0),
          'CRÈDIT DISPONIBLE': ((record.base_imposable || 0) + (record.quota_iva || 0)) - (record.factures || []).reduce((acc, f) => acc + (Number(f.import_total) || 0), 0),
          'ADJUDICATARI': record.adjudicatari || '',
          'NIF ADJUDICATARI': record.nif || '',
          'SISTEMA TRAMITACIÓ': record.sistema_tramitacio || 'Sense assignar',
          'SEGEX': record.segex || '',
          'RELACIÓ Q': record.relacio_q || '',
          'RELACIÓ O': record.relacio_o || '',
          'ESTAT': estat,
          'MOTIVACIÓ NO CONTRACTACIÓ': record.motivacio_no_contractacio || '',
          'EXPLICACIÓ NO CONTRACTACIÓ': record.explicacio_no_contractacio || '',
          'JUSTIFICACIÓ PREU': record.justificacio_preu || '',
          'EXPLICACIÓ DEL PREU': record.explicacio_preu || '',
          'TRAMITAT PER OFI DES DE': formatDate(record.data_ofi_inicial),
          'DETALLS ADDICIONALS': record.detalls_addicionals || '',
          'CREAT PER (UUID)': record.created_by || '',
          'ÚLTIMA ACTUALITZACIÓ': record.updated_at ? new Date(record.updated_at).toLocaleString('ca-ES') : ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);

      const colWidths = [
        { wch: 6 },  // ID
        { wch: 12 }, // DATA
        { wch: 25 }, // EMAIL
        { wch: 25 }, // NOM
        { wch: 40 }, // RESPONSABLE
        { wch: 30 }, // CENTRE / SERVEI
        { wch: 30 }, // ORGAN
        { wch: 50 }, // JUSTIFICACIÓ
        { wch: 60 }, // OBJECTE
        { wch: 60 }, // CARACTERISTIQUES
        { wch: 20 }, // TIPUS CONTRACTE
        { wch: 20 }, // TIPUS DESPESA
        { wch: 10 }, // TERMINI
        { wch: 15 }, // CPV
        { wch: 10 }, // ORGÀNICA
        { wch: 15 }, // PROGRAMA
        { wch: 15 }, // ECONÒMICA
        { wch: 15 }, // Nº OPERACIÓ RC
        { wch: 25 }, // CAP VI
        { wch: 15 }, // BASE
        { wch: 15 }, // IVA
        { wch: 15 }, // TOTAL
        { wch: 15 }, // CRÈDIT DISPONIBLE
        { wch: 30 }, // ADJUDICATARI
        { wch: 15 }, // NIF
        { wch: 20 }, // SISTEMA
        { wch: 15 }, // SEGEX
        { wch: 15 }, // RELACIÓ Q
        { wch: 15 }, // RELACIÓ O
        { wch: 20 }, // ESTAT
        { wch: 60 }, // MOTIVACIÓ
        { wch: 60 }, // JUSTIFICACIÓ PREU
        { wch: 15 }, // DATA OFI INICIAL
        { wch: 60 }, // DETALLS
        { wch: 36 }, // CREAT PER
        { wch: 20 }  // ACTUALITZAT
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sol·licituds");

      const fileName = `Sollicituds_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setToast({ msg: 'Arxiu Excel generat correctament.', type: 'success' });
    } catch (err: any) {
      setToast({ msg: 'Error al exportar a Excel: ' + err.message, type: 'error' });
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



  const showResponsableColumn = filterResponsable === '' && filterOrgan === '';

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative">
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
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Capitol VI</label>
            <label
              className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors border-l-2 ${filterCapitolVI ? 'bg-primary-light border-primary' : 'border-transparent hover:bg-slate-100'}`}
            >
              <input
                type="checkbox"
                className="rounded border-border-light text-primary focus:ring-primary"
                checked={filterCapitolVI}
                onChange={(e) => setFilterCapitolVI(e.target.checked)}
              />
              <span className="text-sm text-text-primary">Només inversions (capítol 6)</span>
            </label>
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

        <div className="p-4 border-t border-border-light bg-bg-light space-y-2">
          <button
            onClick={handleClearFilters}
            className="w-full py-2 px-4 bg-white border border-border-light text-text-primary rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Netejar filtres
          </button>
          <button
            onClick={handleExportExcel}
            className="w-full py-2 px-4 bg-green-600 border border-transparent text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <FileDown size={18} /> Descarregar Excel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border-light bg-white flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-text-primary">Control de sol·licituds</h1>
            {user.role !== 'Lectura' && (
              <button
                onClick={() => onNavigate('form')}
                className="flex items-center gap-2 px-4 py-2 bg-[#0072BC] hover:bg-[#005a96] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                <Plus size={18} />
                Nova sol·licitud
              </button>
            )}
          </div>
          <span className="bg-primary-light text-primary-dark text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap">
            Total: {sortedRecords.length} registres
          </span>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6">
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
            <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-border-light overflow-hidden">
              <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-border-light relative">
                  <thead className="bg-primary sticky top-0 z-20">
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
                          Crèdit Retingut <SortIndicator field="total" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-colors whitespace-nowrap"
                        onClick={() => handleSort('credit_disponible')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Crèdit disponible <SortIndicator field="credit_disponible" />
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
                        className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-colors w-[250px] max-w-[250px]"
                        onClick={() => handleSort('codi_cpv')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Codi CPV <SortIndicator field="codi_cpv" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-colors whitespace-nowrap"
                        onClick={() => handleSort('partida_economica')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          P. Econòmica <SortIndicator field="partida_economica" />
                        </div>
                      </th>
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap w-[280px] min-w-[280px]">Accions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border-light">
                    {sortedRecords.map((record) => {
                      const isPublicat = record.publicat === true;
                      const isFinalitzat = record.finalitzat === true;

                      const isSistemaOfiOrRec = record.sistema_tramitacio === 'OFI' || record.sistema_tramitacio === 'REC';
                      const totalAmbIva = (record.base_imposable || 0) + (record.quota_iva || 0);
                      const needsRedHighlight = isSistemaOfiOrRec && totalAmbIva >= 30000;

                      return (
                        <tr key={record.id} className={`${needsRedHighlight ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-primary-light'} transition-colors`}>
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-blue-700">
                            {formatCurrency((record.base_imposable + record.quota_iva) - (record.factures || []).reduce((acc, f) => acc + (Number(f.import_total) || 0), 0))}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                            {getSistemaBadge(record)}
                          </td>
                          <td className="px-4 py-3 text-sm text-center text-text-secondary font-medium w-[250px] max-w-[250px]">
                            <div className="font-bold mb-0.5">{record.codi_cpv || '-'}</div>
                            <CpvDescription code={record.codi_cpv} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-text-secondary font-medium">
                            {record.partida_economica || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-center">
                            <div className="flex items-center justify-center gap-1.5 min-w-[260px]">
                              {/* Slot 1: VI (Inversions) */}
                              <div className="w-8 flex justify-center">
                                {record.partida_economica && record.partida_economica.startsWith('6') && (
                                  <div
                                    className={`flex items-center justify-center min-w-[28px] px-1 h-[28px] rounded font-bold text-xs cursor-help ${record.projecte_despesa_cap_vi ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                    title={record.projecte_despesa_cap_vi ? `Projecte cap. VI: ${record.projecte_despesa_cap_vi}` : 'Falta projecte de despesa cap. VI'}
                                  >
                                    VI
                                  </div>
                                )}
                              </div>

                              {/* Slot 2: Megàfon (Comunicació OFI) */}
                              <div className="w-8 flex justify-center">
                                {record.sistema_tramitacio === 'OFI' && (() => {
                                  const isOfiComplete = !!record.adjudicatari && !!record.nif && !!record.segex;
                                  return (
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const { generateComunicacioOFI } = await import('../utils/generateInforme');
                                          await generateComunicacioOFI(record);
                                        } catch (err: any) {
                                          alert(err.message);
                                        }
                                      }}
                                      disabled={!isOfiComplete}
                                      className={`flex items-center justify-center w-[28px] h-[28px] rounded transition-colors ${
                                        isOfiComplete 
                                          ? 'text-green-600 hover:bg-green-50' 
                                          : 'text-red-600 cursor-not-allowed opacity-50'
                                      }`}
                                      title={isOfiComplete 
                                        ? "Descarregar comunicació OFI" 
                                        : "Falten camps Adjudicatari, NIF o SEGEX per descarregar la comunicació"}
                                    >
                                      <Megaphone size={18} />
                                    </button>
                                  );
                                })()}
                              </div>

                              {/* Slot 3: Fitxer (Descarregar informe) */}
                              <div className="w-8 flex justify-center">
                                {['AD', 'ADO', 'OFI', 'REC'].includes(record.sistema_tramitacio) && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
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
                              </div>

                              {/* Slot 4: Ull (Veure detalls) */}
                              <div className="w-8 flex justify-center">
                                <button
                                  onClick={(e) => { 
                                    e.stopPropagation();
                                    setSelectedRecord(record); 
                                    setModalMode(user.role !== 'Lectura' ? 'edit' : 'view'); 
                                  }}
                                  className="flex items-center justify-center w-[28px] h-[28px] rounded hover:bg-slate-100 text-[#0072BC] transition-colors"
                                  title="Veure detalls"
                                >
                                  <Eye size={18} />
                                </button>
                              </div>

                              {/* Slot 5: Número d'expedient (SEGEX) */}
                              <div className="flex-1 flex justify-start pl-2 min-w-[100px]">
                                {record.segex && (
                                  <a
                                    href={`https://imas.secimallorca.net/segex/expediente.aspx?id=${record.segex.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#5B21B6] hover:bg-[#DDD6FE] transition-colors whitespace-nowrap"
                                    title="Obrir expedient SEGEX"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {record.segex}
                                  </a>
                                )}
                              </div>
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

      {/* Toast Notification — z-60 to be above modal */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[60] p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="text-green-600" size={24} /> : <AlertCircle className="text-red-600" size={24} />}
          <p className="text-sm font-semibold pr-2">{toast.msg}</p>
        </div>
      )}
    </div>
  );
}
