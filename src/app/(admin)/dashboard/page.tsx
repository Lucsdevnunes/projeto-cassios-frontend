'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Tv, 
  Wrench, 
  AlertOctagon, 
  AlertTriangle, 
  Clock, 
  CalendarDays, 
  ArrowUpRight 
} from 'lucide-react';
import Link from 'next/link';

// Dynamically import Recharts to prevent hydration mismatch errors
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardData {
  summary: {
    totalEquipments: number;
    totalMaintenances: number;
    totalDelayed: number;
  };
  charts: {
    brands: { name: string; value: number }[];
    locations: { name: string; value: number }[];
    technicians: { name: string; value: number }[];
  };
  latestMaintenances: any[];
  alerts: {
    delayed3Months: any[];
    delayed6Months: any[];
    delayed12Months: any[];
    upcomingPreventives: any[];
  };
}

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [selectedAlertPeriod, setSelectedAlertPeriod] = useState<'3' | '6' | '12'>('6');

  useEffect(() => {
    if (user && user.perfil !== 'ADMIN') {
      router.replace('/equipamentos');
    }
  }, [user, router]);

  useEffect(() => {
    setIsMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get('/dashboard');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm">Carregando estatísticas...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
        {error || 'Não foi possível obter dados do dashboard.'}
      </div>
    );
  }

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Combine delayed lists for UI display
  const currentDelayedList = 
    selectedAlertPeriod === '3' 
      ? data.alerts.delayed3Months 
      : selectedAlertPeriod === '6' 
        ? data.alerts.delayed6Months 
        : data.alerts.delayed12Months;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">Visão geral e status operacional do sistema de climatização</p>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Equipments */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md flex items-center gap-5">
          <div className="bg-blue-500/10 p-3.5 rounded-xl text-blue-400 border border-blue-500/20 shadow-inner">
            <Tv size={26} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 tracking-wider block">EQUIPAMENTOS</span>
            <p className="text-3xl font-black text-white mt-1">{data.summary.totalEquipments}</p>
          </div>
        </div>

        {/* Total Maintenances */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md flex items-center gap-5">
          <div className="bg-emerald-500/10 p-3.5 rounded-xl text-emerald-400 border border-emerald-500/20 shadow-inner">
            <Wrench size={26} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 tracking-wider block">MANUTENÇÕES</span>
            <p className="text-3xl font-black text-white mt-1">{data.summary.totalMaintenances}</p>
          </div>
        </div>

        {/* Total Delayed Alert */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md flex items-center gap-5">
          <div className={`p-3.5 rounded-xl border shadow-inner ${
            data.summary.totalDelayed > 0 
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' 
              : 'bg-slate-800/50 text-slate-500 border-slate-800'
          }`}>
            <AlertOctagon size={26} />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 tracking-wider block">ATRASADOS (&gt;3 meses)</span>
            <p className="text-3xl font-black text-white mt-1">{data.summary.totalDelayed}</p>
          </div>
        </div>
      </div>

      {/* Chart Layout */}
      {isMounted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Equipments by Brand Chart */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md">
            <h3 className="text-base font-bold text-slate-200 mb-6">Equipamentos por Marca</h3>
            <div className="h-64">
              {data.charts.brands.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">Sem dados cadastrados</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.brands}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Technicians Contribution Chart */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md">
            <h3 className="text-base font-bold text-slate-200 mb-6">Serviços por Técnico</h3>
            <div className="h-64 flex flex-col md:flex-row items-center justify-around gap-6">
              {data.charts.technicians.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">Nenhum serviço registrado</div>
              ) : (
                <>
                  <div className="w-full md:w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.charts.technicians}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {data.charts.technicians.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legends */}
                  <div className="w-full md:w-1/2 space-y-2 max-h-56 overflow-y-auto">
                    {data.charts.technicians.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2 text-xs">
                        <div 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        ></div>
                        <span className="font-semibold text-slate-300 truncate max-w-[140px]">{entry.name}</span>
                        <span className="text-slate-500">({entry.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Section: Alerts & Latest Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Alerts panel (occupies 2 cols) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Preventives and Atrasos alerts card */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/60">
              <div>
                <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={18} />
                  Alertas de Manutenção Preventiva
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Equipamentos que necessitam de intervenção preventiva</p>
              </div>

              {/* Alert threshold toggles */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['3', '6', '12'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedAlertPeriod(period)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      selectedAlertPeriod === period
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    &gt; {period} meses
                  </button>
                ))}
              </div>
            </div>

            {/* List of delayed equipments */}
            {currentDelayedList.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm">
                Nenhum ar-condicionado atrasado no período selecionado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                      <th className="pb-3 font-semibold">Código</th>
                      <th className="pb-3 font-semibold">Modelo / Marca</th>
                      <th className="pb-3 font-semibold">Local de Instalação</th>
                      <th className="pb-3 font-semibold">Última Ação</th>
                      <th className="pb-3 font-semibold text-right">Período Atraso</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {currentDelayedList.map((eq: any) => (
                      <tr key={eq.id} className="text-slate-300 hover:bg-slate-800/10">
                        <td className="py-3 font-bold text-slate-200">{eq.codigoInterno}</td>
                        <td className="py-3">
                          <p className="font-semibold">{eq.modelo}</p>
                          <p className="text-[10px] text-slate-500">{eq.marca}</p>
                        </td>
                        <td className="py-3 text-slate-400">{eq.localInstalacao}</td>
                        <td className="py-3 text-slate-400">
                          {new Date(eq.lastMaintenance).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 font-bold text-rose-400 text-right">{eq.monthsSinceLast} meses</td>
                        <td className="py-3 text-right">
                          <Link 
                            href={`/equipamentos?id=${eq.id}`}
                            className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                          >
                            Ver
                            <ArrowUpRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upcoming preventives card */}
          {data.alerts.upcomingPreventives.length > 0 && (
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2 mb-4">
                <Clock className="text-blue-400" size={18} />
                Próximas Preventivas (Vencimento Próximo)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.alerts.upcomingPreventives.map((eq: any) => (
                  <div key={eq.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/60 flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black text-blue-400 tracking-wider">A VENCER</span>
                      <h4 className="font-bold text-slate-200 mt-1">{eq.codigoInterno}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{eq.modelo} ({eq.marca})</p>
                      <p className="text-[10px] text-slate-500 mt-2">Última preventiva: {new Date(eq.lastMaintenance).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <Link
                      href={`/equipamentos?id=${eq.id}`}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Latest Activity logs (occupies 1 col) */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md flex flex-col h-full max-h-[580px] overflow-hidden">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2 mb-6 shrink-0">
            <CalendarDays className="text-emerald-400" size={18} />
            Últimas Manutenções
          </h3>
          <div className="flex-1 overflow-y-auto pr-1 space-y-5">
            {data.latestMaintenances.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Nenhum serviço registrado
              </div>
            ) : (
              data.latestMaintenances.map((m: any) => (
                <div key={m.id} className="relative pl-6 border-l border-slate-800 space-y-1">
                  {/* Timeline point */}
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-emerald-500 border border-slate-950"></div>
                  
                  <span className="text-[10px] font-semibold text-slate-500">
                    {new Date(m.dataManutencao).toLocaleDateString('pt-BR')}
                  </span>
                  
                  <h4 className="font-bold text-slate-200 text-sm leading-tight">
                    {m.servicoRealizado}
                  </h4>
                  
                  <p className="text-xs text-slate-400 font-semibold">
                    Eq: <span className="text-slate-300 font-bold">{m.equipamento.codigoInterno}</span> ({m.equipamento.marca})
                  </p>
                  
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {m.descricao}
                  </p>
                  
                  <div className="pt-1 flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    Téc: {m.tecnicoNome}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
