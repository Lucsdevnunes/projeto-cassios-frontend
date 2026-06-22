'use client';

import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  X, 
  Mail, 
  Phone, 
  FileText, 
  Tv, 
  ChevronsRight, 
  ArrowUpRight 
} from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';

interface Client {
  id: string;
  nome: string;
  documento?: string;
  telefone?: string;
  email?: string;
  qrCode?: string;
  criadoEm: string;
  equipamentos?: any[];
  _count?: {
    equipamentos: number;
  };
}

export default function ClientsPage() {
  const { user } = useAuth();
  
  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [eqSearch, setEqSearch] = useState('');
  const [eqFilterType, setEqFilterType] = useState('ALL');

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Selected Client Details state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form fields
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get('/clients');
      setClients(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar clientes.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setNome('');
    setDocumento('');
    setTelefone('');
    setEmail('');
    setFormError('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setNome(client.nome);
    setDocumento(client.documento || '');
    setTelefone(client.telefone || '');
    setEmail(client.email || '');
    setFormError('');
    setShowFormModal(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    const payload = {
      nome,
      documento: documento.trim() || undefined,
      telefone: telefone.trim() || undefined,
      email: email.trim() || undefined,
    };

    try {
      if (editingClient) {
        await ApiClient.patch(`/clients/${editingClient.id}`, payload);
      } else {
        await ApiClient.post('/clients', payload);
      }
      setShowFormModal(false);
      fetchClients();
      
      // If selected client is open, refresh detail view
      if (selectedClient && editingClient && selectedClient.id === editingClient.id) {
        handleViewDetails(selectedClient.id);
      }
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar cliente.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Deseja realmente remover este estabelecimento? Seus equipamentos continuarão registrados, mas o estabelecimento será arquivado (Soft Delete).')) {
      return;
    }
    try {
      await ApiClient.delete(`/clients/${id}`);
      setSelectedClient(null);
      fetchClients();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir cliente.');
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      setLoadingDetails(true);
      const data = await ApiClient.get(`/clients/${id}`);
      setSelectedClient(data);
    } catch (err: any) {
      alert(err.message || 'Erro ao obter detalhes do cliente.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const downloadEstablishmentQrCodePdf = (client: Client) => {
    if (!client.qrCode) return;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150],
    });

    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(1);
    doc.rect(5, 5, 90, 140);

    doc.setFillColor(15, 23, 42);
    doc.rect(5, 5, 90, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CASSIOS CLIMA', 50, 14, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'normal');
    doc.text('IDENTIFICAÇÃO DE ESTABELECIMENTO', 50, 20, { align: 'center' });

    doc.addImage(client.qrCode, 'PNG', 15, 30, 70, 70);

    doc.setFillColor(248, 250, 252);
    doc.rect(10, 105, 80, 35, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(10, 105, 80, 35);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'bold');
    doc.text(client.nome.toUpperCase(), 12, 112, { maxWidth: 76 });
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    if (client.documento) doc.text(`CNPJ/CPF: ${client.documento}`, 12, 122);
    if (client.telefone) doc.text(`Telefone: ${client.telefone}`, 12, 127);
    if (client.email) doc.text(`E-mail: ${client.email}`, 12, 132);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(6);
    doc.setFont('Helvetica', 'italic');
    doc.text('Escaneie para consultar os ar-condicionados desta unidade', 50, 143, { align: 'center' });

    doc.save(`qrcode-tag-estabelecimento-${client.nome}.pdf`);
  };

  const filteredClients = clients.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.nome.toLowerCase().includes(term) ||
      (c.documento && c.documento.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.telefone && c.telefone.toLowerCase().includes(term))
    );
  });  // Local filtered equipments inside selected establishment
  const localFilteredEquipments = selectedClient?.equipamentos?.filter((eq: any) => {
    const term = eqSearch.toLowerCase();
    const matchesSearch = 
      eq.codigoInterno.toLowerCase().includes(term) ||
      eq.marca.toLowerCase().includes(term) ||
      eq.modelo.toLowerCase().includes(term) ||
      eq.localInstalacao.toLowerCase().includes(term);

    const matchesFilterType = eqFilterType === 'ALL' || eq.tipo === eqFilterType;
    return matchesSearch && matchesFilterType;
  }) || [];

  return (
    <div className="space-y-6">
      {selectedClient ? (
        // VISÃO EM TELA CHEIA (ENTRAR NO ESTABELECIMENTO)
        <div className="space-y-6 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-6 rounded-3xl border border-slate-800/80 backdrop-blur-md">
            <div className="space-y-1">
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setEqSearch('');
                  setEqFilterType('ALL');
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2 cursor-pointer font-semibold"
              >
                &larr; Voltar para Estabelecimentos
              </button>
              <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-blue-400 border border-slate-700 text-lg">
                  {selectedClient.nome.charAt(0).toUpperCase()}
                </div>
                {selectedClient.nome}
              </h2>
              <p className="text-slate-400 text-xs pl-12">Detalhamento e aparelhos de climatização deste estabelecimento</p>
            </div>

            <div className="flex items-center gap-3">
              {user?.perfil === 'ADMIN' && (
                <button
                  onClick={() => handleOpenEditModal(selectedClient)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white transition-all border border-slate-800 cursor-pointer"
                >
                  Editar Dados
                </button>
              )}
              <Link
                href={`/equipamentos?create=true&clienteId=${selectedClient.id}`}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/20 text-white cursor-pointer"
              >
                <Plus size={16} />
                Cadastrar Novo Aparelho
              </Link>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Details */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md space-y-6">
              {/* QR Code section */}
              {selectedClient.qrCode && (
                <div className="flex flex-col items-center bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 text-center">
                  <img 
                    src={selectedClient.qrCode} 
                    alt="QR Code" 
                    className="w-40 h-40 bg-white p-2 rounded-lg" 
                  />
                  <span className="text-[9px] font-mono text-slate-500 mt-2 block break-all">{selectedClient.id}</span>
                  
                  <div className="flex gap-2 w-full mt-4">
                    <a
                      href={selectedClient.qrCode}
                      download={`qrcode-estabelecimento-${selectedClient.nome}.png`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
                    >
                      PNG Tag
                    </a>
                    <button
                      onClick={() => downloadEstablishmentQrCodePdf(selectedClient)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
                    >
                      PDF Tag
                    </button>
                  </div>
                </div>
              )}

              <h3 className="font-extrabold text-white text-xs tracking-wider uppercase border-b border-slate-850 pb-3">
                Informações do Contrato
              </h3>
              <div className="space-y-4 text-xs">
                {selectedClient.documento && (
                  <div>
                    <span className="text-slate-500 block">CPF / CNPJ</span>
                    <p className="font-semibold text-slate-300 font-mono mt-0.5">{selectedClient.documento}</p>
                  </div>
                )}
                {selectedClient.telefone && (
                  <div>
                    <span className="text-slate-500 block">Telefone / Contato</span>
                    <p className="font-semibold text-slate-300 mt-0.5">{selectedClient.telefone}</p>
                  </div>
                )}
                {selectedClient.email && (
                  <div>
                    <span className="text-slate-500 block">E-mail</span>
                    <p className="font-semibold text-slate-300 mt-0.5 break-all">{selectedClient.email}</p>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block">Data de Cadastro</span>
                  <p className="font-semibold text-slate-400 mt-0.5">
                    {new Date(selectedClient.criadoEm).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Scoped Equipments */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-4">
                <h3 className="font-extrabold text-white text-xs tracking-wider uppercase">
                  Ar-Condicionados Instalados ({selectedClient.equipamentos?.length || 0})
                </h3>
                {/* Search & Filter tools */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar aparelho..."
                      value={eqSearch}
                      onChange={(e) => setEqSearch(e.target.value)}
                      className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-200 text-xs outline-none focus:border-blue-500 placeholder-slate-650"
                    />
                  </div>
                  <select
                    value={eqFilterType}
                    onChange={(e) => setEqFilterType(e.target.value)}
                    className="bg-slate-950 border border-slate-800 px-2 py-1.5 rounded-lg text-slate-350 text-xs outline-none focus:border-blue-500"
                  >
                    <option value="ALL">Todos os Tipos</option>
                    <option value="SPLIT">Split</option>
                    <option value="CASSETE">Cassete</option>
                    <option value="PISO_TETO">Piso Teto</option>
                    <option value="JANELA">Janela</option>
                    <option value="VRF">VRF</option>
                    <option value="MULTI_SPLIT">Multi Split</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
              </div>

              {localFilteredEquipments.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs italic border border-dashed border-slate-800/80 rounded-2xl">
                  Nenhum ar-condicionado localizado neste estabelecimento.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="pb-3 pr-4">Código Interno</th>
                        <th className="pb-3 pr-4">Equipamento</th>
                        <th className="pb-3 pr-4">Setor / Localização</th>
                        <th className="pb-3 pr-4">Capacidade</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300">
                      {localFilteredEquipments.map((eq: any) => (
                        <tr key={eq.id} className="hover:bg-slate-800/10 transition-colors">
                          <td className="py-3.5 pr-4 font-bold text-slate-200">{eq.codigoInterno}</td>
                          <td className="py-3.5 pr-4">
                            <div className="font-semibold text-slate-200">{eq.marca}</div>
                            <div className="text-slate-500 text-[10px]">{eq.modelo} &bull; {eq.tipo}</div>
                          </td>
                          <td className="py-3.5 pr-4 font-medium text-slate-300">{eq.localInstalacao}</td>
                          <td className="py-3.5 pr-4 font-bold text-slate-400">{eq.btu.toLocaleString()} BTUs</td>
                          <td className="py-3.5 text-right">
                            <Link
                              href={`/equipamentos?id=${eq.id}`}
                              className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white transition-colors font-bold text-[10px]"
                            >
                              Ver Histórico
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // LISTAGEM DE ESTABELECIMENTOS
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Estabelecimentos</h2>
              <p className="text-slate-400 text-sm mt-1">Gestão de carteira de estabelecimentos, hemocentros e contratos</p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/20 cursor-pointer text-white"
            >
              <Plus size={18} />
              Cadastrar Estabelecimento
            </button>
          </div>

          {/* Filter and Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md">
            <div className="flex-1 flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl focus-within:border-blue-500 transition-colors">
              <Search size={18} className="text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por nome, documento, e-mail, telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-slate-200 placeholder-slate-600 text-sm"
              />
            </div>
          </div>

          {/* Main Grid Layout */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md overflow-hidden">
            {loading ? (
              <div className="py-20 text-center text-slate-500">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                Buscando estabelecimentos...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                Nenhum estabelecimento cadastrado ou localizado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-semibold">
                      <th className="p-4">Estabelecimento / Nome</th>
                      <th className="p-4">Documento</th>
                      <th className="p-4">Contato</th>
                      <th className="p-4 text-center">Aparelhos Atendidos</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredClients.map((c) => (
                      <tr 
                        key={c.id} 
                        className="hover:bg-slate-850/30 transition-colors cursor-pointer"
                        onClick={() => handleViewDetails(c.id)}
                      >
                        <td className="p-4 font-bold text-slate-200 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-blue-400 border border-slate-700">
                            {c.nome.charAt(0).toUpperCase()}
                          </div>
                          {c.nome}
                        </td>
                        <td className="p-4 text-slate-400 font-mono">{c.documento || '-'}</td>
                        <td className="p-4">
                          <div className="text-slate-300 font-medium">{c.telefone || '-'}</div>
                          <div className="text-[10px] text-slate-500">{c.email || '-'}</div>
                        </td>
                        <td className="p-4 font-bold text-slate-200 text-center text-sm">
                          {c._count?.equipamentos ?? 0}
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(c)}
                              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 size={14} />
                            </button>
                            {user?.perfil === 'ADMIN' && (
                              <button
                                onClick={() => handleDeleteClient(c.id)}
                                className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleViewDetails(c.id)}
                              className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white transition-colors cursor-pointer"
                              title="Entrar no Estabelecimento"
                            >
                              <ChevronsRight size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLIENT CRUD FORM MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[calc(100vh-2rem)]">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingClient ? 'Editar Estabelecimento' : 'Cadastrar Novo Estabelecimento'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveClient} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Nome do Estabelecimento / Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="EX: Hemocentro de Rio Verde, Seu Arnaldo..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Document */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Documento (CPF ou CNPJ)</label>
                <input
                  type="text"
                  placeholder="EX: 12.345.678/0001-90"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Telefone / Contato</label>
                <input
                  type="text"
                  placeholder="EX: (64) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">E-mail</label>
                <input
                  type="email"
                  placeholder="EX: contato@hemocentro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="py-2.5 px-5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/10 hover:shadow-blue-500/20 disabled:bg-blue-600/50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {formSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processando...
                    </>
                  ) : (
                    'Salvar Cadastro'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
