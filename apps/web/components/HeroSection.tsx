'use client';

import { faArrowRight, faPlay } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import AppStoreBadges from '@/components/AppStoreBadges';
import HeroMockup from '@/components/HeroMockup';
import { Button } from '@/components/ui/button';

// Feature flag — mobile apps aren't published yet, so the store badges stay
// hidden until NEXT_PUBLIC_SHOW_APP_STORE_BADGES=true.
const SHOW_APP_STORE_BADGES =
  process.env.NEXT_PUBLIC_SHOW_APP_STORE_BADGES === 'true';

const HeroSection = () => {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="max-w-xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance mb-6">
              See where your money{' '}
              <span className="text-primary">actually goes</span>.
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Genwel connects to your bank and every card, sorts your spending
              on its own, and shows you what to cut — the duplicate
              subscriptions, the quiet price rises, the money slipping away each
              month.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center gap-2 rounded-md px-6 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <FontAwesomeIcon
                    icon={faPlay}
                    size="sm"
                    className="text-primary ml-0.5"
                  />
                </span>
                See how it works
              </a>
            </div>

            {SHOW_APP_STORE_BADGES && <AppStoreBadges />}
          </div>

          <div className="relative lg:justify-self-end">
            <HeroMockup />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
