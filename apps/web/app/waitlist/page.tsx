import type { Metadata } from 'next';
import Header from "@/components/Header"

export const metadata: Metadata = {
  title: 'Join the Waitlist',
  description:
    'Be first to try Genwel—the UK budgeting app for family supporters and debt rebuilders. Join thousands on the waitlist.',
  alternates: {
    canonical: 'https://genwel.com/waitlist',
  },
  openGraph: {
    title: 'Join the Genwel Waitlist',
    description:
      'Be first to try the UK budgeting app built for real-life money pressures.',
    url: 'https://genwel.com/waitlist',
  },
};
import HeroSection from "@/components/HeroSection"
import TrustSection from "@/components/TrustSection"
import HowItWorksSection from "@/components/HowItWorksSection"
import CoreFeaturesSection from "@/components/CoreFeaturesSection"
import UniqueFeaturesSection from "@/components/UniqueFeaturesSection"
import PersonasSection from "@/components/PersonasSection"
import SecuritySection from "@/components/SecuritySection"
import RoadmapSection from "@/components/RoadmapSection"
import FaqSection from "@/components/FaqSection"
import Footer from "@/components/Footer"

const WaitlistPage = () => {
  return (
    <main className="min-h-screen">
      <Header variant="waitlist" />
      <HeroSection />
      <TrustSection />
      <HowItWorksSection />
      <CoreFeaturesSection />
      <UniqueFeaturesSection />
      <PersonasSection />
      <SecuritySection />
      <RoadmapSection />
      <FaqSection />
      <Footer />
    </main>
  )
}

export default WaitlistPage
