import {
  faChartBar,
  faGlobe,
  faMobileAlt,
  faUsers,
} from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@/components/ui/button';

const RoadmapSection = () => {
  const roadmapItems = [
    {
      icon: faUsers,
      title: 'Shared Family Workspaces',
      description: 'Collaborate on budgets and goals with family members.',
      status: 'In development',
    },
    {
      icon: faChartBar,
      title: 'Credit Building Tools',
      description: 'Deeper insights and actions to improve your credit score.',
      status: 'Planned',
    },
    {
      icon: faMobileAlt,
      title: 'iOS & Android Apps',
      description: 'Native mobile apps for the best experience on the go.',
      status: 'In development',
    },
    {
      icon: faGlobe,
      title: 'International Expansion',
      description: 'Bringing Genwel to more communities worldwide.',
      status: 'Future',
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider mb-2 block">
            What's Next
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Help us build Genwel
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            We're building in public and want your input. Here's what's
            coming—and we'd love your ideas.
          </p>
          <Button variant="outline">Join our community</Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roadmapItems.map((item, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-muted/50 border border-border hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <FontAwesomeIcon
                  icon={item.icon}
                  size="lg"
                  className="text-primary"
                />
              </div>
              <span className="text-xs font-semibold text-accent uppercase tracking-wider mb-2 block">
                {item.status}
              </span>
              <h3 className="font-semibold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoadmapSection;
