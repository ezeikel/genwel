import Header from "@/components/Header"
import HeroSection from "@/components/HeroSection"
import TrustSection from "@/components/TrustSection"
import HowItWorksSection from "@/components/HowItWorksSection"
import CoreFeaturesSection from "@/components/CoreFeaturesSection"
import UniqueFeaturesSection from "@/components/UniqueFeaturesSection"
import PersonasSection from "@/components/PersonasSection"
import SecuritySection from "@/components/SecuritySection"
import FaqSection from "@/components/FaqSection"
import Footer from "@/components/Footer"

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
  )
}

export default HomePage
