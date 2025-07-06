'use client';

import { FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import ErrorDisplay from './ui/ErrorDisplay';

// Define the props the template will accept
interface ToolPageTemplateProps {
  title: string;
  icon: React.ReactNode; // Allows passing in any icon component
  status: 'idle' | 'processing' | 'success' | 'error';
  feedback: string;
  errorDetails: string | null;
  children: React.ReactNode; // This will be the unique form for each tool
}

export default function ToolPageTemplate({
  title,
  icon,
  status,
  feedback,
  errorDetails,
  children,
}: ToolPageTemplateProps) {
  
  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'processing': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl shadow-slate-950/50 p-6 sm:p-8 text-center">
      
      {/* Header Section */}
      <div className="flex justify-center items-center mb-4">
        <div className="text-sky-400 text-4xl mr-3">{icon}</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">{title}</h1>
      </div>

      {/* Feedback Message Section */}
      <p className={`mt-4 mb-6 h-10 flex items-center justify-center text-sm sm:text-base ${getStatusColor()}`}>
        {status === 'success' && <FiCheckCircle className="mr-2" />}
        {status === 'error' && <FiAlertTriangle className="mr-2" />}
        {feedback}
      </p>

      {/* Main Content Area (where the unique form goes) */}
      <div>{children}</div>

      {/* Error Display Section */}
      <ErrorDisplay errorDetails={errorDetails} />
    </div>
  );
}
