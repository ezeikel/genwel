"use client"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faUsers, faBriefcase, faSync } from "@fortawesome/pro-duotone-svg-icons"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

const PersonasSection = () => {
  const personas = [
    {
      icon: faUsers,
      title: "The Family Supporter",
      description:
        "You send money home and top up relatives regularly. Genwel helps you support family without losing track of your own finances.",
      quote: '"Finally, an app that doesn\'t make me feel bad for helping mum."',
    },
    {
      icon: faBriefcase,
      title: "The Hustler",
      description:
        "Side gigs, unpredictable income, multiple streams. Genwel adapts to your irregular cash flow and helps you plan ahead.",
      quote: '"It gets that my income isn\'t 9-to-5."',
    },
    {
      icon: faSync,
      title: "The Rebuilder",
      description:
        "Working your way out of debt or rebuilding credit. Genwel shows you the path from minus to zero—and beyond.",
      quote: '"For the first time, I can see the light."',
    },
  ]

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm font-semibold text-accent uppercase tracking-wider mb-2 block">
            Who's Genwel for?
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Built for people like you
          </h2>
          <p className="text-lg text-muted-foreground">
            Whether you're supporting family, hustling hard, or rebuilding—Genwel meets you where you are.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {personas.map((persona, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
            >
              <Card className="border-border bg-card hover:shadow-xl transition-shadow h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <FontAwesomeIcon icon={persona.icon} size="xl" className="text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{persona.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow">{persona.description}</p>
                  <p className="text-sm italic text-primary font-medium">{persona.quote}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PersonasSection
