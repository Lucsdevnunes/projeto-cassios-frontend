'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import {
  ScrollText,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Activity,
  Database,
  Globe,
  RefreshCw,
  X,
} from 'lucide-react';

interface AuditLog {
  id: string;
  usuarioId: string | null;
  acao: string;
  tabela: string;
  registroId: string;
  ip: string;
  dataHora: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    perfil: string;
  } | null;
}

interface AuditResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Map action codes to human-readable labels and colors
const ACTION_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  CREATE: { label: 'Criação', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  UPDATE: { label: 'Atualização', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  DELETE: { label: 'Exclusão', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  GENERATE_QRCODE: { label: 'Gerar QR Code', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  LOGIN: { label: 'Login', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  LOGOUT: { label: 'Logout', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  REFRESH_TOKEN: { label: 'Refresh Token', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
};

// Map table names to human-readable labels
const TABLE_MAP: Record<string, string> = {
  clientes: 'Estabelecimentos',
  equipamentos: 'Equipamentos',
  manutencoes: 'Manutenções',
  usuarios: 'Usuários',
  auth: 'Autenticação',
};

function getActionInfo(acao: string) {
  return ACTION_MAP[acao] || { label: acao, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
}

function getTableLabel(tabela: string) {
  return TABLE_MAP[tabela] || tabela;
}

export default function LogsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [filterUsuarioId, setFilterUsuarioId] = useState('');
  const [filterAcao, setFilterAcao] = useState('');
  const [filterTabela, setFilterTabela] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Users list for filter dropdown
  const [users, setUsers] = useState<{ id: string; nome: string; perfil: string }[]>([]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (filterUsuarioId) params.set('usuarioId', filterUsuarioId);
      if (filterAcao) params.set('acao', filterAcao);
      if (filterTabela) params.set('tabela', filterTabela);
      if (filterDataInicio) params.set('dataInicio', filterDataInicio);
      if (filterDataFim) params.set('dataFim', filterDataFim);

      const res = await ApiClient.get(`/audit?${params.toString()}`);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar logs de auditoria.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterUsuarioId, filterAcao, filterTabela, filterDataInicio, filterDataFim]);

  const fetchUsers = async () => {
    try {
      const res = await ApiClient.get('/users');
      setUsers(res);
    } catch {
      // Silently fail — filter just won't have user names
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const clearFilters = () => {
    setFilterUsuarioId('');
    setFilterAcao('');
    setFilterTabela('');
    setFilterDataInicio('');
    setFilterDataFim('');
    setPage(1);
  };

  const hasActiveFilters = filterUsuarioId || filterAcao || filterTabela || filterDataInicio || filterDataFim;

  if (user?.perfil !== 'ADMIN') {
    return (
      <div className="h-full flex flex-col items-center justify-center py-20">
        <p className="text-rose-400 text-sm font-medium">Acesso restrito ao administrador.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <div className="bg-violet-500/10 p-2.5 rounded-xl text-violet-400 border border-violet-500/20">
              <ScrollText size={24} />
            </div>
            Logs de Atividade
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Registro detalhado de todas as ações realizadas pelos usuários no sistema
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLogs()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50 text-sm font-medium transition-all duration-200 cursor-pointer"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border ${
              showFilters || hasActiveFilters
                ? 'bg-violet-600/20 text-violet-300 border-violet-500/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white border-slate-700/50'
            }`}
          >
            <Filter size={16} />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Search size={16} className="text-violet-400" />
              Filtrar Registros
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <X size={14} />
                Limpar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* User filter */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 tracking-wider block mb-1.5">USUÁRIO</label>
              <select
                value={filterUsuarioId}
                onChange={(e) => { setFilterUsuarioId(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-violet-500/50 focus:outline-none transition-colors"
              >
                <option value="">Todos</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.nome} ({u.perfil === 'ADMIN' ? 'Admin' : 'Técnico'})</option>
                ))}
              </select>
            </div>

            {/* Action filter */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 tracking-wider block mb-1.5">AÇÃO</label>
              <select
                value={filterAcao}
                onChange={(e) => { setFilterAcao(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-violet-500/50 focus:outline-none transition-colors"
              >
                <option value="">Todas</option>
                {Object.entries(ACTION_MAP).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Table filter */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 tracking-wider block mb-1.5">MÓDULO</label>
              <select
                value={filterTabela}
                onChange={(e) => { setFilterTabela(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-violet-500/50 focus:outline-none transition-colors"
              >
                <option value="">Todos</option>
                {Object.entries(TABLE_MAP).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Date start */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 tracking-wider block mb-1.5">DATA INÍCIO</label>
              <input
                type="date"
                value={filterDataInicio}
                onChange={(e) => { setFilterDataInicio(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-violet-500/50 focus:outline-none transition-colors"
              />
            </div>

            {/* Date end */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 tracking-wider block mb-1.5">DATA FIM</label>
              <input
                type="date"
                value={filterDataFim}
                onChange={(e) => { setFilterDataFim(e.target.value); setPage(1); }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-violet-500/50 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats summary */}
      {data && !loading && (
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Activity size={14} className="text-violet-400" />
            <strong className="text-slate-300">{data.total}</strong> registros encontrados
          </span>
          <span className="text-slate-700">•</span>
          <span>Página {data.page} de {data.totalPages}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-slate-400 text-sm">Carregando logs...</p>
        </div>
      )}

      {/* Table */}
      {!loading && data && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-400 tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} />
                      DATA / HORA
                    </span>
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-400 tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <User size={13} />
                      USUÁRIO
                    </span>
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-400 tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Activity size={13} />
                      AÇÃO
                    </span>
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-400 tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Database size={13} />
                      MÓDULO
                    </span>
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-400 tracking-wider">
                    ID REGISTRO
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-slate-400 tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Globe size={13} />
                      IP
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {data.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-500">
                      <ScrollText size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Nenhum registro encontrado</p>
                      <p className="text-xs mt-1">Tente ajustar os filtros de busca</p>
                    </td>
                  </tr>
                ) : (
                  data.data.map((log, index) => {
                    const actionInfo = getActionInfo(log.acao);
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-800/20 transition-colors duration-150"
                        style={{ animationDelay: `${index * 20}ms` }}
                      >
                        {/* Date */}
                        <td className="px-5 py-3.5">
                          <div className="text-slate-200 font-semibold text-xs">
                            {new Date(log.dataHora).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            {new Date(log.dataHora).toLocaleTimeString('pt-BR')}
                          </div>
                        </td>

                        {/* User */}
                        <td className="px-5 py-3.5">
                          {log.usuario ? (
                            <div>
                              <p className="text-slate-200 font-semibold text-xs">{log.usuario.nome}</p>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                                log.usuario.perfil === 'ADMIN'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {log.usuario.perfil === 'ADMIN' ? 'Admin' : 'Técnico'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs italic">Sistema</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${actionInfo.bg} ${actionInfo.color} ${actionInfo.border}`}>
                            {actionInfo.label}
                          </span>
                        </td>

                        {/* Table/Module */}
                        <td className="px-5 py-3.5">
                          <span className="text-slate-300 text-xs font-medium">
                            {getTableLabel(log.tabela)}
                          </span>
                        </td>

                        {/* Record ID */}
                        <td className="px-5 py-3.5">
                          <code className="text-[11px] text-slate-500 bg-slate-950 px-2 py-1 rounded font-mono truncate max-w-[140px] inline-block">
                            {log.registroId.substring(0, 8)}...
                          </code>
                        </td>

                        {/* IP */}
                        <td className="px-5 py-3.5">
                          <span className="text-slate-500 text-xs font-mono">{log.ip}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800/60 bg-slate-900/30">
              <p className="text-xs text-slate-500">
                Mostrando <strong className="text-slate-300">{((data.page - 1) * data.limit) + 1}</strong> a{' '}
                <strong className="text-slate-300">{Math.min(data.page * data.limit, data.total)}</strong> de{' '}
                <strong className="text-slate-300">{data.total}</strong> registros
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (data.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= data.totalPages - 2) {
                    pageNum = data.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        pageNum === page
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                  disabled={page >= data.totalPages}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
