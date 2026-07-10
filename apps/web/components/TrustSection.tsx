import {
  faCheckCircle,
  faLock,
  faUniversity,
} from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const TrustSection = () => {
  const trustItems = [
    {
      icon: faUniversity,
      label: 'Powered by Open Banking',
    },
    {
      icon: faCheckCircle,
      label: 'Secure Open Banking Connections',
    },
    {
      icon: faLock,
      label: 'Bank-Grade Encryption',
    },
  ];

  return (
    <section className="py-12 bg-muted/50 border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          {trustItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <FontAwesomeIcon
                icon={item.icon}
                size="lg"
                className="text-primary"
              />
              <span className="text-sm font-medium text-muted-foreground">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
