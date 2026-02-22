"use client";

import { GitBranch, Zap, BarChart3, TrendingUp } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  iconBgClass: string;
  title: string;
  description: string;
}

function FeatureCard({
  icon,
  iconBgClass,
  title,
  description,
}: FeatureCardProps) {
  return (
    <article className="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-7 transition-all duration-300 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-glow)] hover:-translate-y-1">
      <div
        className={`w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 ${iconBgClass}`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        {description}
      </p>
    </article>
  );
}

export default function FeaturesSection() {
  const features = [
    {
      icon: <GitBranch className="w-6 h-6 text-indigo-500" />,
      iconBgClass: "bg-indigo-500/10",
      title: "GitHub Integration",
      description:
        "Track your open source contributions automatically. Connect once and your portfolio stays in sync with every push.",
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      iconBgClass: "bg-amber-500/10",
      title: "Real-time Updates",
      description:
        "See your impact as it happens. New commits, stars, and mentions appear instantly on your profile.",
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-cyan-500" />,
      iconBgClass: "bg-cyan-500/10",
      title: "Beautiful Dashboards",
      description:
        "Visualize your open source journey with stunning charts and metrics that showcase your growth.",
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
      iconBgClass: "bg-emerald-500/10",
      title: "Analytics",
      description:
        "Understand your contribution patterns. See trends, peak activity times, and project performance.",
    },
  ];

  return (
    <section className="max-w-[1000px] mx-auto px-6 py-20" aria-labelledby="features-heading">
      {/* Section Header */}
      <header className="text-center mb-16">
        <h2
          id="features-heading"
          className="font-[family-name:var(--font-space-grotesk)] text-[28px] md:text-[40px] font-bold mb-4"
        >
          Everything you need to showcase your work
        </h2>
        <p className="text-base md:text-lg text-[var(--color-text-secondary)]">
          Powerful features that keep your portfolio always up-to-date.
        </p>
      </header>

      {/* Feature Grid - 2x2 on desktop, 1 column on mobile */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        role="list"
        aria-label="Product features"
      >
        {features.map((feature, index) => (
          <div key={index} role="listitem">
            <FeatureCard
              icon={feature.icon}
              iconBgClass={feature.iconBgClass}
              title={feature.title}
              description={feature.description}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
