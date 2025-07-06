'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { JoinOnColumn } from '../../components/tools/JoinOnColumn';

export default function JoinOnColumnPage() {
  return (
    <DashboardLayout>
      <JoinOnColumn />
    </DashboardLayout>
  );
}