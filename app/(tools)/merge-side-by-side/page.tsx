'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import DashboardLayout from '../../components/DashboardLayout';
import { MergeSideBySide } from '../../components/MergeSideBySide';

export default function MergeSideBySidePage() {
  return (
    <DashboardLayout>
      <MergeSideBySide />
    </DashboardLayout>
  );
}