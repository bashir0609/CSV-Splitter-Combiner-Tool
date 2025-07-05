import DashboardLayout from '../../components/DashboardLayout';
import { RemoveBlankColumns } from '../../components/RemoveBlankColumns';

export default function RemoveBlankColumnsPage() {
  return (
    <DashboardLayout>        
      <div className="w-full max-w-2xl mx-auto">
        <RemoveBlankColumns />
      </div>
    </DashboardLayout>
  );
}