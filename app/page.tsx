import JsonToCsv from './components/JsonToCsv';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-4 sm:p-8">
      <div className="w-full max-w-lg">
        <JsonToCsv />
      </div>
    </main>
  );
}
