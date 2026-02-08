import { Button } from '../ui/Button';

export function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      period: "forever",
      features: [
        "Up to 5 projects",
        "Public profile page",
        "Embeddable widget",
        "GitHub login",
        "Basic analytics"
      ],
      cta: "Get Started Free",
      variant: "secondary" as const
    },
    {
      name: "Pro",
      price: "$8",
      period: "month",
      badge: "Popular",
      highlight: true,
      features: [
        "Unlimited projects",
        "Custom domain support",
        "Priority support",
        "Advanced analytics",
        "Custom themes",
        'Remove "Powered by" from widget',
        "Early access to new features"
      ],
      cta: "Start Pro Trial",
      variant: "primary" as const
    }
  ];

  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-brand-400 uppercase tracking-wider text-sm font-semibold mb-3">
            PRICING
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Start for free. Upgrade when you're ready to do more.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative p-8 rounded-xl border ${
                plan.highlight
                  ? 'border-brand-500 bg-bg-secondary'
                  : 'border-border-default bg-bg-secondary'
              }`}
              style={plan.highlight ? { boxShadow: 'var(--shadow-glow-indigo)' } : {}}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-text-secondary">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-text-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.variant}
                size="lg"
                className="w-full"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
