interface TechStackBadgesProps {
  stack: string[];
  maxVisible?: number;
  size?: 'sm' | 'md';
}

// Tech stack color mapping for visual consistency
const TECH_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  // JavaScript ecosystem
  TypeScript: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  JavaScript: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  React: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  'Next.js': { bg: 'bg-white/10', text: 'text-gray-200', border: 'border-white/20' },
  Vue: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  Nuxt: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  Angular: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  Svelte: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  SvelteKit: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  Node: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  Express: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  NestJS: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  Fastify: { bg: 'bg-white/10', text: 'text-gray-200', border: 'border-white/20' },
  Electron: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  Tailwind: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  Vite: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  Webpack: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  // Python
  Python: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  Django: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  Flask: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  FastAPI: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
  // Go
  Go: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  Gin: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  Fiber: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  // Rust
  Rust: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  Actix: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  Axum: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  // Java/Kotlin
  Java: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  Kotlin: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  'Spring Boot': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  // Ruby
  Ruby: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  Rails: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  // PHP
  PHP: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  Laravel: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  // Databases
  PostgreSQL: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  MongoDB: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  Redis: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  // Infrastructure
  Docker: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  Kubernetes: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  // Cloud/Services
  Supabase: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
  Firebase: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  Prisma: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
  Drizzle: { bg: 'bg-lime-500/10', text: 'text-lime-400', border: 'border-lime-500/20' },
  GraphQL: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
  tRPC: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
};

const DEFAULT_COLORS = { bg: 'bg-brand-500/10', text: 'text-brand-400', border: 'border-brand-500/20' };

export function TechStackBadges({ stack, maxVisible = 5, size = 'md' }: TechStackBadgesProps) {
  if (!stack || stack.length === 0) return null;

  const visible = stack.slice(0, maxVisible);
  const remaining = stack.length - maxVisible;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((tech) => {
        const colors = TECH_COLORS[tech] || DEFAULT_COLORS;
        return (
          <span
            key={tech}
            className={`inline-flex items-center font-medium border rounded-md ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses}`}
          >
            {tech}
          </span>
        );
      })}
      {remaining > 0 && (
        <span className={`inline-flex items-center font-medium text-text-tertiary ${sizeClasses}`}>
          +{remaining} more
        </span>
      )}
    </div>
  );
}
