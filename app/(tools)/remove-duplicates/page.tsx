'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { RemoveDuplicates } from '../../components/tools/RemoveDuplicates';

export default function RemoveDuplicatesPage() {
  return (
    <DashboardLayout>
      <RemoveDuplicates />
    </DashboardLayout>
  );
}