'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  Wrench, 
  Search, 
  Trash2, 
  Calendar, 
  User, 
  Tag, 
  Info,
  ThermometerSnowflake 
} from 'lucide-react';
import Link from 'next/link';

interface Maintenance {
  id: string;
  equipamentoId: string;
  dataManutencao: string;
  servicoRealizado: string;
  descricao: string;
  pecaTrocada?: string;
  quantidade: number;
  tecnicoNome: string;
  tecnicoAssinatura: string;
  contratanteNome: string;
  contratanteAssinatura: string;
  observacoes?: string;
  criadoEm: string;
  equipamento: {
    codigoInterno: string;
    marca: string;
    modelo: string;
    localInstalacao: string;
  };
  fotos: any[];
}

export default function MaintenanceLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterService, setFilterService] = useState('ALL');
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get('/maintenance');
      setLogs(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar logs de manutenção.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover este registro de manutenção? Esta ação é auditada e marcará o registro como excluído permanentemente.')) {
      return;
    }
    try {
      await ApiClient.delete(`/maintenance/${id}`);
      fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir manutenção.');
    }
  };

  // Filter logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.tecnicoNome.toLowerCase().includes(search.toLowerCase()) ||
      log.contratanteNome.toLowerCase().includes(search.toLowerCase()) ||
      log.descricao.toLowerCase().includes(search.toLowerCase()) ||
      log.equipamento.codigoInterno.toLowerCase().includes(search.toLowerCase()) ||
      (log.pecaTrocada && log.pecaTrocada.toLowerCase().includes(search.toLowerCase()));

    const matchesService = filterService === 'ALL' || log.servicoRealizado === filterService;

    return matchesSearch && matchesService;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Manutenções</h2>
        <p className="text-slate-400 text-sm mt-1">Histórico completo de serviços de climatização realizados</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        <div className="flex-1 flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl focus-within:border-blue-500 transition-colors">
          <Search size={18} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por técnico, cliente, descrição, peça, código de ar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-slate-200 placeholder-slate-600 text-sm"
          />
        </div>

        <select
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="bg-slate-950/85 border border-slate-800 px-4 py-2.5 rounded-xl text-slate-300 text-sm outline-none focus:border-blue-500 transition-colors"
        >
          <option value="ALL">Todos os Serviços</option>
          <option value="Instalação">Instalação</option>
          <option value="Limpeza Preventiva">Limpeza Preventiva</option>
          <option value="Higienização Completa">Higienização Completa</option>
          <option value="Manutenção Preventiva">Manutenção Preventiva</option>
          <option value="Manutenção Corretiva">Manutenção Corretiva</option>
          <option value="Troca de Componente">Troca de Componente</option>
          <option value="Carga de Gás">Carga de Gás</option>
        </select>
      </div>

      {/* Listings table */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            Buscando logs de manutenção...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            Nenhum registro de manutenção localizado.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-slate-800/10 transition-colors flex flex-col md:flex-row justify-between gap-6 items-start">
                
                {/* Left side: Main details */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center flex-wrap gap-2.5">
                    <span className="bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold px-2.5 py-1 rounded-lg text-xs">
                      {log.servicoRealizado}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Calendar size={14} />
                      {new Date(log.dataManutencao).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <User size={14} />
                      Téc: <span className="text-slate-300 font-semibold">{log.tecnicoNome}</span>
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Tag size={14} />
                      Equipamento: 
                      <Link 
                        href={`/equipamentos?id=${log.equipamentoId}`}
                        className="text-blue-400 hover:underline font-bold"
                      >
                        {log.equipamento.codigoInterno}
                      </Link>
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-200 text-sm">
                    {log.equipamento.marca} {log.equipamento.modelo} &bull; <span className="text-slate-400 font-normal">{log.equipamento.localInstalacao}</span>
                  </h3>

                  <p className="text-slate-400 text-xs leading-relaxed max-w-4xl">
                    {log.descricao}
                  </p>

                  {/* Parts replaced & Notes details */}
                  <div className="flex flex-wrap gap-4 text-[11px] pt-1">
                    {log.pecaTrocada && (
                      <div className="text-amber-400 font-semibold bg-amber-500/5 px-2.5 py-1 rounded-md border border-amber-500/10 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Peça trocada: {log.pecaTrocada} ({log.quantidade} un)
                      </div>
                    )}
                    {log.observacoes && (
                      <div className="text-slate-400 flex items-start gap-1">
                        <Info size={14} className="text-slate-500 shrink-0 mt-0.5" />
                        <span className="italic">"{log.observacoes}"</span>
                      </div>
                    )}
                  </div>

                  {/* Photos list */}
                  {log.fotos && log.fotos.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {log.fotos.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setActiveImageUrl(f.arquivo)}
                          className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <img src={f.arquivo} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[7px] font-black text-slate-200">
                            {f.tipo}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right side: signatures & action delete */}
                <div className="flex flex-col md:items-end justify-between self-stretch shrink-0 gap-4">
                  {/* Signatures indicators */}
                  <div className="flex gap-4">
                    {/* Tech Signature */}
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1.5">Ass. Técnico</p>
                      <button
                        onClick={() => setActiveImageUrl(log.tecnicoAssinatura)}
                        className="w-24 h-10 border border-slate-800 rounded bg-slate-950 p-1 flex items-center justify-center cursor-pointer hover:border-slate-700 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <img src={log.tecnicoAssinatura} className="max-w-full max-h-full opacity-90" />
                      </button>
                    </div>

                    {/* Client Signature */}
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1.5">Ass. Cliente</p>
                      <button
                        onClick={() => setActiveImageUrl(log.contratanteAssinatura)}
                        className="w-24 h-10 border border-slate-800 rounded bg-slate-950 p-1 flex items-center justify-center cursor-pointer hover:border-slate-700 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <img src={log.contratanteAssinatura} className="max-w-full max-h-full opacity-90" />
                      </button>
                    </div>
                  </div>

                  {/* Delete button (Admins only) */}
                  {user?.perfil === 'ADMIN' && (
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 transition-colors self-start md:self-end cursor-pointer"
                    >
                      <Trash2 size={14} />
                      Excluir Registro
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activeImageUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setActiveImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center">
            <img 
              src={activeImageUrl} 
              className="max-w-full max-h-[85vh] object-contain rounded-xl bg-slate-950 shadow-2xl" 
              onClick={(e) => e.stopPropagation()} 
            />
            <button 
              className="absolute top-4 right-4 text-white hover:text-slate-300 font-bold text-lg bg-black/40 hover:bg-black/60 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
              onClick={() => setActiveImageUrl(null)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
