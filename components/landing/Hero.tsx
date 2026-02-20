import Link from "next/link";

export function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 bg-black">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="flex justify-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-white/5 border border-white/10 rounded-full text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            New · Free to start
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-bold leading-[1.05] tracking-tight mb-6" style={{ fontSize: 'clamp(2rem, 5.5vw, 5rem)' }}>
          <span className="text-white block">Showcase everything</span>
          <span className="text-zinc-500 block">you&apos;ve shipped.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
          Beautiful project portfolios for builders. One link to share everything you&apos;ve made.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="#"
            className="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="#"
            className="w-full sm:w-auto px-8 py-4 bg-transparent border border-zinc-700 hover:border-zinc-500 text-white font-medium rounded-lg transition-colors"
          >
            See example profile
          </Link>
        </div>
      </div>
    </section>
  );
}
