'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { MergeSideBySide } from '../../components/tools/MergeSideBySide';

export default function MergeSideBySidePage() {
  return (
    <DashboardLayout>
      <MergeSideBySide />
    </DashboardLayout>
  );
}