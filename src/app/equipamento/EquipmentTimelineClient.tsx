'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ApiClient } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
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
  Phone,
  MessageSquare,
  Tag,
  Cpu,
  Barcode,
  Snowflake,
  Layers,
  Building2
} from 'lucide-react';
import jsPDF from 'jspdf';

interface MaintenanceEvent {
  id: string;
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
  fotos: { id: string; tipo: 'ANTES' | 'DEPOIS'; arquivo: string }[];
  materiais?: {
    id: string;
    quantidade: number;
    observacao?: string;
    criadoPor: string;
    material: {
      id: string;
      nome: string;
      categoria: string;
      unidade: string;
    };
  }[];
}

interface EquipmentPublic {
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
  manutencoes: MaintenanceEvent[];
  clienteId?: string | null;
  cliente?: { nome: string };
}

export default function PublicEquipmentTimeline() {
  const searchParams = useSearchParams();
  const uuid = searchParams.get('id');
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [eq, setEq] = useState<EquipmentPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (uuid) {
      fetchPublicDetails();
    }
  }, [uuid]);


  const fetchPublicDetails = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.get(`/equipments/public/${uuid}`);
      setEq(data);
    } catch (err: any) {
      setError(err.message || 'Equipamento não localizado no sistema ou ID inválido.');
    } finally {
      setLoading(false);
    }
  };

  // Advanced client-side PDF history report generator
  const downloadHistoryPdf = async () => {
    if (!eq) return;
    setGeneratingPdf(true);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      let yOffset = 15;

      // Helper function to draw header on every page
      const drawHeader = (pageNumber: number) => {
        doc.setFillColor(15, 23, 42); // slate-900 background
        doc.rect(10, 10, 190, 18, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('CASSIOS CLIMA - RELATÓRIO DE MANUTENÇÃO', 15, 20);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`CÓDIGO INTERNO: ${eq.codigoInterno}  |  EMISSÃO: ${new Date().toLocaleDateString('pt-BR')}`, 15, 25);
        
        // Page index
        doc.text(`Página ${pageNumber}`, 190, 20, { align: 'right' });
      };

      // Helper to check and add new page
      const checkPageBreak = (neededHeight: number, pageNum: { current: number }) => {
        if (yOffset + neededHeight > 280) {
          doc.addPage();
          pageNum.current += 1;
          drawHeader(pageNum.current);
          yOffset = 40; // reset yOffset below header
          return true;
        }
        return false;
      };

      const pageNum = { current: 1 };
      drawHeader(pageNum.current);
      yOffset = 40;

      // Part 1: Equipment metadata & QR Code
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('1. DADOS TÉCNICOS DO AR-CONDICIONADO', 12, yOffset);
      yOffset += 6;

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(10, yOffset - 1, 200, yOffset - 1);

      // Metadata Table fields
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      
      const fields = [
        ['Código Interno:', eq.codigoInterno, 'Marca:', eq.marca],
        ['Modelo:', eq.modelo, 'N/ Série:', eq.numeroSerie],
        ['Capacidade:', `${eq.btu.toLocaleString()} BTUs`, 'Tipo:', eq.tipo],
        ['Instalação:', new Date(eq.dataInstalacao).toLocaleDateString('pt-BR'), 'Estabelecimento:', eq.cliente?.nome || 'Não informado'],
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

      // Address specs
      doc.setFont('Helvetica', 'bold');
      doc.text('Endereço / Setor:', 15, yOffset);
      doc.setFont('Helvetica', 'normal');
      doc.text(`${eq.localInstalacao} - ${eq.endereco}`, 45, yOffset);
      yOffset += 8;

      // Embed QR Code tag image
      try {
        doc.addImage(eq.qrCode, 'PNG', 150, 35, 45, 45);
      } catch (err) {
        console.error('Failed to embed QR code in PDF', err);
      }

      yOffset = Math.max(yOffset, 85);

      // Part 2: Maintenance Timeline
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.text('2. HISTÓRICO COMPLETO DE MANUTENÇÕES', 12, yOffset);
      yOffset += 6;
      doc.line(10, yOffset - 1, 200, yOffset - 1);

      if (eq.manutencoes.length === 0) {
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('Nenhuma manutenção registrada para este aparelho.', 15, yOffset);
      } else {
        for (const [index, m] of eq.manutencoes.entries()) {
          checkPageBreak(50, pageNum);

          doc.setFillColor(248, 250, 252);
          doc.rect(10, yOffset, 190, 8, 'F');
          
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);
          doc.text(`${index + 1}. SERVIÇO: ${m.servicoRealizado.toUpperCase()}`, 13, yOffset + 5.5);
          doc.text(`DATA: ${new Date(m.dataManutencao).toLocaleDateString('pt-BR')}`, 197, yOffset + 5.5, { align: 'right' });
          yOffset += 12;

          // Description block
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          const splitDescription = doc.splitTextToSize(`Descrição: ${m.descricao}`, 180);
          doc.text(splitDescription, 15, yOffset);
          yOffset += (splitDescription.length * 4.5) + 3;

          // Spare parts details
          if ((m.materiais && m.materiais.length > 0) || m.pecaTrocada) {
            const count = (m.materiais?.length || 0) + (m.pecaTrocada ? 1 : 0);
            checkPageBreak(5 * count + 8, pageNum);
            doc.setFont('Helvetica', 'bold');
            doc.text('Peças e Materiais Utilizados:', 15, yOffset);
            yOffset += 5;
            doc.setFont('Helvetica', 'normal');
            if (m.materiais && m.materiais.length > 0) {
              for (const mat of m.materiais) {
                const text = `- ${mat.material.nome}: ${mat.quantidade} ${mat.material.unidade}${mat.observacao ? ` (Obs: ${mat.observacao})` : ''}`;
                doc.text(text, 18, yOffset);
                yOffset += 4.5;
              }
            }
            if ((!m.materiais || m.materiais.length === 0) && m.pecaTrocada) {
              const text = `- ${m.pecaTrocada}: ${m.quantidade || 1} UN`;
              doc.text(text, 18, yOffset);
              yOffset += 4.5;
            }
            yOffset += 1.5;
          }

          // Signatures block check
          checkPageBreak(25, pageNum);
          doc.setFont('Helvetica', 'bold');
          doc.text(`Técnico Responsável: ${m.tecnicoNome}`, 15, yOffset);
          doc.text(`Contratante / Autorizante: ${m.contratanteNome}`, 110, yOffset);
          yOffset += 4;

          // Embed signature images
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

          // Photos section check (if photos exist)
          const photosBeforeList = m.fotos.filter((f) => f.tipo === 'ANTES');
          const photosAfterList = m.fotos.filter((f) => f.tipo === 'DEPOIS');
          const hasPhotos = photosBeforeList.length > 0 || photosAfterList.length > 0;

          if (hasPhotos) {
            checkPageBreak(50, pageNum);
            doc.setFont('Helvetica', 'bold');
            doc.text('Evidências Fotográficas:', 15, yOffset);
            yOffset += 4;

            let xPos = 15;
            // Add up to 3 before photos
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
            // Add up to 3 after photos
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

          yOffset += 5; // spacing between timeline events
        }
      }

      // Save PDF output
      doc.save(`historico-ar-${eq.codigoInterno}.pdf`);
    } catch (err) {
      console.error('Failed to generate history PDF', err);
      alert('Não foi possível gerar o PDF. Verifique a resolução das imagens de assinatura ou fotos.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium text-sm">Escaneando equipamento...</p>
      </div>
    );
  }

  if (error || !eq) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center">
          <div className="bg-rose-500/10 p-3.5 rounded-2xl text-rose-400 border border-rose-500/20 shadow-inner inline-block mb-4">
            <ThermometerSnowflake size={36} />
          </div>
          <h2 className="text-xl font-bold text-white">Não Encontrado</h2>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            {error || 'Não conseguimos localizar o cadastro deste equipamento de ar-condicionado.'}
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
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden flex flex-col justify-between">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      {/* Header bar */}
      <header className="bg-gradient-to-r from-sky-100/90 via-sky-50/85 to-blue-100/90 border-b border-sky-200/60 backdrop-blur-md sticky top-0 z-20 shrink-0 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-blue-500 to-sky-400 p-2 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Snowflake size={18} className="animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <h1 className="font-black text-slate-800 text-base leading-none tracking-wide">Empório Do Ar</h1>
              <span className="text-[8px] text-slate-500 font-extrabold block tracking-wider uppercase mt-1 leading-none">SISTEMA DE GESTÃO DE MANUTENÇÃO</span>
            </div>
          </div>
          
          <button
            onClick={downloadHistoryPdf}
            disabled={generatingPdf}
            className="flex items-center gap-2 py-2 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:from-sky-500/50 disabled:to-blue-600/50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            {generatingPdf ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Gerando...
              </>
            ) : (
              <>
                <FileDown size={14} />
                Baixar Laudo PDF
              </>
            )}
          </button>
        </div>
      </header>

      {/* Page Body */}
      <main className="max-w-3xl mx-auto w-full px-6 py-8 flex-1 space-y-8">
        
        {/* Co-Branding Contact Banner */}
        <section className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-5">
            <div className="bg-white p-1 rounded-2xl border border-slate-800/60 flex items-center justify-center shrink-0 w-44 h-20 relative overflow-hidden shadow-inner">
              <img 
                src="/logo-emporio.png" 
                alt="Empório do Ar" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base">Empório do Ar Refrigeração</h2>
              <p className="text-slate-400 text-xs mt-1">Assistência técnica autorizada e especializada em ar-condicionado.</p>
            </div>
          </div>
          
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl flex flex-col gap-2 w-full md:w-60 shadow-lg">
            <div className="text-[9px] font-bold text-slate-500 text-center uppercase tracking-wider">Central de Atendimento</div>
            <a 
              href="tel:+556436511155" 
              className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800/80 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition-all"
            >
              <Phone size={13} className="text-slate-400" />
              +55 (64) 3651-1155
            </a>
            <a 
              href="https://wa.me/5564984505754" 
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800/80 rounded-xl text-xs font-bold text-emerald-450 hover:text-emerald-350 transition-all"
            >
              <MessageSquare size={13} className="text-emerald-450" />
              +55 (64) 98450-5754
            </a>
          </div>
        </section>

        {/* Section 1: Specifications Card */}
        <section className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-md space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800/60">
            <Info className="text-blue-400" size={20} />
            <h2 className="font-extrabold text-white text-base">Ficha Técnica do Equipamento</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
            <div>
              <span className="text-slate-500 flex items-center gap-1.5">
                <Tag size={12} className="text-slate-600" />
                Marca
              </span>
              <p className="font-bold text-slate-200 mt-0.5">{eq.marca}</p>
            </div>
            <div>
              <span className="text-slate-500 flex items-center gap-1.5">
                <Cpu size={12} className="text-slate-600" />
                Modelo
              </span>
              <p className="font-bold text-slate-200 mt-0.5">{eq.modelo}</p>
            </div>
            <div>
              <span className="text-slate-500 flex items-center gap-1.5">
                <Barcode size={12} className="text-slate-600" />
                Nº Série
              </span>
              <p className="font-bold text-slate-200 mt-0.5">{eq.numeroSerie}</p>
            </div>
            <div>
              <span className="text-slate-500 flex items-center gap-1.5">
                <Snowflake size={12} className="text-slate-600" />
                Capacidade
              </span>
              <p className="font-bold text-slate-200 mt-0.5">{eq.btu.toLocaleString()} BTUs</p>
            </div>
            <div>
              <span className="text-slate-500 flex items-center gap-1.5">
                <Layers size={12} className="text-slate-600" />
                Tipo
              </span>
              <p className="font-bold text-slate-200 mt-0.5">{eq.tipo}</p>
            </div>
            <div>
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-600" />
                Data de Instalação
              </span>
              <p className="font-bold text-slate-200 mt-0.5">
                {new Date(eq.dataInstalacao).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <span className="text-slate-500 flex items-center gap-1.5">
                <Building2 size={12} className="text-slate-600" />
                Estabelecimento
              </span>
              <p className="font-bold text-blue-400 mt-0.5">{eq.cliente?.nome || 'Sem Estabelecimento'}</p>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Identificador Único</span>
              <p className="font-mono text-slate-400 text-[10px] break-all mt-0.5">{eq.id}</p>
            </div>
          </div>

          {/* Preventive Maintenance Schedule Status (Public View) */}
          {eq.proximaManutencao && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/60 mt-4 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block">Próxima Manutenção Preventiva</span>
                <p className="font-bold text-slate-200 mt-0.5">
                  {new Date(eq.proximaManutencao).toLocaleDateString('pt-BR')} (a cada {eq.frequenciaManutencao ?? 6} meses)
                </p>
              </div>
              <div>
                {new Date(eq.proximaManutencao) < new Date() ? (
                  <span className="px-3 py-1 bg-red-950 border border-red-800 text-red-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    ⚠️ Atrasada
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    ✅ Em dia
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800/60 flex items-start gap-2.5 text-xs text-slate-400">
            <MapPin size={16} className="text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-500 text-[10px] block font-semibold">LOCAL DE INSTALAÇÃO</span>
              <p className="font-semibold text-slate-300 mt-0.5 leading-tight">
                {eq.localInstalacao} - {eq.endereco}
              </p>
            </div>
          </div>

          {eq.observacoes && (
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/40 text-xs">
              <span className="text-slate-500 text-[10px] block font-semibold">OBSERVAÇÕES DE CADASTRO</span>
              <p className="text-slate-400 italic leading-relaxed mt-1">
                "{eq.observacoes}"
              </p>
            </div>
          )}
        </section>

        {/* Section 2: Timeline Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5">
            <Wrench className="text-emerald-400" size={20} />
            <h2 className="font-extrabold text-white text-base">Linha do Tempo de Manutenções</h2>
          </div>

          {eq.manutencoes.length === 0 ? (
            <div className="bg-slate-900/20 border border-slate-900 border-dashed p-8 rounded-2xl text-center text-slate-500 text-sm italic">
              Nenhuma intervenção técnica registrada.
            </div>
          ) : (
            <div className="pl-4 relative before:absolute before:left-[9px] before:top-3 before:bottom-3 before:w-[1px] before:bg-slate-800 space-y-8">
              {eq.manutencoes.map((m) => (
                <div key={m.id} className="relative pl-8 space-y-4">
                  {/* Timeline point */}
                  <div className="absolute -left-[20px] top-1 w-[22px] h-[22px] rounded-full bg-emerald-500 border border-emerald-300 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>

                  {/* Header card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900/60 pb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-black text-slate-200 tracking-wide">{m.servicoRealizado}</span>
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full">
                        VERIFICADO
                      </span>
                    </div>
                    <span className="text-slate-500 text-xs font-semibold flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(m.dataManutencao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {/* Description details */}
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {m.descricao}
                  </p>

                  {/* Spare parts detail */}
                  {(m.materiais && m.materiais.length > 0) || m.pecaTrocada ? (
                    <div className="p-3 rounded-xl bg-slate-900/30 border border-slate-800/40 text-xs space-y-1">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Peças e Materiais Utilizados:</div>
                      <div className="divide-y divide-slate-800/30">
                        {m.materiais && m.materiais.map((mat: any, mIdx: number) => (
                          <div key={mIdx} className="py-1 flex justify-between items-center text-slate-300">
                            <div>
                              <span className="font-semibold text-slate-200">{mat.material.nome}</span>
                              {mat.observacao && <span className="text-[10px] text-slate-500 italic block">Obs: {mat.observacao}</span>}
                            </div>
                            <div className="font-bold text-blue-400">
                              {mat.quantidade} <span className="text-[10px] text-slate-500 font-normal">{mat.material.unidade}</span>
                            </div>
                          </div>
                        ))}
                        {(!m.materiais || m.materiais.length === 0) && m.pecaTrocada && (
                          <div className="py-1 flex justify-between items-center text-slate-300">
                            <div>
                              <span className="font-semibold text-slate-200">{m.pecaTrocada}</span>
                            </div>
                            <div className="font-bold text-blue-400">
                              {m.quantidade || 1} <span className="text-[10px] text-slate-500 font-normal">UN</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Before/After Photos Side-by-Side displaying */}
                  {m.fotos && m.fotos.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {/* Before Photos */}
                      {m.fotos.filter((f) => f.tipo === 'ANTES').length > 0 && (
                        <div className="bg-slate-900/20 p-3 rounded-xl border border-slate-900/60">
                          <span className="text-[10px] font-black text-blue-400 tracking-wider flex items-center gap-1 mb-2 uppercase">
                            <Camera size={12} /> ANTES
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {m.fotos.filter((f) => f.tipo === 'ANTES').map((f) => (
                              <a 
                                key={f.id} 
                                href={f.arquivo} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-16 h-16 rounded-lg overflow-hidden border border-slate-800 hover:border-slate-700 transition-colors shrink-0 block bg-slate-950"
                              >
                                <img src={f.arquivo} className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* After Photos */}
                      {m.fotos.filter((f) => f.tipo === 'DEPOIS').length > 0 && (
                        <div className="bg-slate-900/20 p-3 rounded-xl border border-slate-900/60">
                          <span className="text-[10px] font-black text-emerald-400 tracking-wider flex items-center gap-1 mb-2 uppercase">
                            <Camera size={12} /> DEPOIS
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {m.fotos.filter((f) => f.tipo === 'DEPOIS').map((f) => (
                              <a 
                                key={f.id} 
                                href={f.arquivo} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-16 h-16 rounded-lg overflow-hidden border border-slate-800 hover:border-slate-700 transition-colors shrink-0 block bg-slate-950"
                              >
                                <img src={f.arquivo} className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Signatures verification bar */}
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/50 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <UserCheck size={16} className="text-blue-400 shrink-0" />
                      <div>
                        Técnico Responsável: <span className="text-slate-200 font-bold">{m.tecnicoNome}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                      <div>
                        Contratante / Autorizado: <span className="text-slate-200 font-bold">{m.contratanteNome}</span>
                      </div>
                    </div>
                  </div>

                  {m.observacoes && (
                    <p className="text-[11px] text-slate-500 italic px-2">Obs: "{m.observacoes}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer bar */}
      <footer className="max-w-4xl mx-auto w-full px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-600 shrink-0">
        &copy; {new Date().getFullYear()} Cassios Ar-Condicionado. Todos os direitos reservados.
      </footer>
    </div>
  );
}
