'use client';

import dynamic from 'next/dynamic';
import DashboardLayout from '../../components/DashboardLayout';

// Dynamically import with no SSR
const RemoveBlankColumns = dynamic(
  () => import('../../components/RemoveBlankColumns').then(mod => ({ default: mod.RemoveBlankColumns })),
  { ssr: false }
);

export default function RemoveBlankColumnsPage() {
  return (
    <DashboardLayout>        
      <div className="w-full max-w-2xl mx-auto">
        <RemoveBlankColumns />
      </div>
    </DashboardLayout>
  );
}