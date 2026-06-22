'use client';

import {
  faChartPie,
  faCrosshairs,
  faLink,
  faRocket,
} from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

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
        'All your accounts, transactions, and spending patterns—finally visible together.',
    },
    {
      icon: faCrosshairs,
      number: '03',
      title: 'Set budgets and goals',
      description:
        'Create budgets that make sense for your life—including family support and remittances.',
    },
    {
      icon: faRocket,
      number: '04',
      title: 'Follow your wealth plan',
      description:
        'A guided journey from minus to zero to generational wealth. Step by step, at your pace.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            How Genwel works
          </h2>
          <p className="text-lg text-muted-foreground">
            From connecting your bank to building wealth—here's your journey.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Icon row with connecting line */}
              <div className="flex items-center mb-4">
                <motion.div
                  className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <FontAwesomeIcon
                    icon={step.icon}
                    size="lg"
                    className="text-primary"
                  />
                </motion.div>
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
