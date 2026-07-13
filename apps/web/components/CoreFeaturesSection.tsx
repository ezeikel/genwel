'use client';

import {
  faCalendarDay,
  faChartLine,
  faPiggyBank,
  faReceipt,
  faUniversity,
} from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, CardContent } from '@/components/ui/card';

const CoreFeaturesSection = () => {
  const features = [
    {
      icon: faUniversity,
      title: 'Account Aggregation',
      description:
        'Every UK bank account and card in one clear view, connected through Open Banking.',
    },
    {
      icon: faCalendarDay,
      title: 'Payday Budgets',
      description:
        'Budget from payday to payday, so you always know what is left to spend.',
    },
    {
      icon: faReceipt,
      title: 'Bill Tracking',
      description:
        'Track every subscription and bill, and catch the ones quietly rising in price.',
    },
    {
      icon: faPiggyBank,
      title: 'Goals & Pots',
      description:
        'Set money aside for an emergency fund, a house deposit, or a holiday, and watch it grow.',
    },
    {
      icon: faChartLine,
      title: 'Insights & Trends',
      description:
        'See exactly where your money goes each month, and what to cut to keep more of it.',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider mb-2 block">
            Core Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Everything you need to see your money clearly
          </h2>
          <p className="text-lg text-muted-foreground">
            Connect your accounts, sort your spending, and find what to fix. All
            in one place.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index}>
              <Card className="border-border/50 bg-card hover:border-primary/30 transition-colors h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 transition-transform hover:scale-110">
                    <FontAwesomeIcon
                      icon={feature.icon}
                      size="lg"
                      className="text-primary"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoreFeaturesSection;
