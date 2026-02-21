export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 font-[family-name:var(--font-space-grotesk)]">
          LaunchLog
        </h1>
        <p className="text-xl text-[var(--color-text-secondary)] mb-8">
          Coming Soon
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-[var(--color-text-secondary)]">
            Building in public
          </span>
        </div>
      </div>
    </main>
  );
}
