import { faArrowRight } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CookieSettingsButton } from './CookieConsent';

const Footer = () => {
  const footerLinks = {
    Product: [
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Features', href: '/#features' },
      { label: 'Security', href: '/#security' },
      { label: 'FAQ', href: '/#faq' },
    ],
    Company: [
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: 'mailto:developer@chewybytes.com' },
    ],
    Legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  };

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-foreground rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-lg">G</span>
              </div>
              <span className="text-xl font-bold">Genwel</span>
            </div>
            <p className="text-primary-foreground/70 max-w-md mb-6">
              From minus to generational wealth, together. The UK budgeting app
              built for real-life money pressures.
            </p>
            <Button variant="secondary" asChild>
              <Link href="/dashboard">
                Get started
                <FontAwesomeIcon
                  icon={faArrowRight}
                  size="sm"
                  className="ml-2"
                />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="font-semibold mb-4">{category}</h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/20 pt-8 sm:flex-row">
          <p className="text-sm text-primary-foreground/70">
            © {new Date().getFullYear()} Genwel. A trading name of Chewy Bytes
            Limited (16443347).
          </p>
          <CookieSettingsButton className="text-sm text-primary-foreground/70 underline-offset-4 hover:text-primary-foreground hover:underline" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
