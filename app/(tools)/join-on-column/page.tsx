'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import DashboardLayout from '../../components/DashboardLayout';
import { JoinOnColumn } from '../../components/JoinOnColumn';

export default function JoinOnColumnPage() {
  return (
    <DashboardLayout>
      <JoinOnColumn />
    </DashboardLayout>
  );
}