"use client";

// Mini Badge Component for project mentions
interface MiniBadgeProps {
  platform: "hn" | "ph" | "twitter";
  label: string;
}

function MiniBadge({ platform, label }: MiniBadgeProps) {
  const platformStyles = {
    hn: {
      bg: "bg-[rgba(255,102,0,0.15)]",
      color: "text-[#FF6600]",
    },
    ph: {
      bg: "bg-[rgba(218,85,47,0.15)]",
      color: "text-[#DA552F]",
    },
    twitter: {
      bg: "bg-[rgba(29,161,242,0.15)]",
      color: "text-[#1DA1F2]",
    },
  };

  const styles = platformStyles[platform];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold ${styles.bg} ${styles.color}`}
    >
      {label}
    </span>
  );
}

// Project Card Component
interface ProjectCardProps {
  title: string;
  description: string;
  mentions: Array<{ platform: "hn" | "ph" | "twitter"; label: string }>;
}

function ProjectCard({ title, description, mentions }: ProjectCardProps) {
  return (
    <article className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-md)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
      <h4 className="text-sm font-semibold mb-1">{title}</h4>
      <p className="text-xs text-[var(--color-text-secondary)] mb-3">
        {description}
      </p>
      <div className="flex gap-2 flex-wrap" role="list" aria-label="Project mentions">
        {mentions.map((mention, index) => (
          <MiniBadge key={index} platform={mention.platform} label={mention.label} />
        ))}
      </div>
    </article>
  );
}

// Stat Box Component
interface StatBoxProps {
  value: string;
  label: string;
  isAccent?: boolean;
}

function StatBox({ value, label, isAccent = false }: StatBoxProps) {
  return (
    <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-md)] p-4 md:p-5 text-center">
      <div
        className={`font-[family-name:var(--font-space-grotesk)] text-xl md:text-[28px] font-bold mb-1 ${
          isAccent
            ? "bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent"
            : ""
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

export default function ExampleProfileSection() {
  const stats = [
    { value: "18", label: "Projects", isAccent: false },
    { value: "12.4k", label: "Stars", isAccent: false },
    { value: "247", label: "Mentions", isAccent: true },
    { value: "89", label: "Forks", isAccent: false },
  ];

  const projects = [
    {
      title: "shipfast-cli",
      description: "Deploy apps in seconds",
      mentions: [
        { platform: "hn" as const, label: "HN #1" },
        { platform: "ph" as const, label: "#2 PH" },
        { platform: "twitter" as const, label: "1.2k tweets" },
      ],
    },
    {
      title: "react-forms-pro",
      description: "Type-safe form library",
      mentions: [
        { platform: "hn" as const, label: "342 pts" },
        { platform: "twitter" as const, label: "847 tweets" },
      ],
    },
    {
      title: "tailwind-tokens",
      description: "Design token generator",
      mentions: [{ platform: "hn" as const, label: "89 pts" }],
    },
  ];

  return (
    <section
      id="example"
      className="max-w-[1000px] mx-auto px-6 py-10 pb-24"
      aria-labelledby="example-profile-heading"
    >
      {/* Section Label */}
      <p className="text-center text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)] mb-6">
        Your portfolio, always up-to-date
      </p>

      {/* Widget Preview Container */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 md:p-8 shadow-[var(--shadow-lg)]">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6">
          {/* Avatar */}
          <div
            className="w-12 h-12 md:w-14 md:h-14 rounded-[var(--radius-md)] bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center font-[family-name:var(--font-space-grotesk)] text-lg md:text-xl font-bold text-white"
            aria-hidden="true"
          >
            SG
          </div>
          {/* User Meta */}
          <div>
            <h3
              id="example-profile-heading"
              className="font-[family-name:var(--font-space-grotesk)] text-base md:text-lg font-bold"
            >
              Sarah Guo
            </h3>
            <span className="text-sm text-[var(--color-text-secondary)]">
              Full-Stack Developer • Building in public
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6"
          role="list"
          aria-label="Profile statistics"
        >
          {stats.map((stat, index) => (
            <div key={index} role="listitem">
              <StatBox
                value={stat.value}
                label={stat.label}
                isAccent={stat.isAccent}
              />
            </div>
          ))}
        </div>

        {/* Projects Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4"
          role="list"
          aria-label="Featured projects"
        >
          {projects.map((project, index) => (
            <div key={index} role="listitem">
              <ProjectCard
                title={project.title}
                description={project.description}
                mentions={project.mentions}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
