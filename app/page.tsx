import DashboardLayout from './components/layout/DashboardLayout';
import JsonToCsv from './components/tools/JsonToCsv';
import JsonToCsv from './components/tools/CombineCsv';
import JsonToCsv from './components/tools/JoinOnColumn';
import JsonToCsv from './components/tools/MergeSideBySide';
import JsonToCsv from './components/tools/RemoveBlankColumns';
import JsonToCsv from './components/tools/RemoveDuplicates';
import JsonToCsv from './components/tools/SplitCsv';
import JsonToCsv from './components/tools/Vlookup';

export default function Home() {
  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto">
        <JsonToCsv />
      </div>
    </DashboardLayout>
  );
}
