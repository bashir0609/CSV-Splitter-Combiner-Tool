import { FiGithub, FiHeart } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-slate-800/50 border-t border-slate-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 text-sm text-slate-400">
          <div className="flex items-center">
            <FiHeart className="mr-2 text-red-500" />
            <span>
              Built by{' '}
              <a
                https://github.com/bashir0609/" // <-- IMPORTANT: Update this link
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-sky-400 hover:text-sky-300 transition-colors"
              >
                Your Name
              </a>
            </span>
          </div>
          <div className="flex items-center">
            <a
              href="https://github.com/bashir0609/csv-toolkit-web" // <-- IMPORTANT: Update this link
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-white transition-colors"
            >
              <FiGithub className="mr-2" />
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
