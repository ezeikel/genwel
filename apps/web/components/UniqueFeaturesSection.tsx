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
      title: 'Family & Support Mode',
      description:
        'Tag and track money going to family or community. Set up shared support pots for relatives. See your true budget after obligations.',
      highlight: 'Support without guilt',
    },
    {
      icon: faGlobe,
      title: 'Remittance-Aware Budgeting',
      description:
        'Set monthly remittance goals and see your "true leftover" after sending money home. Built into the flow, not an afterthought.',
      highlight: 'Sending money? We get it.',
    },
    {
      icon: faArrowTrendUp,
      title: 'Minus to Zero Journey',
      description:
        'A guided path from overdraft, Klarna, and credit card debt to a positive balance and emergency fund. Real progress, visualised.',
      highlight: 'Debt-first, not debt-shame',
    },
    {
      icon: faGraduationCap,
      title: 'Culture-Aware Education',
      description:
        'Short lessons about credit, home buying, pensions, and saving—written for people starting from behind, not from privilege.',
      highlight: "Learn what school didn't teach",
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
            Features designed for the way you actually live, send, and save
            money.
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
