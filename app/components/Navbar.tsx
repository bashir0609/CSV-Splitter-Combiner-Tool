'use client';

import Link from 'next/link';
import { FiGithub, FiGrid } from 'react-icons/fi';

const tools = [
  { name: 'JSON to CSV', href: '/', icon: <FiGrid /> },
  // { name: 'Split CSV', href: '/split-csv', icon: <FiGitCommit /> }, // Example for future tools
  // { name: 'Combine CSVs', href: '/combine-csv', icon: <FiGitMerge /> }, // Example for future tools
];

export default function Navbar() {
  return (
    <header className="bg-slate-800/70 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <img className="h-8 w-auto" src="https://raw.githubusercontent.com/user-attachments/assets/dd35c05c-a50d-4959-b13c-c609c123689f" alt="CSV Toolkit Logo" />
              <span className="ml-3 text-xl font-bold text-slate-200">CSV Toolkit</span>
            </Link>
          </div>
          <div className="hidden md:flex md:items-center md:space-x-4">
            {tools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {tool.icon}
                <span className="ml-2">{tool.name}</span>
              </Link>
            ))}
          </div>
          <div className="flex items-center">
            <a
              href="https://github.com/your-username/your-repo-name" // <-- IMPORTANT: Update this link
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
