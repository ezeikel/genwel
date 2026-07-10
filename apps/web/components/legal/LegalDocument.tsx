import type { ReactNode } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

type LegalDocumentProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export default function LegalDocument({
  children,
  description,
  title,
}: LegalDocumentProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-muted/20 px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl rounded-2xl border border-border bg-background px-6 py-10 shadow-sm sm:px-10 sm:py-12">
          <header className="border-b border-border pb-8">
            <p className="text-sm font-medium text-primary">
              Last updated 10 July 2026
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {description}
            </p>
          </header>
          <div className="mt-8 space-y-10 text-sm leading-7 text-foreground sm:text-base">
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
