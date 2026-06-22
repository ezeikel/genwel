'use client';

import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

type AnimatedCounterProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
};

const AnimatedCounter = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
}: AnimatedCounterProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [hasStarted, setHasStarted] = useState(false);

  const spring = useSpring(0, {
    stiffness: 50,
    damping: 20,
  });

  const display = useTransform(spring, (latest) => {
    if (decimals > 0) {
      return `${prefix}${latest.toFixed(decimals)}${suffix}`;
    }
    return `${prefix}${Math.round(latest).toLocaleString()}${suffix}`;
  });

  useEffect(() => {
    if (isInView && !hasStarted) {
      setHasStarted(true);
      spring.set(value);
    }
  }, [isInView, hasStarted, spring, value]);

  return <motion.span ref={ref}>{display}</motion.span>;
};

const stats = [
  { value: 50, prefix: '', suffix: 'K+', label: 'Active Users', decimals: 0 },
  { value: 12, prefix: '£', suffix: 'M+', label: 'Debt Cleared', decimals: 0 },
  { value: 45, prefix: '£', suffix: 'M+', label: 'Savings Built', decimals: 0 },
  {
    value: 4.9,
    prefix: '',
    suffix: '',
    label: 'App Store Rating',
    decimals: 1,
  },
];

const StatsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section ref={ref} className="py-20 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="text-center"
            >
              <p className="text-4xl sm:text-5xl font-bold text-primary-foreground">
                <AnimatedCounter
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                />
              </p>
              <p className="mt-2 text-primary-foreground/70 text-sm sm:text-base">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
