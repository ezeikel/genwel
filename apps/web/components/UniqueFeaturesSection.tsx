"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faHeart, faGlobe, faArrowTrendUp, faGraduationCap } from "@fortawesome/pro-duotone-svg-icons"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

const UniqueFeaturesSection = () => {
  const features = [
    {
      icon: faHeart,
      title: "Family & Support Mode",
      description:
        "Tag and track money going to family or community. Set up shared support pots for relatives. See your true budget after obligations.",
      highlight: "Support without guilt",
    },
    {
      icon: faGlobe,
      title: "Remittance-Aware Budgeting",
      description:
        'Set monthly remittance goals and see your "true leftover" after sending money home. Built into the flow, not an afterthought.',
      highlight: "Sending money? We get it.",
    },
    {
      icon: faArrowTrendUp,
      title: "Minus to Zero Journey",
      description:
        "A guided path from overdraft, Klarna, and credit card debt to a positive balance and emergency fund. Real progress, visualised.",
      highlight: "Debt-first, not debt-shame",
    },
    {
      icon: faGraduationCap,
      title: "Culture-Aware Education",
      description:
        "Short lessons about credit, home buying, pensions, and saving—written for people starting from behind, not from privilege.",
      highlight: "Learn what school didn't teach",
    },
  ]

  return (
    <section className="py-20 md:py-28 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-semibold text-accent uppercase tracking-wider mb-2 block">
            What makes us different
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Built for real life, not just spreadsheets
          </h2>
          <p className="text-lg text-primary-foreground/80">
            Features designed for the way you actually live, send, and save money.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className="border-primary-foreground/20 bg-primary-foreground/10 backdrop-blur h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <motion.div
                      className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <FontAwesomeIcon icon={feature.icon} size="lg" className="text-accent" />
                    </motion.div>
                    <div>
                      <span className="text-xs font-semibold text-accent uppercase tracking-wider mb-1 block">
                        {feature.highlight}
                      </span>
                      <h3 className="text-lg font-semibold text-primary-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-primary-foreground/70 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default UniqueFeaturesSection
