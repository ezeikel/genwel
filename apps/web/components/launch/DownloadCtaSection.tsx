'use client';

import { faApple, faGooglePlay } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';

const DownloadCtaSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      ref={ref}
      className="py-20 bg-gradient-to-br from-primary to-primary/80"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground text-balance">
            Start Your Journey Today
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto text-pretty">
            Download Genwel and take the first step from minus to generational
            wealth. Your future self will thank you.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="gap-2">
              <FontAwesomeIcon icon={faApple} size="lg" />
              Download for iOS
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
            >
              <FontAwesomeIcon icon={faGooglePlay} size="lg" />
              Get it on Android
            </Button>
          </div>

          <p className="mt-6 text-sm text-primary-foreground/60">
            Free to download. No hidden fees. Cancel anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default DownloadCtaSection;
