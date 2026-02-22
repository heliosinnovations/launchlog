"use client";

import { Github, FolderCheck, Share2 } from "lucide-react";

interface StepCardProps {
  stepNumber: number;
  icon: React.ReactNode;
  iconBgClass: string;
  title: string;
  description: string;
  isLast?: boolean;
}

function StepCard({
  stepNumber,
  icon,
  iconBgClass,
  title,
  description,
  isLast = false,
}: StepCardProps) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Connecting Line - visible on desktop, between cards */}
      {!isLast && (
        <div
          className="hidden md:block absolute top-[52px] left-[calc(50%+60px)] w-[calc(100%-60px)] h-[2px] bg-gradient-to-r from-indigo-500/50 via-purple-500/50 to-fuchsia-500/50"
          aria-hidden="true"
        />
      )}

      <article className="group relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 md:p-7 transition-all duration-300 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-glow)] hover:-translate-y-1 text-center w-full">
        {/* Step Number Badge with Gradient */}
        <div
          className="w-12 h-12 mx-auto mb-5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xl font-[family-name:var(--font-space-grotesk)] shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-110"
          aria-hidden="true"
        >
          {stepNumber}
        </div>

        {/* Icon */}
        <div
          className={`w-14 h-14 mx-auto mb-5 rounded-[var(--radius-md)] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${iconBgClass}`}
          aria-hidden="true"
        >
          {icon}
        </div>

        {/* Title */}
        <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg md:text-xl font-bold mb-3">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">
          {description}
        </p>
      </article>

      {/* Mobile Connecting Arrow */}
      {!isLast && (
        <div className="md:hidden flex justify-center my-4" aria-hidden="true">
          <svg
            className="w-6 h-6 text-indigo-500/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function HowItWorksSection() {
  const steps = [
    {
      stepNumber: 1,
      icon: <Github className="w-7 h-7 text-indigo-500" />,
      iconBgClass: "bg-indigo-500/10",
      title: "Connect GitHub",
      description:
        "Sign in with your GitHub account to get started in seconds. No setup required.",
    },
    {
      stepNumber: 2,
      icon: <FolderCheck className="w-7 h-7 text-purple-500" />,
      iconBgClass: "bg-purple-500/10",
      title: "Select Repos",
      description:
        "Choose which projects to showcase. We'll automatically keep them in sync.",
    },
    {
      stepNumber: 3,
      icon: <Share2 className="w-7 h-7 text-fuchsia-500" />,
      iconBgClass: "bg-fuchsia-500/10",
      title: "Share Your Profile",
      description:
        "Get a beautiful portfolio page at launchlog.com/username. Embed it anywhere.",
    },
  ];

  return (
    <section
      className="max-w-[1000px] mx-auto px-6 py-20"
      aria-labelledby="how-it-works-heading"
    >
      {/* Section Header */}
      <header className="text-center mb-16">
        <h2
          id="how-it-works-heading"
          className="font-[family-name:var(--font-space-grotesk)] text-[28px] md:text-[40px] font-bold mb-4"
        >
          How it works
        </h2>
        <p className="text-base md:text-lg text-[var(--color-text-secondary)] max-w-lg mx-auto">
          Get started in three simple steps
        </p>
      </header>

      {/* Steps Grid - 1 column on mobile, 3 columns on desktop */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        role="list"
        aria-label="How it works steps"
      >
        {steps.map((step, index) => (
          <div key={step.stepNumber} role="listitem">
            <StepCard
              stepNumber={step.stepNumber}
              icon={step.icon}
              iconBgClass={step.iconBgClass}
              title={step.title}
              description={step.description}
              isLast={index === steps.length - 1}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
