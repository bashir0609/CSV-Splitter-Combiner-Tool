import DashboardLayout from '../../components/DashboardLayout';
import ToolPageTemplate from '../../components/ToolPageTemplate';
import { CombineCsv } from '../../components/CombineCsv';

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