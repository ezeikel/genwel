'use client';

import {
  faChartPie,
  faCrosshairs,
  faLink,
  faRocket,
} from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const HowItWorksSection = () => {
  const steps = [
    {
      icon: faLink,
      number: '01',
      title: 'Connect your accounts',
      description:
        'Securely link your bank accounts and cards through open banking. Read-only access means your money stays safe.',
    },
    {
      icon: faChartPie,
      number: '02',
      title: 'See everything in one place',
      description:
        'All your accounts, transactions, and spending, finally visible together.',
    },
    {
      icon: faCrosshairs,
      number: '03',
      title: 'Set budgets and goals',
      description:
        'Set budgets that fit how you actually spend, whether that includes rent, savings, or money you send to family.',
    },
    {
      icon: faRocket,
      number: '04',
      title: 'See what to fix',
      description:
        'Genwel spots duplicate subscriptions, price rises, and money leaking each month, then shows you what to cut.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            How Genwel works
          </h2>
          <p className="text-lg text-muted-foreground">
            Four steps from connecting your bank to seeing exactly what to fix.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Icon row with connecting line */}
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 transition-transform hover:scale-105">
                  <FontAwesomeIcon
                    icon={step.icon}
                    size="lg"
                    className="text-primary"
                  />
                </div>
                {/* Connecting line - fills remaining space */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block flex-1 h-px bg-border ml-4 -mr-4" />
                )}
              </div>
              <span className="text-xs font-bold text-accent mb-2 block">
                {step.number}
              </span>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
