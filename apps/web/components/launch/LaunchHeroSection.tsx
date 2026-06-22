'use client';
import { faApple, faGooglePlay } from '@fortawesome/free-brands-svg-icons';
import { faStar } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, type Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';

const LaunchHeroSection = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="text-center lg:text-left">
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-6"
            >
              <FontAwesomeIcon icon={faStar} size="sm" />
              <span className="text-sm font-medium">
                Now Available on iOS and Android
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance"
            >
              From Minus to{' '}
              <span className="text-primary">Generational Wealth</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 text-pretty"
            >
              The UK budgeting app built for real-life money pressures. Join
              50,000+ people already building their financial future.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button size="lg" className="gap-2">
                <FontAwesomeIcon icon={faApple} size="lg" />
                Download for iOS
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 bg-transparent"
              >
                <FontAwesomeIcon icon={faGooglePlay} size="lg" />
                Get it on Android
              </Button>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="mt-8 flex items-center gap-6 justify-center lg:justify-start"
            >
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <FontAwesomeIcon
                    key={i}
                    icon={faStar}
                    size="sm"
                    className="text-accent"
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                4.9 rating from 12,000+ reviews
              </span>
            </motion.div>
          </div>

          <motion.div
            className="relative flex justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative w-72 h-[580px] bg-foreground rounded-[3rem] p-2 shadow-2xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground rounded-b-2xl z-10" />
              <div className="w-full h-full bg-gradient-to-b from-primary/20 to-primary/5 rounded-[2.5rem] flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary-foreground font-bold text-2xl">
                      G
                    </span>
                  </div>
                  <p className="text-foreground font-medium">
                    Your Wealth Journey
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Starts Here
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default LaunchHeroSection;
