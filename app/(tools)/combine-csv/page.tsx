import DashboardLayout from '../../components/layout/DashboardLayout';
import ToolPageTemplate from '../../components/ui/ToolPageTemplate';
import { CombineCsv } from '../../components/tools/CombineCsv';

// export default function CombineCsvPage() {
//   return (
//     <DashboardLayout>
//       <ToolPageTemplate
//         title="Combine CSVs"
//         icon={<FiGitMerge />}
//         status="idle"
//         feedback="Upload at least 2 CSV files to get started."
//         errorDetails={null}
//       >
//         <CombineCsv />
//       </ToolPageTemplate>
//     </DashboardLayout>
//   );
// }

export default function CombineCsvPage() {
  return (
    <DashboardLayout>
      <CombineCsv />
    </DashboardLayout>
  );
}