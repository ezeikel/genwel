import CoreFeaturesSection from '@/components/CoreFeaturesSection';
import FaqSection from '@/components/FaqSection';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import PersonasSection from '@/components/PersonasSection';
import SecuritySection from '@/components/SecuritySection';
import TrustSection from '@/components/TrustSection';
import UniqueFeaturesSection from '@/components/UniqueFeaturesSection';

const HomePage = () => {
  return (
    <main className="min-h-screen">
      <Header variant="waitlist" />
      <HeroSection variant="landing" />
      <TrustSection />
      <HowItWorksSection />
      <CoreFeaturesSection />
      <UniqueFeaturesSection />
      <PersonasSection />
      <SecuritySection />
      <FaqSection />
      <Footer />
    </main>
  );
};

export default HomePage;
