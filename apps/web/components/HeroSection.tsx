'use client';

import { faArrowRight, faPlay } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            className="max-w-xl"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.15 },
              },
            }}
          >
            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance mb-6"
            >
              See where your money{' '}
              <span className="text-primary">actually goes</span>.
            </motion.h1>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="text-lg text-muted-foreground leading-relaxed mb-8"
            >
              Genwel connects to your bank and every card, sorts your spending
              on its own, and shows you what to cut — the duplicate
              subscriptions, the quiet price rises, the money slipping away each
              month.
            </motion.p>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="flex flex-col sm:flex-row gap-3 mb-6"
            >
              <Button asChild size="lg" className="h-12 px-8">
                <Link href="/dashboard">
                  Connect your bank — free
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    size="sm"
                    className="ml-2"
                  />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="flex items-center gap-4"
            >
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faPlay}
                    size="sm"
                    className="text-primary ml-0.5"
                  />
                </span>
                See how it works
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative lg:justify-self-end"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
          >
            <div className="relative w-full max-w-sm mx-auto">
              <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />
              <div className="relative bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
                <img
                  src="/mobile-finance-app-showing-budget-dashboard-with-f.jpg"
                  alt="Genwel app interface showing budget dashboard"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
