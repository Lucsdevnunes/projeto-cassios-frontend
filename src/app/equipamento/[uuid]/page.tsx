import PublicEquipmentTimeline from './EquipmentTimelineClient';

export function generateStaticParams() {
  return [{ uuid: '1' }];
}

export default function Page() {
  return <PublicEquipmentTimeline />;
}
