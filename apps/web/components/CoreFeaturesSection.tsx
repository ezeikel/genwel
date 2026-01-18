"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUniversity, faCalendarDay, faReceipt, faPiggyBank, faChartLine } from "@fortawesome/pro-duotone-svg-icons"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

const CoreFeaturesSection = () => {
  const features = [
    {
      icon: faUniversity,
      title: "Account Aggregation",
      description: "See all your bank accounts, cards, and accounts in one unified view.",
    },
    {
      icon: faCalendarDay,
      title: "Payday Budgets",
      description: "Budget by your payday cycle, not the calendar month.",
    },
    {
      icon: faReceipt,
      title: "Bill Tracking",
      description: "Never miss a subscription or bill payment again.",
    },
    {
      icon: faPiggyBank,
      title: "Goals & Pots",
      description: "Emergency fund, house deposit, holiday—save for what matters.",
    },
    {
      icon: faChartLine,
      title: "Insights & Trends",
      description: "Understand where your money goes with clear, actionable insights.",
    },
  ]

  return (
    <section id="features" className="py-20 md:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-semibold text-accent uppercase tracking-wider mb-2 block">Core Features</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Everything you expect from a budgeting app
          </h2>
          <p className="text-lg text-muted-foreground">
            All the essentials, done right. Connect, track, budget, and save.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <Card className="border-border/50 bg-card hover:border-primary/30 transition-colors h-full">
                <CardContent className="p-6">
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <FontAwesomeIcon icon={feature.icon} size="lg" className="text-primary" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CoreFeaturesSection
