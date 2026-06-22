'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ThermometerSnowflake, 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  Camera, 
  Upload, 
  X, 
  Sparkles,
  AlertTriangle 
} from 'lucide-react';
import jsQR from 'jsqr';

export default function Home() {
  const [uuid, setUuid] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const router = useRouter();

  // QR Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Stop camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uuid.trim()) {
      setError('Por favor, informe o UUID do equipamento.');
      return;
    }
    setError('');
    router.push(`/equipamento/${uuid.trim()}`);
  };

  // Helper to parse scanned content
  const handleDecodedText = (text: string) => {
    let parsedUuid = text.trim();
    
    // Check for establishment QR code
    if (text.includes('/estabelecimento/')) {
      const parts = text.split('/estabelecimento/');
      const establishmentUuid = parts[parts.length - 1].split('?')[0];
      if (establishmentUuid.length > 10) {
        stopCamera();
        setSuccessMsg('QR Code de Estabelecimento detectado! Redirecionando...');
        setTimeout(() => {
          router.push(`/estabelecimento/${establishmentUuid}`);
        }, 1000);
        return;
      }
    }

    // Check for independent equipment QR code
    if (text.includes('/equipamento/')) {
      const parts = text.split('/equipamento/');
      parsedUuid = parts[parts.length - 1].split('?')[0];
    }

    if (parsedUuid.length > 10) {
      stopCamera();
      setSuccessMsg('QR Code de Equipamento detectado! Redirecionando...');
      setTimeout(() => {
        router.push(`/equipamento/${parsedUuid}`);
      }, 1000);
    } else {
      setError('O conteúdo do QR Code lido não é um identificador válido de estabelecimento ou equipamento.');
    }
  };

  // 1. Camera Scanner Control
  const startCamera = async () => {
    setError('');
    setSuccessMsg('');
    setIsScanning(true);
    setCameraPermission(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      });
      
      streamRef.current = stream;
      setCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        videoRef.current.play();
        
        // Start decoding loop
        scanIntervalRef.current = window.setInterval(scanFrame, 250);
      }
    } catch (err) {
      console.error('Camera access failed', err);
      setCameraPermission(false);
      setError('Permissão da câmera negada ou dispositivo indisponível.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const scanFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Only scan if video is playing and ready
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = document.createElement('canvas');
      // Downscale slightly for faster parsing
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          handleDecodedText(code.data);
        }
      }
    }
  };

  // 2. File Uploader QR Decoder
  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccessMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            handleDecodedText(code.data);
          } else {
            setError('Não foi possível identificar um QR Code na imagem fornecida. Verifique se o código está nítido.');
          }
        }
      };
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[160px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-900 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/20 p-2 rounded-xl text-blue-400">
            <ThermometerSnowflake size={28} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-wider text-white">CASSIOS</h1>
            <span className="text-[10px] text-slate-400 tracking-wider">HVAC PLATFORM</span>
          </div>
        </div>
        <Link 
          href="/login"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30"
        >
          Área do Técnico
          <ArrowRight size={16} />
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
          <ShieldCheck size={14} />
          Rastreabilidade Completa via QR Code Permanente
        </div>
        
        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-3xl">
          Consulte o Histórico de Manutenção do seu <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">Ar-Condicionado</span>
        </h2>
        
        <p className="mt-6 text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
          Cada equipamento possui um QR Code exclusivo e permanente que funciona como seu CPF. Use a câmera para escanear, faça upload do código ou digite o UUID do aparelho.
        </p>

        {/* Live QR Scanner Overlay */}
        {isScanning && (
          <div className="mt-8 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Sparkles size={14} className="text-blue-400 animate-pulse" />
                Escaneando QR Code
              </span>
              <button 
                onClick={stopCamera}
                className="p-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Video preview container */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 aspect-video bg-black flex items-center justify-center">
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover"
              />
              {/* Target scanner bounding box */}
              <div className="absolute inset-0 border-2 border-dashed border-blue-500/40 m-8 rounded-xl pointer-events-none flex items-center justify-center">
                {/* Laser animation line */}
                <div className="w-full h-[1.5px] bg-blue-500 shadow-md shadow-blue-500/80 absolute animate-scan"></div>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 mt-3">
              Aponte a câmera para o QR Code físico fixado no ar-condicionado.
            </p>
          </div>
        )}

        {/* Action controls (Scanner & Uploader Buttons) */}
        {!isScanning && (
          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            {/* Camera scanner */}
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 cursor-pointer"
            >
              <Camera size={18} />
              Escanear com Câmera
            </button>

            {/* File uploader trigger */}
            <button
              onClick={handleTriggerUpload}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
            >
              <Upload size={18} />
              Enviar Imagem do QR
            </button>

            {/* Hidden Input File */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Success / Loading indicator */}
        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl max-w-md w-full">
            {successMsg}
          </div>
        )}

        {/* Error indicators */}
        {error && (
          <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl max-w-md w-full flex items-start gap-3 text-left">
            <AlertTriangle className="shrink-0 mt-0.5" size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="text-slate-600 text-xs my-6">ou digite o UUID manualmente</div>

        {/* Manual Search Form */}
        <form onSubmit={handleSearch} className="w-full max-w-lg">
          <div className="flex flex-col md:flex-row gap-3 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-2xl">
            <div className="flex-1 flex items-center gap-3 px-3">
              <Search className="text-slate-500 shrink-0" size={20} />
              <input
                type="text"
                placeholder="Insira o código UUID do Equipamento..."
                value={uuid}
                onChange={(e) => setUuid(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-slate-200 placeholder-slate-600 text-sm py-2"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
            >
              Consultar
            </button>
          </div>
        </form>

        {/* Feature grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left">
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm">
            <h3 className="font-bold text-slate-200">1. QR Code Único</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              O código fica afixado no aparelho. A leitura leva você direto para a página de especificações e linha do tempo de manutenção.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm">
            <h3 className="font-bold text-slate-200">2. Timeline Permanente</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Todas as preventivas, corretivas e higienizações ficam registradas com fotos, peças trocadas e assinaturas dos envolvidos.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm">
            <h3 className="font-bold text-slate-200">3. Auditoria e Laudos</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Exportação de relatórios em PDF com assinaturas digitais, fotos de auditoria (antes/depois) e rastreabilidade para conformidade.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-8 border-t border-slate-900 text-center text-xs text-slate-600 z-10">
        &copy; {new Date().getFullYear()} Cassios Ar-Condicionado. Todos os direitos reservados.
      </footer>
    </div>
  );
}
