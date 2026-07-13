'use client';

import {
  faBriefcase,
  faSync,
  faUsers,
} from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, CardContent } from '@/components/ui/card';

const PersonasSection = () => {
  const personas = [
    {
      icon: faUsers,
      title: 'The Family Supporter',
      description:
        'You help family and the people you care about, sometimes every month. Genwel keeps one clear view of your money so you can give without losing track of your own.',
      quote:
        '"I send money to my mum every month. Now I can see exactly what I have left, instead of guessing."',
    },
    {
      icon: faBriefcase,
      title: 'The Hustler',
      description:
        'Side gigs and income that lands when it lands. Genwel connects every account, sorts your spending automatically, and shows you where the money goes so a quiet month never catches you out.',
      quote:
        '"My income is never the same twice. Genwel finally makes it make sense."',
    },
    {
      icon: faSync,
      title: 'The Rebuilder',
      description:
        'Chipping away at the overdraft, Klarna, and the cards. Genwel finds what is leaking each month and shows you what to cut, so you can watch the balance climb back into the positive.',
      quote:
        '"I could feel myself getting out of my overdraft. Seeing the number go up kept me going."',
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider mb-2 block">
            Who's Genwel for?
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Built for people like you
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you're helping family, juggling side gigs, or working your
            way out of the red, Genwel gives you one clear view of your money.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {personas.map((persona, index) => (
            <div key={index}>
              <Card className="border-border bg-card hover:shadow-xl transition-shadow h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4 transition-transform hover:scale-110">
                    <FontAwesomeIcon
                      icon={persona.icon}
                      size="xl"
                      className="text-primary"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {persona.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow">
                    {persona.description}
                  </p>
                  <p className="text-sm italic text-primary font-medium">
                    {persona.quote}
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

export default PersonasSection;
