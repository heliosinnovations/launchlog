import { Badge } from '../ui/Badge';

const demoProjects = [
  {
    name: 'TaskFlow',
    description: 'A modern task management app with real-time collaboration',
    tech: ['React', 'TypeScript', 'Supabase'],
  },
  {
    name: 'WeatherNow',
    description: 'Beautiful weather app with location-based forecasts',
    tech: ['Next.js', 'Tailwind', 'OpenWeather API'],
  },
];

export function DemoProfile() {
  return (
    <div className="bg-bg-primary rounded-lg overflow-hidden text-left">
      {/* Browser Chrome */}
      <div className="bg-bg-tertiary px-4 py-2.5 flex items-center gap-2 border-b border-border-default">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-danger-400/60" />
          <div className="w-3 h-3 rounded-full bg-warning-400/60" />
          <div className="w-3 h-3 rounded-full bg-success-400/60" />
        </div>
        <div className="flex-1 ml-4">
          <div className="bg-bg-secondary rounded-md px-3 py-1 text-xs text-text-tertiary max-w-xs mx-auto">
            launchlog.dev/alexbuilds
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-success-400 flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base truncate">Alex Chen</h3>
            <p className="text-text-tertiary text-xs">@alexbuilds</p>
          </div>
          <Badge variant="success" className="text-[10px] px-1.5 py-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-success-400 mr-1" />
            Pro
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Projects', value: '8' },
            { label: 'Shipped', value: '6', color: 'text-success-500' },
            { label: 'Views', value: '2.4k' },
          ].map((stat) => (
            <div key={stat.label} className="bg-bg-secondary rounded-md p-2 text-center">
              <p className="text-text-tertiary text-[10px]">{stat.label}</p>
              <p className={`font-bold text-sm ${stat.color || ''}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div className="space-y-3">
          {demoProjects.map((project) => (
            <div
              key={project.name}
              className="bg-bg-secondary rounded-lg p-3 border border-border-default"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="font-semibold text-sm">{project.name}</h4>
                <Badge variant="success" className="text-[9px] px-1.5 py-0.5">Shipped</Badge>
              </div>
              <p className="text-text-secondary text-xs mb-2 line-clamp-1">{project.description}</p>
              <div className="flex flex-wrap gap-1">
                {project.tech.map((t) => (
                  <span key={t} className="px-1.5 py-0.5 text-[9px] bg-bg-tertiary rounded border border-border-default">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
