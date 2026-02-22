"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "Is it really free forever?",
    answer:
      "Yes. No credit card, no limits, no hidden fees. LaunchLog is free forever. We\u2019re building this for the community.",
  },
  {
    question: "Which repos can I showcase?",
    answer:
      "Any public GitHub repos you own or contribute to. Connect your GitHub account and select which projects to display on your profile.",
  },
  {
    question: "How does auto-sync work?",
    answer:
      "We use GitHub webhooks to detect changes in real-time. When you push code, update your README, or get new stars, your LaunchLog profile updates automatically within seconds.",
  },
  {
    question: "Can I customize the widget design?",
    answer:
      "Absolutely. LaunchLog widgets inherit your website\u2019s CSS variables (fonts, colors, spacing). They adapt to your design system automatically, so they look native, not embedded.",
  },
  {
    question: "What about private repos?",
    answer:
      "Private repo support is coming soon. Currently, LaunchLog works with public repos only. We\u2019ll add private repo showcasing with granular visibility controls in a future update.",
  },
  {
    question: "How do you make money if it\u2019s free?",
    answer:
      "We don\u2019t, yet. LaunchLog is a passion project built for developers who ship. If it grows, we might add optional premium features, but the core will always be free.",
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div
      className={`rounded-xl border transition-all duration-300 ${
        isOpen
          ? "border-transparent bg-[var(--color-surface-elevated)] shadow-[0_4px_24px_rgba(99,102,241,0.08)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-elevated)]/50"
      }`}
    >
      {/* Gradient left border for open items */}
      <div className="relative overflow-hidden rounded-xl">
        {isOpen && (
          <div
            className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{
              background:
                "linear-gradient(180deg, #6366F1, #8B5CF6, #D946EF)",
            }}
            aria-hidden="true"
          />
        )}

        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full text-left px-6 py-5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded-xl"
          aria-expanded={isOpen}
        >
          <span className="font-[family-name:var(--font-space-grotesk)] text-base md:text-lg font-semibold pr-4">
            {question}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-[var(--color-text-secondary)] flex-shrink-0 transition-transform duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <p className="px-6 pb-5 text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">
              {answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="py-24 bg-[var(--color-surface)]"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-[800px] mx-auto px-5 md:px-12">
        {/* Section Header */}
        <header className="text-center mb-16">
          <h2
            id="faq-heading"
            className="font-[family-name:var(--font-space-grotesk)] text-[28px] md:text-[40px] font-bold mb-4"
          >
            Frequently Asked Questions
          </h2>
          <p className="text-base md:text-lg text-[var(--color-text-secondary)]">
            Everything you need to know
          </p>
        </header>

        {/* FAQ Items */}
        <div className="space-y-4" role="list" aria-label="Frequently asked questions">
          {faqs.map((faq, index) => (
            <div key={index} role="listitem">
              <FAQItem
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onToggle={() => handleToggle(index)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
