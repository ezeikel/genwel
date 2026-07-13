'use client';

import {
  faArrowTrendUp,
  faGlobe,
  faGraduationCap,
  faHeart,
} from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, CardContent } from '@/components/ui/card';

const UniqueFeaturesSection = () => {
  const features = [
    {
      icon: faHeart,
      title: 'Money you send to people',
      description:
        'Tag what goes to family, relatives, or people you support and set aside a pot for it. See what you actually have left once those commitments are covered.',
      highlight: 'Support the people who matter',
    },
    {
      icon: faGlobe,
      title: 'Budgeting on income that moves',
      description:
        'Paid in different amounts each month from shifts, side gigs, or self-employment. Genwel works from what you earn on average and shows what you can safely spend now.',
      highlight: 'Built for irregular pay',
    },
    {
      icon: faArrowTrendUp,
      title: 'A clear way out of debt',
      description:
        'See every overdraft, Klarna, and credit card balance in one place, then follow a step-by-step path back to a positive balance and a first emergency fund.',
      highlight: 'A path back to positive',
    },
    {
      icon: faGraduationCap,
      title: 'Money explained in plain English',
      description:
        'Short, jargon-free guides on credit, buying a home, pensions, and saving. No lectures, no fine print, just what things mean and what to do next.',
      highlight: 'The stuff nobody taught you',
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider mb-2 block">
            What makes us different
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Built for real life, not just spreadsheets
          </h2>
          <p className="text-lg text-primary-foreground/80">
            Features built around how money actually works: what comes in, what
            you owe, and what you look after.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div key={index}>
              <Card className="border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 transition-transform hover:scale-110">
                      <FontAwesomeIcon
                        icon={feature.icon}
                        size="lg"
                        className="text-accent"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-accent uppercase tracking-wider mb-1 block">
                        {feature.highlight}
                      </span>
                      <h3 className="text-lg font-semibold text-primary-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-primary-foreground/70 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UniqueFeaturesSection;
