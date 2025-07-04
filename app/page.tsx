import DashboardLayout from './components/DashboardLayout';
import JsonToCsv from './components/JsonToCsv';

export default function Home() {
  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto">
        <JsonToCsv />
      </div>
    </DashboardLayout>
  );
}
