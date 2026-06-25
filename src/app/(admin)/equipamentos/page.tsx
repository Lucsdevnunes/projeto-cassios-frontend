'use client';

import React, { useEffect, useState, useRef } from 'react';
import { ApiClient } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  Plus, 
  Search, 
  Download, 
  FileText, 
  Wrench, 
  Trash2, 
  Edit3, 
  X, 
  Tv, 
  Info, 
  Calendar, 
  MapPin, 
  FileCheck, 
  Camera, 
  PenTool, 
  ChevronsRight 
} from 'lucide-react';
import jsPDF from 'jspdf';

// Types
interface Equipment {
  id: string;
  codigoInterno: string;
  qrCode: string;
  endereco: string;
  localInstalacao: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  btu: number;
  tipo: string;
  dataInstalacao: string;
  observacoes?: string;
  frequenciaManutencao: number;
  proximaManutencao?: string;
  criadoEm: string;
  criador?: { nome: string; email: string };
  manutencoes?: any[];
  clienteId?: string;
  cliente?: { nome: string; qrCode?: string };
}

export default function EquipmentsPage() {
  const { user } = useAuth();
  
  // Lists & data states
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterClient, setFilterClient] = useState('ALL');
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [clienteId, setClienteId] = useState('');

  // Detail view state
  const [selectedEq, setSelectedEq] = useState<Equipment | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Maintenance modal state
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintError, setMaintError] = useState('');
  const [maintSubmitting, setMaintSubmitting] = useState(false);

  // Equipment form state fields
  const [codigoInterno, setCodigoInterno] = useState('');
  const [endereco, setEndereco] = useState('');
  const [localInstalacao, setLocalInstalacao] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [btu, setBtu] = useState(12000);
  const [tipo, setTipo] = useState('SPLIT');
  const [dataInstalacao, setDataInstalacao] = useState(new Date().toISOString().split('T')[0]);
  const [observacoes, setObservacoes] = useState('');
  const [frequenciaManutencao, setFrequenciaManutencao] = useState(6);
  const [proximaManutencao, setProximaManutencao] = useState('');

  // Maintenance form state fields
  const [maintServico, setMaintServico] = useState('Limpeza Preventiva');
  const [maintDescricao, setMaintDescricao] = useState('');
  const [maintPeca, setMaintPeca] = useState('');
  const [maintQtd, setMaintQtd] = useState<number | ''>('');
  const [maintTecnico, setMaintTecnico] = useState('');
  const [maintContratante, setMaintContratante] = useState('');
  const [maintObs, setMaintObs] = useState('');

  // Catalog and selected materials
  const [catalogMaterials, setCatalogMaterials] = useState<any[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<any[]>([]);
  const [currentMaterialId, setCurrentMaterialId] = useState<string>('');
  const [currentMatQty, setCurrentMatQty] = useState<number | ''>('');
  const [currentMatObs, setCurrentMatObs] = useState<string>('');
  
  // Base64 photos
  const [photosBefore, setPhotosBefore] = useState<string[]>([]);
  const [photosAfter, setPhotosAfter] = useState<string[]>([]);
  const [techSig, setTechSig] = useState('');
  const [clientSig, setClientSig] = useState('');
  const [techDrawn, setTechDrawn] = useState(false);
  const [clientDrawn, setClientDrawn] = useState(false);

  // Canvas signature refs
  const techCanvasRef = useRef<HTMLCanvasElement>(null);
  const clientCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchEquipments();
    fetchClients();
    fetchMaterials();
    
    // Check if query param contains equipment ID to open details directly
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlId = urlParams.get('id');
      if (urlId) {
        handleViewDetails(urlId);
      }
      const isCreate = urlParams.get('create');
      const queryClienteId = urlParams.get('clienteId');
      if (isCreate === 'true') {
        handleOpenCreateModal(queryClienteId || undefined);
      }
    }
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await ApiClient.get('/materials');
      setCatalogMaterials(res);
    } catch (err) {
      console.error('Erro ao carregar materiais:', err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await ApiClient.get('/clients');
      setClientsList(res);
    } catch (err: any) {
      console.error('Erro ao carregar clientes:', err);
    }
  };

  // Autofill technician name when modal opens
  useEffect(() => {
    if (showMaintModal && user) {
      setMaintTecnico(user.nome);
    }
  }, [showMaintModal, user]);

  const fetchEquipments = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get('/equipments');
      setEquipments(res);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar equipamentos.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = (prefilledClienteId?: string | any) => {
    setEditingEq(null);
    setCodigoInterno('');
    setEndereco('');
    setLocalInstalacao('');
    setMarca('');
    setModelo('');
    setNumeroSerie('');
    setBtu(12000);
    setTipo('SPLIT');
    setDataInstalacao(new Date().toISOString().split('T')[0]);
    setObservacoes('');
    setFrequenciaManutencao(6);
    setProximaManutencao('');
    setClienteId(typeof prefilledClienteId === 'string' ? prefilledClienteId : '');
    setFormError('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (eq: Equipment) => {
    setEditingEq(eq);
    setCodigoInterno(eq.codigoInterno);
    setEndereco(eq.endereco);
    setLocalInstalacao(eq.localInstalacao);
    setMarca(eq.marca);
    setModelo(eq.modelo);
    setNumeroSerie(eq.numeroSerie);
    setBtu(eq.btu);
    setTipo(eq.tipo);
    setDataInstalacao(new Date(eq.dataInstalacao).toISOString().split('T')[0]);
    setObservacoes(eq.observacoes || '');
    setFrequenciaManutencao(eq.frequenciaManutencao ?? 6);
    setProximaManutencao(eq.proximaManutencao ? new Date(eq.proximaManutencao).toISOString().split('T')[0] : '');
    setClienteId(eq.clienteId || '');
    setFormError('');
    setShowFormModal(true);
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    const payload = {
      codigoInterno,
      endereco,
      localInstalacao,
      marca,
      modelo,
      numeroSerie,
      btu: Number(btu),
      tipo,
      dataInstalacao: new Date(dataInstalacao).toISOString(),
      observacoes: observacoes.trim() || undefined,
      clienteId: clienteId || null,
      frequenciaManutencao: Number(frequenciaManutencao),
      proximaManutencao: proximaManutencao ? new Date(proximaManutencao).toISOString() : undefined,
    };

    try {
      if (editingEq) {
        await ApiClient.patch(`/equipments/${editingEq.id}`, payload);
      } else {
        await ApiClient.post('/equipments', payload);
      }
      setShowFormModal(false);
      fetchEquipments();
      
      // If selected eq is open, refresh detail view
      if (selectedEq && editingEq && selectedEq.id === editingEq.id) {
        handleViewDetails(selectedEq.id);
      }
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar equipamento.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('Deseja realmente excluir este equipamento? Todo o histórico de manutenção permanecerá arquivado no banco de dados, mas ele não será listado.')) {
      return;
    }
    try {
      await ApiClient.delete(`/equipments/${id}`);
      setSelectedEq(null);
      fetchEquipments();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir equipamento.');
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      setLoadingDetails(true);
      const data = await ApiClient.get(`/equipments/${id}`);
      setSelectedEq(data);
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar detalhes.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // PDF Download for Equipment QR Code tag
  const downloadQrCodePdf = (eq: Equipment | any) => {
    const qrCodeToUse = eq.qrCode;
    
    if (!qrCodeToUse) {
      alert('Não há QR Code disponível para este equipamento.');
      return;
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150], // custom tag format
    });

    // Outer card border
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(1);
    doc.rect(5, 5, 90, 140);

    // Title Header
    doc.setFillColor(15, 23, 42);
    doc.rect(5, 5, 90, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('CASSIOS CLIMA', 50, 14, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'normal');
    doc.text('IDENTIFICAÇÃO DE AR-CONDICIONADO', 50, 20, { align: 'center' });

    // QR Code Image
    doc.addImage(qrCodeToUse, 'PNG', 15, 30, 70, 70);

    // Metadata Details
    doc.setFillColor(248, 250, 252);
    doc.rect(10, 105, 80, 35, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(10, 105, 80, 35);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'bold');
    doc.text(`CÓD: ${eq.codigoInterno}`, 12, 111);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Marca: ${eq.marca}`, 12, 116);
    doc.text(`Modelo: ${eq.modelo}`, 12, 121);
    doc.text(`N/S: ${eq.numeroSerie}`, 12, 126);
    doc.text(`Capacidade: ${eq.btu} BTUs / Tipo: ${eq.tipo}`, 12, 131);
    
    if (eq.cliente?.nome) {
      doc.text(`Estabelecimento: ${eq.cliente.nome}`, 12, 136);
    } else {
      doc.text(`Local: ${eq.localInstalacao}`, 12, 136);
    }

    // Instruction footer
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(6);
    doc.setFont('Helvetica', 'italic');
    doc.text('Escaneie para consultar o histórico completo de manutenções', 50, 143, { align: 'center' });

    doc.save(`qrcode-tag-${eq.codigoInterno}.pdf`);
  };

  // Dynamic Image compressor to handle base64 sizes
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, category: 'BEFORE' | 'AFTER') => {
    const files = e.target.files;
    if (!files) return;

    // Reset input value to allow uploading the same file again
    e.target.value = '';

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          // Compress using HTML Canvas
          const canvas = document.createElement('canvas');
          const max_size = 800; // max size in width/height
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Get compressed dataURL (JPEG is smaller than PNG)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

          if (category === 'BEFORE') {
            setPhotosBefore((prev) => [...prev, compressedDataUrl]);
          } else {
            setPhotosAfter((prev) => [...prev, compressedDataUrl]);
          }
        };
      };
      reader.readAsDataURL(file);
    });
  };

  // Canvas signature helpers
  const setupCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f8fafc'; // light white/slate drawing color
  };

  const getEventCoordinates = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: any, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getEventCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    e.preventDefault();
    
    if (canvas === techCanvasRef.current) setTechDrawn(true);
    else if (canvas === clientCanvasRef.current) setClientDrawn(true);
  };

  const draw = (e: any, canvas: HTMLCanvasElement, isDrawingState: boolean) => {
    if (!isDrawingState) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getEventCoordinates(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };

  const clearCanvas = (canvas: HTMLCanvasElement | null, category: 'TECH' | 'CLIENT') => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (category === 'TECH') {
      setTechSig('');
      setTechDrawn(false);
    } else {
      setClientSig('');
      setClientDrawn(false);
    }
  };

  const saveCanvas = (canvas: HTMLCanvasElement | null, category: 'TECH' | 'CLIENT') => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (category === 'TECH') setTechSig(dataUrl);
    else setClientSig(dataUrl);
  };

  const handleSaveMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setMaintError('');

    let currentTechSig = techSig;
    if (!currentTechSig && techDrawn && techCanvasRef.current) {
      currentTechSig = techCanvasRef.current.toDataURL('image/png');
      setTechSig(currentTechSig);
    }

    let currentClientSig = clientSig;
    if (!currentClientSig && clientDrawn && clientCanvasRef.current) {
      currentClientSig = clientCanvasRef.current.toDataURL('image/png');
      setClientSig(currentClientSig);
    }

    if (!currentTechSig) {
      setMaintError('Assinatura do Técnico é obrigatória.');
      return;
    }
    if (!currentClientSig) {
      setMaintError('Assinatura do Contratante é obrigatória.');
      return;
    }
    if (!maintDescricao.trim()) {
      setMaintError('Descrição do serviço realizado é obrigatória.');
      return;
    }

    setMaintSubmitting(true);

    const payload = {
      equipamentoId: selectedEq!.id,
      dataManutencao: new Date().toISOString(),
      servicoRealizado: maintServico,
      descricao: maintDescricao,
      pecaTrocada: selectedMaterials.length > 0 
        ? selectedMaterials.map(m => `${m.nome} (${m.quantidade} ${m.unidade})`).join(', ') 
        : undefined,
      quantidade: selectedMaterials.length > 0 
        ? Math.round(selectedMaterials.reduce((acc, m) => acc + (m.unidade === 'UN' ? m.quantidade : 1), 0))
        : 0,
      tecnicoNome: maintTecnico,
      tecnicoAssinatura: currentTechSig,
      contratanteNome: maintContratante,
      contratanteAssinatura: currentClientSig,
      observacoes: maintObs.trim() || undefined,
      fotosAntes: photosBefore.length > 0 ? photosBefore : undefined,
      fotosDepois: photosAfter.length > 0 ? photosAfter : undefined,
      materiais: selectedMaterials.map((m) => ({
        materialId: m.materialId,
        quantidade: m.quantidade,
        observacao: m.observacao || undefined,
      })),
    };

    try {
      await ApiClient.post('/maintenance', payload);
      setShowMaintModal(false);
      // Reload details to show new maintenance on timeline
      handleViewDetails(selectedEq!.id);
      fetchEquipments();
    } catch (err: any) {
      setMaintError(err.message || 'Erro ao registrar manutenção.');
    } finally {
      setMaintSubmitting(false);
    }
  };

  const handleOpenMaintModal = () => {
    setMaintServico('Limpeza Preventiva');
    setMaintDescricao('');
    setMaintPeca('');
    setMaintQtd('');
    setMaintContratante('');
    setMaintObs('');
    setPhotosBefore([]);
    setPhotosAfter([]);
    setTechSig('');
    setSelectedMaterials([]);
    setCurrentMaterialId('');
    setCurrentMatQty('');
    setCurrentMatObs('');
    setClientSig('');
    setTechDrawn(false);
    setClientDrawn(false);
    setMaintError('');
    setShowMaintModal(true);

    setTimeout(() => {
      setupCanvas(techCanvasRef.current);
      setupCanvas(clientCanvasRef.current);
    }, 300);
  };

  // Filters & Search
  const filteredEquipments = equipments.filter((eq) => {
    const matchesSearch = 
      eq.codigoInterno.toLowerCase().includes(search.toLowerCase()) ||
      eq.marca.toLowerCase().includes(search.toLowerCase()) ||
      eq.modelo.toLowerCase().includes(search.toLowerCase()) ||
      eq.localInstalacao.toLowerCase().includes(search.toLowerCase()) ||
      eq.numeroSerie.toLowerCase().includes(search.toLowerCase());

    const matchesFilterType = filterType === 'ALL' || eq.tipo === filterType;
    const matchesFilterClient = filterClient === 'ALL' || eq.clienteId === filterClient;

    return matchesSearch && matchesFilterType && matchesFilterClient;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Equipamentos</h2>
          <p className="text-slate-400 text-sm mt-1">Cadastro e controle de aparelhos de climatização</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/20 cursor-pointer text-white"
        >
          <Plus size={18} />
          Cadastrar Equipamento
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md">
        <div className="flex-1 flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl focus-within:border-blue-500 transition-colors">
          <Search size={18} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por código, marca, modelo, local, série..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-slate-200 placeholder-slate-600 text-sm"
          />
        </div>

        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="bg-slate-950/85 border border-slate-800 px-4 py-2.5 rounded-xl text-slate-350 text-sm outline-none focus:border-blue-500 transition-colors"
        >
          <option value="ALL">Todos os Estabelecimentos</option>
          {clientsList.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-950/85 border border-slate-800 px-4 py-2.5 rounded-xl text-slate-300 text-sm outline-none focus:border-blue-500 transition-colors"
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

      {/* Main Grid: Listings + details panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left side: listings */}
        <div className={`bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md overflow-hidden ${
          selectedEq ? 'xl:col-span-2' : 'xl:col-span-3'
        }`}>
          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              Buscando equipamentos...
            </div>
          ) : filteredEquipments.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              Nenhum equipamento cadastrado ou localizado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider">
                    <th className="p-4 font-semibold">Código</th>
                    <th className="p-4 font-semibold">Aparelho</th>
                    <th className="p-4 font-semibold">Localização</th>
                    <th className="p-4 font-semibold">Capacidade</th>
                    <th className="p-4 font-semibold">Data Inst.</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredEquipments.map((eq) => (
                    <tr 
                      key={eq.id} 
                      className={`hover:bg-slate-800/20 transition-colors cursor-pointer ${
                        selectedEq?.id === eq.id ? 'bg-blue-600/10' : ''
                      }`}
                      onClick={() => handleViewDetails(eq.id)}
                    >
                      <td className="p-4 font-bold text-slate-200">{eq.codigoInterno}</td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-200">{eq.marca}</div>
                        <div className="text-slate-500 text-[10px]">{eq.modelo} &bull; {eq.tipo}</div>
                        {eq.cliente && (
                          <div className="text-blue-400 text-[10px] mt-0.5 font-medium">
                            Estabelecimento: {eq.cliente.nome}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-300">{eq.localInstalacao}</div>
                        <div className="text-slate-500 text-[10px] truncate max-w-[150px]">{eq.endereco}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-300">{eq.btu.toLocaleString()} BTUs</td>
                      <td className="p-4 text-slate-400">
                        {new Date(eq.dataInstalacao).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(eq)}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit3 size={14} />
                          </button>
                          {user?.perfil === 'ADMIN' && (
                            <button
                              onClick={() => handleDeleteEquipment(eq.id)}
                              className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleViewDetails(eq.id)}
                            className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white transition-colors cursor-pointer"
                            title="Ver histórico"
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

        {/* Right side: detail panel */}
        {selectedEq && (
          <div className="xl:col-span-1 bg-slate-900/40 border border-slate-800/80 rounded-2xl backdrop-blur-md overflow-hidden flex flex-col max-h-[calc(100vh-140px)] sticky top-[90px]">
            {/* Panel Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div>
                <h3 className="font-extrabold text-white">Detalhamento</h3>
                <span className="text-[10px] text-blue-400 font-bold">{selectedEq.codigoInterno}</span>
              </div>
              <button
                onClick={() => setSelectedEq(null)}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable details content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* QR Code section */}
              <div className="flex flex-col items-center bg-slate-955/60 p-4 rounded-xl border border-slate-800/60 text-center">
                <img 
                  src={selectedEq.qrCode || ''} 
                  alt="QR Code" 
                  className="w-40 h-40 bg-white p-2 rounded-lg" 
                />
                <span className="text-[9px] font-mono text-slate-500 mt-2 block break-all">
                  Aparelho ID: {selectedEq.id}
                </span>
                {selectedEq.clienteId && (
                  <span className="text-[10px] text-blue-400 font-bold mt-1.5 block">
                    Estabelecimento: {selectedEq.cliente?.nome}
                  </span>
                )}
                
                <div className="flex gap-2 w-full mt-4">
                  <a
                    href={selectedEq.qrCode || ''}
                    download={`qrcode-ar-${selectedEq.codigoInterno}.png`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                    PNG Tag
                  </a>
                  <button
                    onClick={() => downloadQrCodePdf(selectedEq)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-800 transition-colors cursor-pointer"
                  >
                    <FileText size={14} />
                    PDF Tag
                  </button>
                </div>
              </div>

              {/* Specifications list */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-2 uppercase">
                  <Info size={14} className="text-blue-400" />
                  Especificações Técnicas
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Marca</span>
                    <p className="font-semibold text-slate-200">{selectedEq.marca}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Modelo</span>
                    <p className="font-semibold text-slate-200">{selectedEq.modelo}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block">N/ Série</span>
                    <p className="font-semibold text-slate-200">{selectedEq.numeroSerie}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Capacidade</span>
                    <p className="font-semibold text-slate-200">{selectedEq.btu.toLocaleString()} BTUs</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tipo</span>
                    <p className="font-semibold text-slate-200">{selectedEq.tipo}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Instalação</span>
                    <p className="font-semibold text-slate-200">
                       {new Date(selectedEq.dataInstalacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Estabelecimento</span>
                    <p className="font-semibold text-blue-400">{selectedEq.cliente?.nome || 'Não associado'}</p>
                  </div>
                 </div>

                {/* Preventive Maintenance Schedule Status */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 mt-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Próxima Preventiva (Ciclo: {selectedEq.frequenciaManutencao ?? 6} meses)</span>
                    <p className="font-semibold text-slate-200 mt-0.5">
                      {selectedEq.proximaManutencao 
                        ? new Date(selectedEq.proximaManutencao).toLocaleDateString('pt-BR') 
                        : 'Não agendada'}
                    </p>
                  </div>
                  <div>
                    {selectedEq.proximaManutencao && (
                      new Date(selectedEq.proximaManutencao) < new Date() ? (
                        <span className="px-2 py-0.5 bg-red-950 border border-red-800 text-red-400 text-[10px] font-bold rounded-full">
                          ⚠️ ATRASADA
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold rounded-full">
                          ✅ EM DIA
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="text-xs border-t border-slate-800/50 pt-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 block text-[10px]">Endereço / Localização</span>
                      <p className="font-medium text-slate-300 leading-tight">
                        {selectedEq.localInstalacao} - {selectedEq.endereco}
                      </p>
                    </div>
                  </div>

                  {selectedEq.observacoes && (
                    <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800/40 mt-2">
                      <span className="text-slate-500 block text-[10px]">Observações</span>
                      <p className="text-slate-400 italic text-[11px] leading-relaxed mt-1">
                        "{selectedEq.observacoes}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance Timeline Section */}
              <div className="space-y-4 border-t border-slate-800/80 pt-6">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-2 uppercase">
                    <Wrench size={14} className="text-emerald-400" />
                    Linha do Tempo ({selectedEq.manutencoes?.length || 0})
                  </h4>
                  <button
                    onClick={handleOpenMaintModal}
                    className="flex items-center gap-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md cursor-pointer"
                  >
                    <Plus size={14} />
                    Registrar Serviço
                  </button>
                </div>

                {/* Timeline rendering */}
                {!selectedEq.manutencoes || selectedEq.manutencoes.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs italic">
                    Nenhuma manutenção registrada para este aparelho.
                  </div>
                ) : (
                  <div className="space-y-6 pl-3 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800">
                    {selectedEq.manutencoes.map((m: any) => (
                      <div key={m.id} className="relative pl-6 space-y-2 text-xs">
                        {/* Timeline point marker */}
                        <div className="absolute -left-[16px] top-1 w-3.5 h-3.5 rounded-full bg-slate-900 border border-emerald-500 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-200 text-sm leading-none">{m.servicoRealizado}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(m.dataManutencao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <p className="text-slate-400 leading-relaxed text-[11px]">{m.descricao}</p>

                        {m.materiais && m.materiais.length > 0 ? (
                          <div className="mt-2 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/40 text-[11px]">
                            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Materiais Utilizados:</div>
                            <div className="divide-y divide-slate-800/40">
                              {m.materiais.map((mat: any, mIdx: number) => (
                                <div key={mIdx} className="py-1 flex justify-between items-center text-slate-300">
                                  <div>
                                    <span className="font-semibold text-slate-200">{mat.material.nome}</span>
                                    {mat.observacao && <span className="text-[9px] text-slate-500 italic block">Obs: {mat.observacao}</span>}
                                  </div>
                                  <div className="font-bold text-blue-400">
                                    {mat.quantidade} <span className="text-[9px] text-slate-500 font-normal">{mat.material.unidade}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : m.pecaTrocada ? (
                          <div className="bg-slate-950/50 px-2.5 py-1 rounded-md border border-slate-800/40 text-[10px] inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Peça: <span className="text-slate-300 font-bold">{m.pecaTrocada} ({m.quantidade})</span>
                          </div>
                        ) : null}

                        {/* Photos display */}
                        {m.fotos && m.fotos.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[9px] text-slate-500 font-semibold block uppercase">Registros Fotográficos</span>
                            <div className="flex flex-wrap gap-2">
                              {m.fotos.map((f: any) => (
                                <div key={f.id} className="relative group overflow-hidden rounded-md border border-slate-800/60 bg-slate-950 w-16 h-16 shrink-0">
                                  <img 
                                    src={f.arquivo} 
                                    alt="Evidência" 
                                    className="w-full h-full object-cover" 
                                  />
                                  <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-bold text-slate-300 transition-opacity">
                                    {f.tipo}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Signatures check */}
                        <div className="pt-2 flex items-center justify-between gap-4 text-[10px] text-slate-500 border-t border-slate-800/40">
                          <div>
                            Téc: <span className="text-slate-300 font-semibold">{m.tecnicoNome}</span>
                          </div>
                          <div>
                            Cli: <span className="text-slate-300 font-semibold">{m.contratanteNome}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE / EDIT EQUIPMENT */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[calc(100vh-2rem)]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingEq ? 'Editar Equipamento' : 'Cadastrar Novo Equipamento'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEquipment} className="p-6 space-y-5 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                  {formError}
                </div>
              )}

              {/* Cliente Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Estabelecimento / Cliente</label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">Nenhum (QR Code Individual)</option>
                  {clientsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Internal code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Código Interno Único</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: AC-SPLIT-012"
                    value={codigoInterno}
                    onChange={(e) => setCodigoInterno(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* Serial Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Número de Série</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: SN984213898"
                    value={numeroSerie}
                    onChange={(e) => setNumeroSerie(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* Brand */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Marca</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: Daikin, Carrier, LG..."
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* Model */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Modelo</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: Inverter Eco 12k"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* Capacity BTUs */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Capacidade (BTUs)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={btu}
                    onChange={(e) => setBtu(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Tipo de Equipamento</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="SPLIT">Split</option>
                    <option value="CASSETE">Cassete</option>
                    <option value="PISO_TETO">Piso Teto</option>
                    <option value="JANELA">Janela</option>
                    <option value="VRF">VRF</option>
                    <option value="MULTI_SPLIT">Multi Split</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                {/* Installation Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Data de Instalação</label>
                  <input
                    type="date"
                    required
                    value={dataInstalacao}
                    onChange={(e) => setDataInstalacao(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* Installation Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Local da Instalação (Setor/Sala)</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: Sala de Reunião B, Diretoria..."
                    value={localInstalacao}
                    onChange={(e) => setLocalInstalacao(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Installation address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Endereço da Instalação (Completo)</label>
                <input
                  type="text"
                  required
                  placeholder="EX: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Preventive Maintenance Schedule Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Periodicidade de Preventivas (Meses)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={frequenciaManutencao}
                    onChange={(e) => setFrequenciaManutencao(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Próxima Preventiva (Opcional)</label>
                  <input
                    type="date"
                    value={proximaManutencao}
                    onChange={(e) => setProximaManutencao(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Observações Adicionais</label>
                <textarea
                  placeholder="Instruções específicas de acesso, histórico prévio..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="py-2.5 px-5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
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

      {/* MODAL 2: REGISTER MAINTENANCE */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[calc(100vh-2rem)]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">Registrar Manutenção / Serviço</h3>
                <span className="text-xs text-slate-400">Adicionando serviço permanente ao histórico de {selectedEq?.codigoInterno}</span>
              </div>
              <button
                onClick={() => setShowMaintModal(false)}
                className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveMaintenance} className="p-6 space-y-6 overflow-y-auto flex-1">
              {maintError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
                  {maintError}
                </div>
              )}

              {/* Service Type and Names */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Service type select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Serviço Realizado</label>
                  <select
                    value={maintServico}
                    onChange={(e) => setMaintServico(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="Instalação">Instalação</option>
                    <option value="Limpeza Preventiva">Limpeza Preventiva</option>
                    <option value="Higienização Completa">Higienização Completa</option>
                    <option value="Manutenção Preventiva">Manutenção Preventiva</option>
                    <option value="Manutenção Corretiva">Manutenção Corretiva</option>
                    <option value="Troca de Componente">Troca de Componente</option>
                    <option value="Carga de Gás">Carga de Gás</option>
                  </select>
                </div>

                {/* Technician name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Nome do Técnico</label>
                  <input
                    type="text"
                    required
                    value={maintTecnico}
                    onChange={(e) => setMaintTecnico(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* Contractor name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Nome do Contratante / Autorizado</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: Nome do cliente, gerente..."
                    value={maintContratante}
                    onChange={(e) => setMaintContratante(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Service description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Descrição Detalhada do Serviço</label>
                <textarea
                  required
                  placeholder="EX: Realizada lavagem química dos filtros, medição da pressão de gás (R410A) em 120 PSI, medição de corrente do compressor (5.4 A) e higienização geral da condensadora."
                  value={maintDescricao}
                  onChange={(e) => setMaintDescricao(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Peças e Materiais Utilizados */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Wrench size={14} className="text-blue-400" />
                  Peças e Materiais Utilizados na OS
                </label>
                
                {/* Form to Add Material */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  {/* Dropdown Material */}
                  <div className="md:col-span-6 space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400">Peça / Insumo</label>
                    <select
                      value={currentMaterialId}
                      onChange={(e) => {
                        setCurrentMaterialId(e.target.value);
                        setCurrentMatQty('');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs outline-none focus:border-blue-500"
                    >
                      <option value="">-- Selecione --</option>
                      {Object.entries(
                        catalogMaterials.reduce((acc: any, item) => {
                          (acc[item.categoria] = acc[item.categoria] || []).push(item);
                          return acc;
                        }, {})
                      ).map(([categoria, items]: any) => (
                        <optgroup label={categoria} key={categoria}>
                          {items.map((item: any) => (
                            <option value={item.id} key={item.id}>
                              {item.nome} ({item.unidade})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Quantity with dynamic unit label */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400">
                      {(() => {
                        const selectedMat = catalogMaterials.find(m => m.id === currentMaterialId);
                        if (!selectedMat) return 'Quantidade';
                        if (selectedMat.unidade === 'M') return 'Metragem (m)';
                        if (selectedMat.unidade === 'KG') return 'Peso (kg)';
                        if (selectedMat.unidade === 'L') return 'Volume (l)';
                        return 'Quantidade (un)';
                      })()}
                    </label>
                    <input
                      type="number"
                      step={(() => {
                        const selectedMat = catalogMaterials.find(m => m.id === currentMaterialId);
                        return selectedMat?.unidade === 'UN' ? '1' : '0.01';
                      })()}
                      min="0.01"
                      placeholder={(() => {
                        const selectedMat = catalogMaterials.find(m => m.id === currentMaterialId);
                        if (!selectedMat) return 'Ex: 1';
                        if (selectedMat.unidade === 'M') return 'Ex: 5.50';
                        if (selectedMat.unidade === 'KG') return 'Ex: 1.25';
                        if (selectedMat.unidade === 'L') return 'Ex: 0.50';
                        return 'Ex: 2';
                      })()}
                      value={currentMatQty}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCurrentMatQty(val === '' ? '' : Number(val));
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Add Button */}
                  <div className="md:col-span-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentMaterialId) return;
                        if (!currentMatQty || Number(currentMatQty) <= 0) {
                          alert('Por favor, informe uma quantidade válida maior que zero.');
                          return;
                        }
                        const mat = catalogMaterials.find(m => m.id === currentMaterialId);
                        if (!mat) return;
                        if (mat.unidade === 'UN' && !Number.isInteger(Number(currentMatQty))) {
                          alert('A quantidade para UNIDADE (UN) deve ser um número inteiro.');
                          return;
                        }
                        
                        const existingIndex = selectedMaterials.findIndex(item => item.materialId === currentMaterialId);
                        if (existingIndex > -1) {
                          const updated = [...selectedMaterials];
                          updated[existingIndex].quantidade = Number((updated[existingIndex].quantidade + Number(currentMatQty)).toFixed(2));
                          if (currentMatObs.trim()) {
                            updated[existingIndex].observacao = currentMatObs.trim();
                          }
                          setSelectedMaterials(updated);
                        } else {
                          setSelectedMaterials(prev => [...prev, {
                            materialId: currentMaterialId,
                            nome: mat.nome,
                            categoria: mat.categoria,
                            unidade: mat.unidade,
                            quantidade: Number(Number(currentMatQty).toFixed(2)),
                            observacao: currentMatObs.trim() || undefined,
                          }]);
                        }
                        setCurrentMaterialId('');
                        setCurrentMatQty('');
                        setCurrentMatObs('');
                      }}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Add Peça
                    </button>
                  </div>
                </div>

                {/* Observation line */}
                {currentMaterialId && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-[10px] font-semibold text-slate-400">Observações adicionais para este item (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: Trocado capacitor permanente da evaporadora, cabo PP para interligação..."
                      value={currentMatObs}
                      onChange={(e) => setCurrentMatObs(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Table of selected materials */}
                {selectedMaterials.length > 0 && (
                  <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/30 mt-2">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                          <th className="p-2.5">Item / Categoria</th>
                          <th className="p-2.5 text-center">Quantidade</th>
                          <th className="p-2.5">Obs. Específica</th>
                          <th className="p-2.5 text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {selectedMaterials.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/20 text-slate-300">
                            <td className="p-2.5">
                              <div className="font-semibold text-slate-200">{item.nome}</div>
                              <div className="text-[9px] text-slate-500">{item.categoria}</div>
                            </td>
                            <td className="p-2.5 text-center font-bold text-blue-400">
                              {item.quantidade} <span className="text-[9px] text-slate-500 font-normal">{item.unidade}</span>
                            </td>
                            <td className="p-2.5 text-slate-400 italic">
                              {item.observacao || '-'}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedMaterials(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1 rounded-md bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white transition-colors cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Multi-Photo Upload before/after */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BEFORE PHOTOS */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Camera size={14} className="text-blue-400" />
                      FOTOS ANTES (Intervenção)
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="py-1 px-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1">
                        <Camera size={10} /> Câmera
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment"
                          onChange={(e) => handlePhotoUpload(e, 'BEFORE')} 
                          className="hidden" 
                        />
                      </label>
                      <label className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1">
                        <Plus size={10} /> Galeria
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          onChange={(e) => handlePhotoUpload(e, 'BEFORE')} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                  
                  {photosBefore.length === 0 ? (
                    <div className="border border-dashed border-slate-800/80 rounded-xl py-6 text-center text-slate-600 text-[11px]">
                      Nenhuma foto selecionada
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1">
                      {photosBefore.map((p, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-800 w-16 h-16 shrink-0 bg-slate-950">
                          <img src={p} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setPhotosBefore((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 p-0.5 rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AFTER PHOTOS */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Camera size={14} className="text-emerald-400" />
                      FOTOS DEPOIS (Conclusão)
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="py-1 px-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1">
                        <Camera size={10} /> Câmera
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment"
                          onChange={(e) => handlePhotoUpload(e, 'AFTER')} 
                          className="hidden" 
                        />
                      </label>
                      <label className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1">
                        <Plus size={10} /> Galeria
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          onChange={(e) => handlePhotoUpload(e, 'AFTER')} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>
                  
                  {photosAfter.length === 0 ? (
                    <div className="border border-dashed border-slate-800/80 rounded-xl py-6 text-center text-slate-600 text-[11px]">
                      Nenhuma foto selecionada
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1">
                      {photosAfter.map((p, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-800 w-16 h-16 shrink-0 bg-slate-950">
                          <img src={p} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setPhotosAfter((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 p-0.5 rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Digital Canvas Signatures (Téc/Cliente) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* TECHNICIAN SIGNATURE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                      <PenTool size={14} className="text-blue-400" />
                      Assinatura Digital (Técnico)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => clearCanvas(techCanvasRef.current, 'TECH')}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-500 hover:text-slate-300 rounded text-[9px] font-bold"
                      >
                        Limpar
                      </button>
                      <button
                        type="button"
                        onClick={() => saveCanvas(techCanvasRef.current, 'TECH')}
                        className="px-2 py-1 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded text-[9px] font-bold"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>

                  <div className="relative rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/80">
                    <canvas
                      ref={techCanvasRef}
                      width={320}
                      height={120}
                      className="w-full h-32 touch-none block"
                      onMouseDown={(e) => startDrawing(e, techCanvasRef.current!)}
                      onMouseMove={(e) => draw(e, techCanvasRef.current!, true)}
                      onTouchStart={(e) => startDrawing(e, techCanvasRef.current!)}
                      onTouchMove={(e) => draw(e, techCanvasRef.current!, true)}
                    />
                    {techSig && (
                      <div className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center pointer-events-none">
                        <span className="bg-emerald-600/90 text-white font-black text-[9px] px-2 py-0.5 rounded-full border border-emerald-500">ASSINATURA GRAVADA</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CONTRACTOR SIGNATURE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                      <PenTool size={14} className="text-emerald-400" />
                      Assinatura Digital (Contratante)
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => clearCanvas(clientCanvasRef.current, 'CLIENT')}
                        className="px-2 py-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-500 hover:text-slate-300 rounded text-[9px] font-bold"
                      >
                        Limpar
                      </button>
                      <button
                        type="button"
                        onClick={() => saveCanvas(clientCanvasRef.current, 'CLIENT')}
                        className="px-2 py-1 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded text-[9px] font-bold"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>

                  <div className="relative rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/80">
                    <canvas
                      ref={clientCanvasRef}
                      width={320}
                      height={120}
                      className="w-full h-32 touch-none block"
                      onMouseDown={(e) => startDrawing(e, clientCanvasRef.current!)}
                      onMouseMove={(e) => draw(e, clientCanvasRef.current!, true)}
                      onTouchStart={(e) => startDrawing(e, clientCanvasRef.current!)}
                      onTouchMove={(e) => draw(e, clientCanvasRef.current!, true)}
                    />
                    {clientSig && (
                      <div className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center pointer-events-none">
                        <span className="bg-emerald-600/90 text-white font-black text-[9px] px-2 py-0.5 rounded-full border border-emerald-500">ASSINATURA GRAVADA</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Obs notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Observações de Manutenção</label>
                <input
                  type="text"
                  placeholder="Informações adicionais relevantes..."
                  value={maintObs}
                  onChange={(e) => setMaintObs(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  className="py-2.5 px-5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={maintSubmitting}
                  className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/10 hover:shadow-emerald-500/20 disabled:bg-emerald-600/50 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {maintSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Registrando...
                    </>
                  ) : (
                    'Registrar Serviço'
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
