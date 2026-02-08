import { Nav } from '@/components/layout/Nav';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Pricing } from '@/components/landing/Pricing';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Features />
        <Pricing />
      </main>
      <footer className="py-12 px-6 border-t border-border-default">
        <div className="max-w-6xl mx-auto text-center text-text-secondary text-sm">
          <p>© 2026 LaunchLog. Built for makers who ship.</p>
        </div>
      </footer>
    </div>
  );
}
