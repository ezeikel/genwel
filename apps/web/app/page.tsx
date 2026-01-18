import Header from "@/components/Header"
import LaunchHeroSection from "@/components/launch/LaunchHeroSection"
import StatsSection from "@/components/launch/StatsSection"
import TrustSection from "@/components/TrustSection"
import HowItWorksSection from "@/components/HowItWorksSection"
import CoreFeaturesSection from "@/components/CoreFeaturesSection"
import UniqueFeaturesSection from "@/components/UniqueFeaturesSection"
import TestimonialsSection from "@/components/launch/TestimonialsSection"
import PersonasSection from "@/components/PersonasSection"
import SecuritySection from "@/components/SecuritySection"
import FaqSection from "@/components/FaqSection"
import DownloadCtaSection from "@/components/launch/DownloadCtaSection"
import LaunchFooter from "@/components/launch/LaunchFooter"

const HomePage = () => {
  return (
    <main className="min-h-screen">
      <Header variant="launch" />
      <LaunchHeroSection />
      <StatsSection />
      <TrustSection />
      <HowItWorksSection />
      <CoreFeaturesSection />
      <UniqueFeaturesSection />
      <TestimonialsSection />
      <PersonasSection />
      <SecuritySection />
      <FaqSection />
      <DownloadCtaSection />
      <LaunchFooter />
    </main>
  )
}

export default HomePage
