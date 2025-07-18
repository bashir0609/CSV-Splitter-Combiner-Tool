import DashboardLayout from '../../components/layout/DashboardLayout';
import JsonToCsv from '../../components/tools/JsonToCsv';

export default function JsonToCsvPage() {
  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto">
        <JsonToCsv />
      </div>
    </DashboardLayout>
  );
}
