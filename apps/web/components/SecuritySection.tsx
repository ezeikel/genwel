'use client';

import {
  faEye,
  faPlug,
  faShieldAlt,
  faUserShield,
} from '@fortawesome/pro-duotone-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';

const SecuritySection = () => {
  const securityPoints = [
    {
      icon: faShieldAlt,
      title: 'FCA-Regulated Open Banking',
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
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
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
                <motion.div
                  key={index}
                  className="flex gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <motion.div
                    className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <FontAwesomeIcon
                      icon={point.icon}
                      className="text-primary"
                    />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {point.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {point.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute -inset-4 bg-accent/10 rounded-3xl blur-2xl" />
            <div className="relative bg-card rounded-2xl border border-border p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: 'easeInOut',
                  }}
                >
                  <FontAwesomeIcon
                    icon={faShieldAlt}
                    size="2x"
                    className="text-primary"
                  />
                </motion.div>
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
                  <motion.li
                    key={i}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
