'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { VLookup } from '../../components/tools/Vlookup';

export default function VLookupPage() {
  return (
    <DashboardLayout>
      <VLookup />
    </DashboardLayout>
  );
}