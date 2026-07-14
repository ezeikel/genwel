'use client';

import {
  faArrowsRotate,
  faBoltLightning,
  faChartLine,
  faCommentDots,
  faLayerGroup,
  faPiggyBank,
} from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, CardContent } from '@/components/ui/card';

const CoreFeaturesSection = () => {
  const features = [
    {
      icon: faLayerGroup,
      title: 'One clear view',
      description:
        'Every UK bank account and card in one place. See your true net worth, cash, savings and card debt at a glance, updated to the day.',
    },
    {
      icon: faBoltLightning,
      title: 'Find what to fix',
      description:
        'Genwel spots duplicate subscriptions, quiet price rises and overspend, then shows you what to cut and how much you would save.',
    },
    {
      icon: faArrowsRotate,
      title: 'Every subscription, tracked',
      description:
        'See what you pay each month, when things renew, and where you are paying twice, so nothing renews behind your back.',
    },
    {
      icon: faCommentDots,
      title: 'Ask your money anything',
      description:
        'Ask Genwel a question in plain English and get an answer from your real spending, subscriptions and balances.',
    },
    {
      icon: faChartLine,
      title: 'Smart insights',
      description:
        'See exactly where your money goes each month, spot the trends, and get gentle nudges on where you could keep more of it.',
    },
    {
      icon: faPiggyBank,
      title: 'Budgets & goals',
      description:
        'Set budgets that fit how you actually get paid, put money aside for what matters, and watch it grow.',
    },
  ];

  return (
    <section id="features" className="py-20 md:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider mb-2 block">
            What Genwel does
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            See your money clearly, then fix what is leaking
          </h2>
          <p className="text-lg text-muted-foreground">
            Connect your accounts, sort your spending automatically, and get the
            money-saving finds that most banking apps bury.
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
