'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiGithub, FiGrid, FiGitCommit, FiGitMerge, FiLink2, FiCopy, FiColumns } from 'react-icons/fi';

const tools = [
  { name: 'JSON to CSV', href: '/json-to-csv', icon: <FiGrid /> },
  { name: 'Split CSV', href: '/split-csv', icon: <FiGitCommit /> },
  { name: 'Combine CSVs', href: '/combine-csv', icon: <FiGitMerge /> },
  { name: 'Join on Column', href: '/join-on-column', icon: <FiLink2 /> },
  { name: 'Merge Side-by-Side', href: '/merge-side-by-side', icon: <FiColumns /> },
  { name: 'Remove Duplicates', href: '/remove-duplicates', icon: <FiCopy /> },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-slate-800/70 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/json-to-csv" className="flex-shrink-0 flex items-center">
              <span className="ml-3 text-xl font-bold text-slate-200">CSV Toolkit</span>
            </Link>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-1">
            {tools.map((tool) => {
              const isActive = pathname === tool.href;
              return (
                <Link
                  key={tool.name}
                  href={tool.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {tool.icon}
                  <span className="ml-2">{tool.name}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex items-center">
            <a
              href="https://github.com/bashir0609/csv-toolkit-web/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <span className="sr-only">GitHub</span>
              <FiGithub className="h-6 w-6" />
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
