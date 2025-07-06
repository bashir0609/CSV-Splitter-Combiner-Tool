'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import DashboardLayout from '../../components/DashboardLayout';
import { RemoveDuplicates } from '../../components/RemoveDuplicates';

export default function RemoveDuplicatesPage() {
  return (
    <DashboardLayout>
      <RemoveDuplicates />
    </DashboardLayout>
  );
}