'use client';

import { faBars, faXmark } from '@fortawesome/pro-light-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useState } from 'react';
import AuthNav from '@/components/AuthNav';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/#how-it-works', label: 'How it works' },
    { href: '/#features', label: 'Features' },
    { href: '/#security', label: 'Security' },
    { href: '/#faq', label: 'FAQ' },
    { href: '/blog', label: 'Blog' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" aria-label="Genwel home">
            <Logo size={32} />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <AuthNav />
            <Button size="sm" asChild>
              <Link href="/dashboard">Get started</Link>
            </Button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <FontAwesomeIcon
              icon={mobileMenuOpen ? faXmark : faBars}
              size="lg"
              className="text-foreground"
            />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <div onClick={() => setMobileMenuOpen(false)}>
                  <AuthNav />
                </div>
                <Button size="sm" asChild>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get started
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
