'use client';
import { FiTool } from 'react-icons/fi';

interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-800/50 border border-slate-700 rounded-2xl">
      <FiTool className="mx-auto text-5xl text-sky-400 mb-6" />
      <h1 className="text-4xl font-bold text-slate-200">{title}</h1>
      <p className="mt-4 text-lg text-slate-400">This feature is under construction and will be available soon!</p>
    </div>
  );
}
