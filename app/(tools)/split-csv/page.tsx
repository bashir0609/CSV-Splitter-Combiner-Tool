import DashboardLayout from '../../components/layout/DashboardLayout';
import SplitCsv from '../../components/tools/SplitCsv';

export default function SplitCsvPage() {
  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto">
        <SplitCsv />
      </div>
    </DashboardLayout>
  );
}
