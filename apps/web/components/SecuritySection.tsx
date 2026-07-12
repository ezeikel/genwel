'use client';

import {
  faEye,
  faPlug,
  faShieldAlt,
  faUserShield,
} from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const SecuritySection = () => {
  const securityPoints = [
    {
      icon: faShieldAlt,
      title: 'Secure Open Banking',
      description:
        'We use regulated open banking providers to connect to your accounts securely.',
    },
    {
      icon: faEye,
      title: 'Read-Only Access',
      description:
        'We can only see your transactions—never move your money or make payments.',
    },
    {
      icon: faPlug,
      title: 'Disconnect Anytime',
      description:
        "You're in control. Disconnect any account at any time with one tap.",
    },
    {
      icon: faUserShield,
      title: 'Bank-Grade Security',
      description:
        '256-bit encryption and secure data centres protect your information.',
    },
  ];

  return (
    <section id="security" className="py-20 md:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="text-sm font-semibold text-accent uppercase tracking-wider mb-2 block">
              Security & Privacy
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
              Your money, your data, your control
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              We take security seriously. Genwel uses the same regulated open
              banking technology trusted by millions across the UK.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {securityPoints.map((point, index) => (
                <div key={index} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 transition-transform hover:scale-110">
                    <FontAwesomeIcon
                      icon={point.icon}
                      className="text-primary"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {point.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-accent/10 rounded-3xl blur-2xl" />
            <div className="relative bg-card rounded-2xl border border-border p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faShieldAlt}
                    size="2x"
                    className="text-primary"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">
                    Protected by
                  </h3>
                  <p className="text-muted-foreground">Open Banking UK</p>
                </div>
              </div>
              <ul className="space-y-3">
                {[
                  'Consent-based data sharing',
                  'No passwords shared with us',
                  'Real-time fraud monitoring',
                  'GDPR compliant',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
