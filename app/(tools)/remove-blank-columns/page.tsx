'use client';

import dynamic from 'next/dynamic';
import DashboardLayout from '../../components/layout/DashboardLayout';

// Dynamically import with no SSR
const RemoveBlankColumns = dynamic(
  () => import('../../components/tools/RemoveBlankColumns').then(mod => ({ default: mod.RemoveBlankColumns })),
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