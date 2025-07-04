import DashboardLayout from '../../components/DashboardLayout';
import SplitCsv from '../../components/SplitCsv';

export default function SplitCsvPage() {
  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto">
        <SplitCsv />
      </div>
    </DashboardLayout>
  );
}
