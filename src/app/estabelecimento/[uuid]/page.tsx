import PublicEstablishmentTimeline from './EstablishmentTimelineClient';

export function generateStaticParams() {
  return [{ uuid: '1' }];
}

export default function Page() {
  return <PublicEstablishmentTimeline />;
}
