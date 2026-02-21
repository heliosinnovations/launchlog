"use client";

import { Github, Search, Share2 } from "lucide-react";

interface StepCardProps {
  stepNumber: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function StepCard({ stepNumber, icon, title, description }: StepCardProps) {
  return (
    <article className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 md:p-7 transition-all duration-300 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-glow)] text-center">
      {/* Step Number Badge with Gradient */}
      <div
        className="w-10 h-10 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg font-[family-name:var(--font-space-grotesk)]"
        aria-hidden="true"
      >
        {stepNumber}
      </div>

      {/* Icon */}
      <div
        className="w-12 h-12 mx-auto mb-4 rounded-[var(--radius-md)] bg-indigo-500/10 flex items-center justify-center"
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
        {description}
      </p>
    </article>
  );
}

export default function HowItWorksSection() {
  const steps = [
    {
      stepNumber: 1,
      icon: <Github className="w-6 h-6 text-indigo-500" />,
      title: "Connect GitHub",
      description:
        "Auto-sync your repositories and keep your portfolio always up-to-date with your latest work.",
    },
    {
      stepNumber: 2,
      icon: <Search className="w-6 h-6 text-orange-500" />,
      title: "Track Mentions",
      description:
        "We scan HackerNews, Product Hunt, Twitter, and Reddit to find every mention of your projects.",
    },
    {
      stepNumber: 3,
      icon: <Share2 className="w-6 h-6 text-cyan-500" />,
      title: "Share Your Impact",
      description:
        "Beautiful portfolio page + embeddable widgets to showcase your work anywhere.",
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
        <p className="text-base md:text-lg text-[var(--color-text-secondary)]">
          Three simple steps to showcase your developer impact
        </p>
      </header>

      {/* Steps Grid - 1 column on mobile, 3 columns on desktop */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        role="list"
        aria-label="How it works steps"
      >
        {steps.map((step) => (
          <div key={step.stepNumber} role="listitem">
            <StepCard
              stepNumber={step.stepNumber}
              icon={step.icon}
              title={step.title}
              description={step.description}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
