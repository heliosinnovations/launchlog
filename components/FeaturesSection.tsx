"use client";

import { Github, Globe, Code, Layout } from "lucide-react";

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
    <article className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-7 transition-all duration-300 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-glow)]">
      <div
        className={`w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center mb-5 ${iconBgClass}`}
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
      icon: <Github className="w-6 h-6 text-indigo-500" />,
      iconBgClass: "bg-indigo-500/10",
      title: "Auto-sync repos from GitHub",
      description:
        "Connect your GitHub account and we automatically track all your public repositories",
    },
    {
      icon: <Globe className="w-6 h-6 text-orange-500" />,
      iconBgClass: "bg-orange-500/10",
      title: "Track mentions",
      description:
        "Automatically find when your projects get mentioned on HackerNews, Product Hunt, Twitter, Reddit, and more",
    },
    {
      icon: <Code className="w-6 h-6 text-cyan-500" />,
      iconBgClass: "bg-cyan-500/10",
      title: "Embeddable widget",
      description:
        "Drop a lightweight widget on your personal site to showcase your projects",
    },
    {
      icon: <Layout className="w-6 h-6 text-purple-500" />,
      iconBgClass: "bg-purple-500/10",
      title: "Beautiful showcase pages",
      description:
        "Get a professional portfolio page at launchlog.com/username",
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
          Everything syncs automatically
        </h2>
        <p className="text-base md:text-lg text-[var(--color-text-secondary)]">
          Connect once. Never manually update your portfolio again.
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
