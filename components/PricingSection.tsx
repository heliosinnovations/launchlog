"use client";

import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

const features = [
  "Unlimited GitHub repos",
  "Auto-sync from GitHub",
  "Embeddable widgets",
  "Smart screenshots",
  "Live activity tracking",
  "Social proof aggregation",
];

export default function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-24 bg-[var(--color-bg)]"
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-[1280px] mx-auto px-5 md:px-12">
        {/* Section Header */}
        <header className="text-center mb-16">
          <h2
            id="pricing-heading"
            className="font-[family-name:var(--font-space-grotesk)] text-[28px] md:text-[40px] font-bold mb-4"
          >
            Simple Pricing
          </h2>
          <p className="text-base md:text-lg text-[var(--color-text-secondary)]">
            No credit card. No limits. No bullshit.
          </p>
        </header>

        {/* Pricing Card - Centered */}
        <div className="flex justify-center">
          <article
            className="relative w-full max-w-[480px] rounded-2xl p-[2px] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(99,102,241,0.25)]"
            style={{
              background:
                "linear-gradient(135deg, #6366F1, #8B5CF6, #D946EF)",
            }}
          >
            <div className="bg-[var(--color-surface)] rounded-[14px] p-8 md:p-12">
              {/* Badge */}
              <div className="flex justify-center mb-8">
                <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500">
                  Free Forever
                </span>
              </div>

              {/* Price */}
              <div className="text-center mb-2">
                <span className="font-[family-name:var(--font-space-grotesk)] text-[64px] md:text-[72px] font-bold leading-none">
                  $0
                </span>
                <span className="text-lg text-[var(--color-text-secondary)] ml-1">
                  /month
                </span>
              </div>

              {/* Tagline */}
              <p className="text-center text-[var(--color-text-secondary)] mb-8">
                Built for makers who ship
              </p>

              {/* Features List */}
              <ul className="space-y-4 mb-10" role="list" aria-label="Included features">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3" role="listitem">
                    <div
                      className="w-5 h-5 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0"
                      aria-hidden="true"
                    >
                      <Check className="w-3 h-3 text-indigo-500" />
                    </div>
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link
                href="/signin"
                className="flex items-center justify-center gap-2.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white px-7 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 shadow-[0_8px_32px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.45)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label="Get started with LaunchLog for free"
              >
                Get Started
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
