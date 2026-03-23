import React, { useState, useEffect } from 'react';
import { Contract, ContractLot, User, CONTRACTE_TIPUS, CONTRACTE_ORGANS, CENTRES_IMAS } from '../types';
import {
  Filter, X, Eye, CheckCircle2, AlertCircle, Search,
  ClipboardList, ChevronUp, ChevronDown, FileDown, Trash2, Plus
} from 'lucide-react';
import { ContractEditModal } from '../components/ContractEditModal';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

interface ContractDashboardViewProps {
  user: User;
  onNavigate: (view: 'form' | 'dashboard' | 'users' | 'notifications' | 'contract-form' | 'contract-dashboard') => void;
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  try {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return d;
  }
}

// Compute effective start/end from lots
function getContractDates(lots: ContractLot[]) {
  let earliest: string | null = null;
  let latest: string | null = null;

  lots.forEach((lot) => {
    const start = lot.data_inici;
    const end = lot.data_fi_proroga || lot.data_fi;

    if (start) {
      if (!earliest || start < earliest) earliest = start;
    }
    if (end) {
      if (!latest || end > latest) latest = end;
    }
  });

  return { dataInici: earliest, dataFi: latest };
}

export function ContractDashboardView({ user, onNavigate }: ContractDashboardViewProps) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterTipus, setFilterTipus] = useState<string>('');
  const [filterOrgan, setFilterOrgan] = useState('');
  const [filterDataInici, setFilterDataInici] = useState('');
  const [filterDataFi, setFilterDataFi] = useState('');
  const [filterVigents, setFilterVigents] = useState(true);
  const [filterCentres, setFilterCentres] = useState<string[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Contract | null>(null);

  // Sort
  const [sortField, setSortField] = useState('data_inici');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const isAdmin = user.role === 'Administrador';

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const { data: contractsData, error: cErr } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });
      if (cErr) throw cErr;

      const { data: lotsData, error: lErr } = await supabase
        .from('contract_lots')
        .select('*');
      if (lErr) throw lErr;

      const enriched = (contractsData as Contract[]).map((c) => ({
        ...c,
        lots: (lotsData as ContractLot[]).filter((l) => l.contract_id === c.id),
      }));
      setContracts(enriched);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContracts(); }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleClearFilters = () => {
    setFilterSearch(''); setFilterTipus(''); setFilterOrgan('');
    setFilterDataInici(''); setFilterDataFi(''); setFilterCentres([]);
    setFilterVigents(true);
  };

  const filtered = contracts.filter((c) => {
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      const lots = c.lots || [];
      const adjudicataris = lots.map((l) => l.adjudicatari || '').join(' ').toLowerCase();
      const match =
        (c.nom_contracte || '').toLowerCase().includes(q) ||
        (c.organ_contractacio || '').toLowerCase().includes(q) ||
        (c.segex || '').toLowerCase().includes(q) ||
        (c.responsable_contracte || '').toLowerCase().includes(q) ||
        adjudicataris.includes(q);
      if (!match) return false;
    }
    if (filterTipus && c.tipus_contracte !== filterTipus) return false;
    if (filterOrgan && c.organ_contractacio !== filterOrgan) return false;
    if (filterCentres.length > 0) {
      const lots = c.lots || [];
      const allCentresRaw = lots.flatMap((l) => {
        if (!l.centres) return [];
        if (typeof l.centres === 'string') {
          try { return JSON.parse(l.centres); } catch { return [l.centres]; }
        }
        return Array.isArray(l.centres) ? l.centres : [l.centres];
      });
      const allCentresMerged = allCentresRaw.join(' | ');
      const hasMatch = filterCentres.some((fc) => allCentresMerged.includes(fc));
      if (!hasMatch) return false;
    }
    if (filterDataInici || filterDataFi) {
      const { dataInici } = getContractDates(c.lots || []);
      if (!dataInici) return false;
      if (filterDataInici && dataInici < filterDataInici) return false;
      if (filterDataFi && dataInici > filterDataFi) return false;
    }
    if (filterVigents) {
      const { dataFi } = getContractDates(c.lots || []);
      if (dataFi) {
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (dataFi < today) return false;
      }
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const mod = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'data_inici') {
      const aD = getContractDates(a.lots || []).dataInici || '';
      const bD = getContractDates(b.lots || []).dataInici || '';
      return aD.localeCompare(bD) * mod;
    }
    if (sortField === 'data_fi') {
      const aD = getContractDates(a.lots || []).dataFi || '';
      const bD = getContractDates(b.lots || []).dataFi || '';
      return aD.localeCompare(bD) * mod;
    }
    const va: any = (a as any)[sortField] ?? '';
    const vb: any = (b as any)[sortField] ?? '';
    if (typeof va === 'string') return va.localeCompare(vb) * mod;
    return (va < vb ? -1 : 1) * mod;
  });

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIndicator = ({ field }: { field: string }) => {
    if (sortField !== field) return <div className="w-4" />;
    return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const handleSaveEdit = async (updated: Partial<Contract>, updatedLots: ContractLot[]) => {
    if (!selectedContract) return;

    const { error: upErr } = await supabase
      .from('contracts')
      .update(updated)
      .eq('id', selectedContract.id);
    if (upErr) throw upErr;

    // Delete all lots and re-insert
    const { error: delErr } = await supabase
      .from('contract_lots')
      .delete()
      .eq('contract_id', selectedContract.id);
    if (delErr) throw delErr;

    if (updatedLots.length > 0) {
      const lotsToInsert = updatedLots.map((l) => ({
        contract_id: selectedContract.id,
        nom_lot: l.nom_lot,
        cpv: l.cpv || null,
        adjudicatari: l.adjudicatari || null,
        import_comes: l.import_comes ?? null,
        data_inici: l.data_inici || null,
        data_fi: l.data_fi || null,
        data_limit_comunicacio_proroga: l.data_limit_comunicacio_proroga || null,
        data_inici_proroga: l.data_inici_proroga || null,
        data_fi_proroga: l.data_fi_proroga || null,
        centres: l.centres,
      }));
      const { error: insErr } = await supabase.from('contract_lots').insert(lotsToInsert);
      if (insErr) throw insErr;
    }

    setToast({ msg: 'Contracte actualitzat correctament', type: 'success' });
    setSelectedContract(null);
    fetchContracts();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const { error: err } = await supabase.from('contracts').delete().eq('id', deleteConfirm.id);
      if (err) throw err;
      setToast({ msg: `Contracte "${deleteConfirm.nom_contracte}" eliminat.`, type: 'success' });
      setDeleteConfirm(null);
      setContracts((prev) => prev.filter((c) => c.id !== deleteConfirm.id));
    } catch (err: any) {
      setToast({ msg: err.message, type: 'error' });
    }
  };

  const handleExportExcel = () => {
    if (sorted.length === 0) { setToast({ msg: 'No hi ha dades per exportar.', type: 'error' }); return; }
    const rows = sorted.map((c) => {
      const { dataInici, dataFi } = getContractDates(c.lots || []);
      return {
        'NOM CONTRACTE': c.nom_contracte,
        'TIPUS': c.tipus_contracte,
        "ÒRGAN DE CONTRACTACIÓ": c.organ_contractacio,
        'RESPONSABLE': c.responsable_contracte,
        'PROCEDIMENT': c.procediment_adjudicacio || '',
        'DOSSIER': c.dossier || '',
        'SEGEX': c.segex || '',
        'DATA INICI': dataInici ? formatDate(dataInici) : '',
        'DATA FI': dataFi ? formatDate(dataFi) : '',
        'PRORROGABLE': c.prorrogable ? 'Sí' : 'No',
        'PRÒRROGUES': c.prorrogues || '',
        'MODIFICABLE': c.modificable ? 'Sí' : 'No',
        'MODIFICAT': c.modificat || '',
        'DURACIÓ INICIAL': c.duracio_inicial || '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contractes');
    XLSX.writeFile(wb, `Contractes_${new Date().toISOString().split('T')[0]}.xlsx`);
    setToast({ msg: 'Arxiu Excel generat correctament.', type: 'success' });
  };

  const BoolBadge = ({ value }: { value: boolean }) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${value ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
      {value ? 'Sí' : 'No'}
    </span>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative">
      {/* Toast */}
      {toast && (
        <div className={`absolute top-4 right-4 z-50 p-4 rounded-md shadow-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm font-medium">{toast.msg}</p>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Eliminar contracte</h3>
            <p className="text-slate-600 mb-6">
              Estàs segur que vols eliminar el contracte <strong>"{deleteConfirm.nom_contracte}"</strong>? Aquesta acció no es pot desfer i s'eliminaran tots els lots associats.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">
                Cancel·lar
              </button>
              <button onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile filter toggle */}
      <button className="md:hidden absolute bottom-4 right-4 z-30 bg-blue-900 text-white p-3 rounded-full shadow-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        <Filter size={24} />
      </button>

      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 absolute md:relative z-20 md:z-0 w-72 h-full bg-bg-light border-r border-border-light shadow-sm flex flex-col`}>
        <div className="p-4 border-b border-border-light flex justify-between items-center bg-bg-light">
          <h2 className="font-bold text-primary flex items-center gap-2"><Filter size={18} /> Filtres</h2>
          <button className="md:hidden text-text-secondary" onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-5">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-text-secondary" />
            </div>
            <input type="text" placeholder="Cercar per text..." value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-border-light rounded-md focus:ring-1 focus:ring-primary outline-none text-sm" />
          </div>

          {/* Període */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Període (data inici)</label>
            <div className="flex flex-col gap-2">
              <div>
                <label className="block text-[10px] text-text-secondary uppercase mb-1">Des de</label>
                <input type="date" value={filterDataInici} onChange={(e) => setFilterDataInici(e.target.value)}
                  className="w-full text-sm px-2 py-1.5 border border-border-light rounded-md focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-[10px] text-text-secondary uppercase mb-1">Fins a</label>
                <input type="date" value={filterDataFi} onChange={(e) => setFilterDataFi(e.target.value)}
                  className="w-full text-sm px-2 py-1.5 border border-border-light rounded-md focus:ring-1 focus:ring-primary outline-none" />
              </div>
            </div>
            <label className={`flex items-center gap-2 mt-3 p-2 rounded cursor-pointer border-l-2 transition-colors ${filterVigents ? 'bg-primary-light border-primary' : 'border-transparent hover:bg-slate-100'}`}>
              <input type="checkbox" checked={filterVigents} onChange={(e) => setFilterVigents(e.target.checked)} className="rounded border-border-light text-primary" />
              <span className="text-sm text-text-primary">Veure contractes vigents</span>
            </label>
          </div>

          {/* Tipus */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Tipus de contracte</label>
            <select value={filterTipus} onChange={(e) => setFilterTipus(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-border-light rounded-md focus:ring-1 focus:ring-primary outline-none">
              <option value="">Tots</option>
              {CONTRACTE_TIPUS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Òrgan */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Òrgan de contractació</label>
            <select value={filterOrgan} onChange={(e) => setFilterOrgan(e.target.value)}
              className="w-full text-sm px-3 py-2 border border-border-light rounded-md focus:ring-1 focus:ring-primary outline-none">
              <option value="">Tots</option>
              {CONTRACTE_ORGANS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Centres */}
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Centres</label>
            <div className="space-y-1">
              {CENTRES_IMAS.map((centre) => {
                const checked = filterCentres.includes(centre);
                return (
                  <label key={centre} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer border-l-2 transition-colors text-xs ${checked ? 'bg-primary-light border-primary' : 'border-transparent hover:bg-slate-100'}`}>
                    <input type="checkbox" checked={checked} className="rounded border-border-light text-primary"
                      onChange={(e) => {
                        if (e.target.checked) setFilterCentres([...filterCentres, centre]);
                        else setFilterCentres(filterCentres.filter((x) => x !== centre));
                      }} />
                    <span className="text-text-primary">{centre}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border-light bg-bg-light space-y-2">
          <button onClick={handleClearFilters}
            className="w-full py-2 px-4 bg-white border border-border-light text-text-primary rounded-md text-sm font-medium hover:bg-slate-50">
            Netejar filtres
          </button>
          <button onClick={handleExportExcel}
            className="w-full py-2 px-4 bg-green-600 border border-transparent text-white rounded-md text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2">
            <FileDown size={18} /> Descarregar Excel
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-border-light bg-white flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-text-primary">Control de contractes</h1>
            {isAdmin && (
              <button
                onClick={() => onNavigate('contract-form')}
                className="flex items-center gap-2 px-4 py-2 bg-[#0072BC] hover:bg-[#005a96] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                <Plus size={18} />
                Nou contracte
              </button>
            )}
          </div>
          <span className="bg-primary-light text-primary-dark text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap">
            Total: {sorted.length} registres
          </span>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="text-center text-danger p-8 bg-white rounded-lg shadow-sm border border-red-100">
              <AlertCircle className="mx-auto mb-2" size={32} /><p>{error}</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="text-center text-text-secondary p-12 bg-white rounded-lg shadow-sm border border-border-light flex flex-col items-center">
              <ClipboardList size={48} className="text-slate-300 mb-4" />
              <p className="text-lg font-medium text-text-primary">No s'han trobat contractes</p>
              <p className="text-sm mt-1">Prova de canviar els filtres o crea un nou contracte.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-border-light overflow-hidden">
              <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-border-light relative">
                  <thead className="bg-primary sticky top-0 z-20">
                    <tr>
                      {[
                        { field: 'data_inici', label: 'Data inici', align: 'left' },
                        { field: 'data_fi', label: 'Data fi', align: 'left' },
                        { field: 'nom_contracte', label: 'Nom del contracte', align: 'left' },
                        { field: 'organ_contractacio', label: 'Òrgan', align: 'left' },
                        { field: 'prorrogable', label: 'Prorrogable', align: 'center' },
                        { field: 'modificable', label: 'Modificable', align: 'center' },
                      ].map(({ field, label, align }) => (
                        <th key={field} scope="col"
                          className={`px-4 py-3 text-${align} text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-primary-dark transition-colors whitespace-nowrap`}
                          onClick={() => handleSort(field)}>
                          <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : ''}`}>
                            {label} <SortIndicator field={field} />
                          </div>
                        </th>
                      ))}
                      <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">
                        Accions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-border-light">
                    {sorted.map((contract) => {
                      const { dataInici, dataFi } = getContractDates(contract.lots || []);
                      return (
                        <tr key={contract.id} className="hover:bg-primary-light transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                            {formatDate(dataInici)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-text-secondary">
                            {formatDate(dataFi)}
                          </td>
                          <td className="px-4 py-3 text-sm text-text-primary font-medium w-full">
                            <div className="line-clamp-2 min-w-[200px]">{contract.nom_contracte}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                            {contract.organ_contractacio}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <BoolBadge value={contract.prorrogable} />
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <BoolBadge value={contract.modificable} />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-center">
                            <div className="flex items-center justify-center gap-2">
                              {contract.segex && (
                                <a
                                  href={`https://imas.secimallorca.net/segex/expediente.aspx?id=${contract.segex.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EDE9FE] text-[#5B21B6] hover:bg-[#DDD6FE] transition-colors"
                                  title="Obrir expedient SEGEX"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {contract.segex}
                                </a>
                              )}
                              <button
                                onClick={() => setSelectedContract(contract)}
                                className="flex items-center justify-center w-[28px] h-[28px] rounded hover:bg-slate-100 text-[#0072BC] transition-colors"
                                title="Veure / Editar">
                                <Eye size={18} />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => setDeleteConfirm(contract)}
                                  className="flex items-center justify-center w-[28px] h-[28px] rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                  title="Eliminar contracte">
                                  <Trash2 size={18} />
                                </button>
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
      {selectedContract && (
        <ContractEditModal
          contract={selectedContract}
          user={user}
          onClose={() => setSelectedContract(null)}
          onSave={handleSaveEdit}
          onDeleteRequest={() => {
            setDeleteConfirm(selectedContract);
            setSelectedContract(null);
          }}
        />
      )}
    </div>
  );
}
