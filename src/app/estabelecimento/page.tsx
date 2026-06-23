import PublicEstablishmentTimeline from './EstablishmentTimelineClient';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Carregando dados...</div>}>
      <PublicEstablishmentTimeline />
    </Suspense>
  );
}
