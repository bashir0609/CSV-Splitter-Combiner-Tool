// app/page.tsx
import DashboardLayout from './components/layout/DashboardLayout';
import JsonToCsv from './components/tools/JsonToCsv';
import { CombineCsv } from './components/tools/CombineCsv';
import { JoinOnColumn } from './components/tools/JoinOnColumn';
import { MergeSideBySide } from './components/tools/MergeSideBySide';
import { RemoveBlankColumns } from './components/tools/RemoveBlankColumns';
import { RemoveDuplicates } from './components/tools/RemoveDuplicates';
import SplitCsv from './components/tools/SplitCsv';
import { VLookup } from './components/tools/VLookup';

export default function Home() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-4">
              CSV Toolkit
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              A powerful collection of tools for processing, transforming, and analyzing CSV data. 
              All processing happens in your browser for maximum privacy and speed.
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* JSON to CSV */}
            <a href="/json-to-csv" className="group block">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-sky-500 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10">
                <div className="text-3xl mb-4">📄</div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2 group-hover:text-sky-400 transition-colors">
                  JSON to CSV
                </h3>
                <p className="text-slate-400 text-sm">
                  Convert JSON files to CSV format with smart column detection and array flattening.
                </p>
              </div>
            </a>

            {/* Split CSV */}
            <a href="/split-csv" className="group block">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-sky-500 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10">
                <div className="text-3xl mb-4">✂️</div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2 group-hover:text-sky-400 transition-colors">
                  Split CSV
                </h3>
                <p className="text-slate-400 text-sm">
                  Split large CSV files into smaller chunks with customizable row limits.
                </p>
              </div>
            </a>

            {/* Combine CSVs */}
            <a href="/combine-csv" className="group block">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-sky-500 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10">
                <div className="text-3xl mb-4">🔗</div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2 group-hover:text-sky-400 transition-colors">
                  Combine CSVs
                </h3>
                <p className="text-slate-400 text-sm">
                  Merge multiple CSV files with intelligent column mapping and duplicate removal.
                </p>
              </div>
            </a>

            {/* Merge Side-by-Side */}
            <a href="/merge-side-by-side" className="group block">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-sky-500 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10">
                <div className="text-3xl mb-4">↔️</div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2 group-hover:text-sky-400 transition-colors">
                  Merge Side-by-Side
                </h3>
                <p className="text-slate-400 text-sm">
                  VLOOKUP-style merging using key columns to combine related data.
                </p>
              </div>
            </a>

            {/* Join on Column */}
            <a href="/join-on-column" className="group block">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-sky-500 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10">
                <div className="text-3xl mb-4">🔗</div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2 group-hover:text-sky-400 transition-colors">
                  Join on Column
                </h3>
                <p className="text-slate-400 text-sm">
                  Database-style joins with Inner, Left, Right, and Outer join options.
                </p>
              </div>
            </a>

            {/* VLOOKUP */}
            <a href="/vlookup" className="group block">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-sky-500 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10">
                <div className="text-3xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2 group-hover:text-sky-400 transition-colors">
                  VLOOKUP
                </h3>
                <p className="text-slate-400 text-sm">
                  Excel-style lookup operations with multiple return columns and match types.
                </p>
              </div>
            </a>

            {/* Remove Duplicates */}
            <a href="/remove-duplicates" className="group block">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-sky-500 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10">
                <div className="text-3xl mb-4">🗑️</div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2 group-hover:text-sky-400 transition-colors">
                  Remove Duplicates
                </h3>
                <p className="text-slate-400 text-sm">
                  Eliminate duplicate rows with configurable matching criteria.
                </p>
              </div>
            </a>

            {/* Remove Blank Columns */}
            <a href="/remove-blank-columns" className="group block">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-sky-500 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10">
                <div className="text-3xl mb-4">🧹</div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2 group-hover:text-sky-400 transition-colors">
                  Remove Blank Columns
                </h3>
                <p className="text-slate-400 text-sm">
                  Clean up empty columns with customizable threshold settings.
                </p>
              </div>
            </a>
          </div>

          {/* Features Section */}
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
            <h2 className="text-2xl font-bold text-slate-100 mb-6 text-center">
              Why Choose CSV Toolkit?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-3">🔒</div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">Privacy First</h3>
                <p className="text-slate-400 text-sm">
                  All processing happens in your browser. Your data never leaves your device.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">Lightning Fast</h3>
                <p className="text-slate-400 text-sm">
                  Optimized for large files with efficient processing algorithms.
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="text-lg font-semibold text-slate-200 mb-2">Easy to Use</h3>
                <p className="text-slate-400 text-sm">
                  Intuitive interface with step-by-step workflows and live previews.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
      }
