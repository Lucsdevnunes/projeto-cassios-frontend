'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ApiClient } from '../../lib/api';
import { 
  ThermometerSnowflake, 
  Info, 
  MapPin, 
  Calendar, 
  Wrench, 
  CheckCircle,
  FileDown, 
  Camera, 
  UserCheck,
  Search,
  X,
  ChevronsRight
} from 'lucide-react';
import jsPDF from 'jspdf';

interface EquipmentItem {
  id: string;
  codigoInterno: string;
  marca: string;
  modelo: string;
  localInstalacao: string;
  btu: number;
  tipo: string;
  dataInstalacao: string;
}

interface EstablishmentPublic {
  id: string;
  nome: string;
  documento?: string;
  telefone?: string;
  email?: string;
  qrCode?: string;
  equipamentos: EquipmentItem[];
}

export default function PublicEstablishmentTimeline() {
  const searchParams = useSearchParams();
  const uuid = searchParams.get('id');
  const [establishment, setEstablishment] = useState<EstablishmentPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and Filter states
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Selected Equipment specs & timeline states
  const [selectedEqId, setSelectedEqId] = useState<string | null>(null);
  const [eqDetails, setEqDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (uuid) {
      fetchEstablishmentDetails();
    }
  }, [uuid]);

  const fetchEstablishmentDetails = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.get(`/clients/public/${uuid}`);
      setEstablishment(data);
    } catch (err: any) {
      setError(err.message || 'Estabelecimento não localizado no sistema ou ID inválido.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEquipment = async (id: string) => {
    setSelectedEqId(id);
    try {
      setLoadingDetails(true);
      const data = await ApiClient.get(`/equipments/public/${id}`);
      setEqDetails(data);
    } catch (err: any) {
      alert('Erro ao carregar detalhes do ar-condicionado.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const downloadHistoryPdf = async () => {
    if (!eqDetails) return;
    setGeneratingPdf(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      let yOffset = 15;

      const drawHeader = (pageNumber: number) => {
        doc.setFillColor(15, 23, 42); 
        doc.rect(10, 10, 190, 18, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('CASSIOS CLIMA - RELATÓRIO DE MANUTENÇÃO', 15, 20);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`CÓDIGO INTERNO: ${eqDetails.codigoInterno}  |  EMISSÃO: ${new Date().toLocaleDateString('pt-BR')}`, 15, 25);
        doc.text(`Página ${pageNumber}`, 190, 20, { align: 'right' });
      };

      const checkPageBreak = (neededHeight: number, pageNum: { current: number }) => {
        if (yOffset + neededHeight > 280) {
          doc.addPage();
          pageNum.current += 1;
          drawHeader(pageNum.current);
          yOffset = 40;
          return true;
        }
        return false;
      };

      const pageNum = { current: 1 };
      drawHeader(pageNum.current);
      yOffset = 40;

      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('1. DADOS TÉCNICOS DO AR-CONDICIONADO', 12, yOffset);
      yOffset += 6;

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(10, yOffset - 1, 200, yOffset - 1);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      
      const fields = [
        ['Código Interno:', eqDetails.codigoInterno, 'Marca:', eqDetails.marca],
        ['Modelo:', eqDetails.modelo, 'N/ Série:', eqDetails.numeroSerie],
        ['Capacidade:', `${eqDetails.btu.toLocaleString()} BTUs`, 'Tipo:', eqDetails.tipo],
        ['Instalação:', new Date(eqDetails.dataInstalacao).toLocaleDateString('pt-BR'), 'Estabelecimento:', establishment?.nome || 'Não informado'],
      ];

      fields.forEach((row) => {
        doc.setFont('Helvetica', 'bold');
        doc.text(row[0], 15, yOffset);
        doc.setFont('Helvetica', 'normal');
        doc.text(row[1], 45, yOffset);

        doc.setFont('Helvetica', 'bold');
        doc.text(row[2], 110, yOffset);
        doc.setFont('Helvetica', 'normal');
        doc.text(row[3], 130, yOffset);
        
        yOffset += 6;
      });

      doc.setFont('Helvetica', 'bold');
      doc.text('Endereço / Setor:', 15, yOffset);
      doc.setFont('Helvetica', 'normal');
      doc.text(`${eqDetails.localInstalacao} - ${eqDetails.endereco}`, 45, yOffset);
      yOffset += 8;

      yOffset = Math.max(yOffset, 85);

      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.text('2. HISTÓRICO COMPLETO DE MANUTENÇÕES', 12, yOffset);
      yOffset += 6;
      doc.line(10, yOffset - 1, 200, yOffset - 1);

      if (!eqDetails.manutencoes || eqDetails.manutencoes.length === 0) {
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhuma manutenção registrada para este aparelho.', 15, yOffset);
      } else {
        for (const [index, m] of eqDetails.manutencoes.entries()) {
          checkPageBreak(50, pageNum);

          doc.setFillColor(248, 250, 252);
          doc.rect(10, yOffset, 190, 8, 'F');
          
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);
          doc.text(`${index + 1}. SERVIÇO: ${m.servicoRealizado.toUpperCase()}`, 13, yOffset + 5.5);
          doc.text(`DATA: ${new Date(m.dataManutencao).toLocaleDateString('pt-BR')}`, 197, yOffset + 5.5, { align: 'right' });
          yOffset += 12;

          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          const splitDescription = doc.splitTextToSize(`Descrição: ${m.descricao}`, 180);
          doc.text(splitDescription, 15, yOffset);
          yOffset += (splitDescription.length * 4.5) + 3;

          if (m.pecaTrocada) {
            checkPageBreak(8, pageNum);
            doc.setFont('Helvetica', 'bold');
            doc.text('Peças Trocadas: ', 15, yOffset);
            doc.setFont('Helvetica', 'normal');
            doc.text(`${m.pecaTrocada} (${m.quantidade} unidades)`, 42, yOffset);
            yOffset += 6;
          }

          checkPageBreak(25, pageNum);
          doc.setFont('Helvetica', 'bold');
          doc.text(`Técnico Responsável: ${m.tecnicoNome}`, 15, yOffset);
          doc.text(`Contratante / Autorizante: ${m.contratanteNome}`, 110, yOffset);
          yOffset += 4;

          try {
            if (m.tecnicoAssinatura) {
              doc.addImage(m.tecnicoAssinatura, 'PNG', 15, yOffset, 40, 14);
            }
            if (m.contratanteAssinatura) {
              doc.addImage(m.contratanteAssinatura, 'PNG', 110, yOffset, 40, 14);
            }
          } catch (err) {
            console.error('Failed to embed signature image in PDF', err);
          }
          yOffset += 18;

          const photosBeforeList = m.fotos?.filter((f: any) => f.tipo === 'ANTES') || [];
          const photosAfterList = m.fotos?.filter((f: any) => f.tipo === 'DEPOIS') || [];
          const hasPhotos = photosBeforeList.length > 0 || photosAfterList.length > 0;

          if (hasPhotos) {
            checkPageBreak(50, pageNum);
            doc.setFont('Helvetica', 'bold');
            doc.text('Evidências Fotográficas:', 15, yOffset);
            yOffset += 4;

            let xPos = 15;
            for (const [pIdx, p] of photosBeforeList.slice(0, 3).entries()) {
              try {
                doc.addImage(p.arquivo, 'JPEG', xPos, yOffset, 25, 25);
                doc.setFontSize(6);
                doc.setFont('Helvetica', 'normal');
                doc.text(`Antes #${pIdx + 1}`, xPos + 12.5, yOffset + 28, { align: 'center' });
                xPos += 30;
              } catch (err) {
                console.error('Error drawing photo', err);
              }
            }

            xPos = 110;
            for (const [pIdx, p] of photosAfterList.slice(0, 3).entries()) {
              try {
                doc.addImage(p.arquivo, 'JPEG', xPos, yOffset, 25, 25);
                doc.setFontSize(6);
                doc.setFont('Helvetica', 'normal');
                doc.text(`Depois #${pIdx + 1}`, xPos + 12.5, yOffset + 28, { align: 'center' });
                xPos += 30;
              } catch (err) {
                console.error('Error drawing photo', err);
              }
            }
            yOffset += 34;
          }

          yOffset += 5;
        }
      }

      doc.save(`historico-ar-${eqDetails.codigoInterno}.pdf`);
    } catch (err) {
      console.error('Failed to generate history PDF', err);
      alert('Não foi possível gerar o PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const filteredEquipments = establishment?.equipamentos?.filter((eq) => {
    const matchesSearch = 
      eq.codigoInterno.toLowerCase().includes(search.toLowerCase()) ||
      eq.marca.toLowerCase().includes(search.toLowerCase()) ||
      eq.modelo.toLowerCase().includes(search.toLowerCase()) ||
      eq.localInstalacao.toLowerCase().includes(search.toLowerCase());

    const matchesFilterType = filterType === 'ALL' || eq.tipo === filterType;

    return matchesSearch && matchesFilterType;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium text-sm">Escaneando estabelecimento...</p>
      </div>
    );
  }

  if (error || !establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center">
          <div className="bg-rose-500/10 p-3.5 rounded-2xl text-rose-400 border border-rose-500/20 shadow-inner inline-block mb-4">
            <ThermometerSnowflake size={36} />
          </div>
          <h2 className="text-xl font-bold text-white">Não Encontrado</h2>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            {error || 'Não conseguimos localizar o cadastro deste estabelecimento.'}
          </p>
          <a
            href="/"
            className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold block transition-colors"
          >
            Voltar para a Página Principal
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-955 text-slate-100 relative overflow-hidden flex flex-col justify-between">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Header bar */}
      <header className="bg-slate-900/60 border-b border-slate-900/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 p-2 rounded-xl text-blue-400">
              <ThermometerSnowflake size={22} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block leading-none">CONSULTA PÚBLICA</span>
              <h1 className="font-extrabold text-white text-base leading-tight mt-0.5">{establishment.nome}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Page Body */}
      <main className="max-w-4xl mx-auto w-full px-6 py-8 flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Establishment info & Search Tools */}
        <div className="md:col-span-1 space-y-6">
          <section className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
              <Info className="text-blue-400" size={16} />
              <h2 className="font-bold text-white text-sm">Dados da Unidade</h2>
            </div>
            <div className="space-y-3 text-xs text-slate-300">
              {establishment.documento && (
                <div>
                  <span className="text-slate-500 block">CNPJ / CPF</span>
                  <p className="font-bold">{establishment.documento}</p>
                </div>
              )}
              {establishment.telefone && (
                <div>
                  <span className="text-slate-500 block">Telefone</span>
                  <p className="font-bold">{establishment.telefone}</p>
                </div>
              )}
              {establishment.email && (
                <div>
                  <span className="text-slate-500 block">Contato E-mail</span>
                  <p className="font-bold break-all">{establishment.email}</p>
                </div>
              )}
            </div>
          </section>

          {/* Search bar & Type Filter */}
          <section className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md space-y-4">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Filtrar Aparelhos</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl focus-within:border-blue-500 transition-colors">
                <Search size={14} className="text-slate-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Setor, código, modelo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent border-0 outline-none text-slate-205 placeholder-slate-650 text-xs w-full"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-slate-955 border border-slate-800 px-3 py-2 rounded-xl text-slate-350 text-xs outline-none focus:border-blue-500"
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
          </section>
        </div>

        {/* Right Columns: Equipments list or selected equipment details */}
        <div className="md:col-span-2 space-y-6">
          {selectedEqId && eqDetails ? (
            // DETALHES DO APARELHO SELECIONADO (TIMELINE)
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md space-y-6 relative animate-fadeIn">
              {/* Back to list button */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] text-blue-400 font-bold block">APARELHO SELECIONADO</span>
                  <h2 className="font-extrabold text-white text-base mt-0.5">{eqDetails.codigoInterno}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadHistoryPdf}
                    disabled={generatingPdf}
                    className="flex items-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors"
                  >
                    {generatingPdf ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FileDown size={14} />
                    )}
                    Laudo PDF
                  </button>
                  <button
                    onClick={() => {
                      setSelectedEqId(null);
                      setEqDetails(null);
                    }}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    title="Fechar timeline"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Ficha técnica do aparelho */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                <div>
                  <span className="text-slate-500 block">Marca</span>
                  <p className="font-bold text-slate-200 mt-0.5">{eqDetails.marca}</p>
                </div>
                <div>
                  <span className="text-slate-505 block">Modelo</span>
                  <p className="font-bold text-slate-200 mt-0.5">{eqDetails.modelo}</p>
                </div>
                <div>
                  <span className="text-slate-500 block">N/ Série</span>
                  <p className="font-bold text-slate-200 mt-0.5">{eqDetails.numeroSerie}</p>
                </div>
                <div>
                  <span className="text-slate-500 block">Capacidade</span>
                  <p className="font-bold text-slate-200 mt-0.5">{eqDetails.btu.toLocaleString()} BTUs</p>
                </div>
                <div>
                  <span className="text-slate-500 block">Tipo</span>
                  <p className="font-bold text-slate-200 mt-0.5">{eqDetails.tipo}</p>
                </div>
                <div>
                  <span className="text-slate-500 block">Setor / Local</span>
                  <p className="font-bold text-blue-400 mt-0.5">{eqDetails.localInstalacao}</p>
                </div>
              </div>

              {/* Linha do tempo de manutenção */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider flex items-center gap-2 uppercase">
                  <Wrench className="text-emerald-400" size={16} />
                  Linha do Tempo de Manutenções
                </h3>

                {!eqDetails.manutencoes || eqDetails.manutencoes.length === 0 ? (
                  <div className="bg-slate-950/20 border border-dashed border-slate-850 p-6 rounded-xl text-center text-slate-600 text-xs italic">
                    Nenhuma intervenção técnica registrada para este aparelho.
                  </div>
                ) : (
                  <div className="pl-4 relative before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-800 space-y-6">
                    {eqDetails.manutencoes.map((m: any) => (
                      <div key={m.id} className="relative pl-6 space-y-3 text-xs">
                        <div className="absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full bg-slate-955 border border-emerald-500 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-850 pb-1.5">
                          <span className="font-bold text-slate-200 text-xs leading-none">{m.servicoRealizado}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {new Date(m.dataManutencao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <p className="text-slate-400 leading-relaxed text-[11px]">{m.descricao}</p>

                        {m.pecaTrocada && (
                          <div className="bg-slate-950/50 px-2 py-1 rounded-md border border-slate-800/40 text-[9px] inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Peça: <span className="text-slate-300 font-bold">{m.pecaTrocada} ({m.quantidade})</span>
                          </div>
                        )}

                        {m.fotos && m.fotos.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {m.fotos.filter((f: any) => f.tipo === 'ANTES').length > 0 && (
                              <div className="bg-slate-955/40 p-2 rounded-lg border border-slate-850">
                                <span className="text-[8px] font-black text-blue-400 tracking-wider flex items-center gap-1 mb-1 uppercase">
                                  <Camera size={10} /> ANTES
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {m.fotos.filter((f: any) => f.tipo === 'ANTES').map((f: any) => (
                                    <a key={f.id} href={f.arquivo} target="_blank" rel="noreferrer" className="w-10 h-10 rounded overflow-hidden border border-slate-800 shrink-0 block bg-slate-950">
                                      <img src={f.arquivo} className="w-full h-full object-cover" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            {m.fotos.filter((f: any) => f.tipo === 'DEPOIS').length > 0 && (
                              <div className="bg-slate-955/40 p-2 rounded-lg border border-slate-850">
                                <span className="text-[8px] font-black text-emerald-400 tracking-wider flex items-center gap-1 mb-1 uppercase">
                                  <Camera size={10} /> DEPOIS
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {m.fotos.filter((f: any) => f.tipo === 'DEPOIS').map((f: any) => (
                                    <a key={f.id} href={f.arquivo} target="_blank" rel="noreferrer" className="w-10 h-10 rounded overflow-hidden border border-slate-800 shrink-0 block bg-slate-950">
                                      <img src={f.arquivo} className="w-full h-full object-cover" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="pt-2 flex items-center justify-between gap-4 text-[10px] text-slate-500 border-t border-slate-850">
                          <div className="flex items-center gap-1.5">
                            <UserCheck size={12} className="text-blue-400" />
                            Téc: <span className="text-slate-355 font-bold">{m.tecnicoNome}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckCircle size={12} className="text-emerald-400" />
                            Cli: <span className="text-slate-355 font-bold">{m.contratanteNome}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // LISTAGEM DOS AR-CONDICIONADOS DO ESTABELECIMENTO
            <section className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md space-y-6">
              <h2 className="font-extrabold text-white text-base tracking-tight border-b border-slate-800 pb-3">
                Aparelhos Cadastrados ({filteredEquipments.length})
              </h2>

              {filteredEquipments.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-xs italic">
                  Nenhum ar-condicionado cadastrado ou correspondente aos filtros.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredEquipments.map((eq) => (
                    <div 
                      key={eq.id}
                      onClick={() => handleSelectEquipment(eq.id)}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/50 cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{eq.codigoInterno}</span>
                          <span className="text-[10px] text-slate-500">{eq.tipo}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-200 text-sm">{eq.marca} {eq.modelo}</h4>
                        <div className="flex items-center gap-1 text-slate-400 mt-1.5">
                          <MapPin size={12} className="text-slate-500 shrink-0" />
                          <span className="truncate">Local: <span className="font-semibold text-slate-300">{eq.localInstalacao}</span></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-850 pt-2.5 mt-1">
                        <span className="text-slate-400 font-bold">{eq.btu.toLocaleString()} BTUs</span>
                        <span className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 text-[10px]">
                          Ver histórico
                          <ChevronsRight size={10} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Footer bar */}
      <footer className="max-w-4xl mx-auto w-full px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-650 shrink-0">
        &copy; {new Date().getFullYear()} Cassios Ar-Condicionado. Todos os direitos reservados.
      </footer>
    </div>
  );
}
