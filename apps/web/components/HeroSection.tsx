"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faArrowRight, faPlay } from "@fortawesome/pro-regular-svg-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type HeroVariant = "landing" | "waitlist"

interface HeroSectionProps {
  variant?: HeroVariant
}

const HeroSection = ({ variant = "landing" }: HeroSectionProps) => {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Waitlist signup:", email)
  }

  const isLanding = variant === "landing"

  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            className="max-w-xl"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.15 },
              },
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="flex flex-wrap items-center gap-3 mb-6"
            >
              {isLanding ? (
                <>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    Alpha Now Live
                  </span>
                  <Link
                    href="/waitlist"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
                  >
                    Join waitlist for full launch
                  </Link>
                </>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Coming soon to the UK
                </span>
              )}
            </motion.div>

            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance mb-6"
            >
              {isLanding ? (
                <>
                  Take control of your <span className="text-primary">financial future</span>, starting today.
                </>
              ) : (
                <>
                  From minus to <span className="text-primary">generational wealth</span>, together.
                </>
              )}
            </motion.h1>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="text-lg text-muted-foreground leading-relaxed mb-8"
            >
              {isLanding
                ? "Try our alpha and help shape the UK budgeting app built for real-life money pressures—supporting family, managing debt, and building wealth without guilt."
                : "The UK budgeting app that connects to your bank and is built for real-life money pressures—supporting family, managing debt, and building wealth without guilt."}
            </motion.p>

            {isLanding ? (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
                className="flex flex-col sm:flex-row gap-3 mb-6"
              >
                <Button asChild size="lg" className="h-12 px-8">
                  <Link href="/signin">
                    Try the Alpha
                    <FontAwesomeIcon icon={faArrowRight} size="sm" className="ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-6">
                  <Link href="/waitlist">Join Waitlist</Link>
                </Button>
              </motion.div>
            ) : (
              <motion.form
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 mb-6"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-12"
                  required
                />
                <Button type="submit" size="lg" className="h-12 px-6">
                  Join the Waitlist
                  <FontAwesomeIcon icon={faArrowRight} size="sm" className="ml-2" />
                </Button>
              </motion.form>
            )}

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="flex items-center gap-4"
            >
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <span className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <FontAwesomeIcon icon={faPlay} size="sm" className="text-primary ml-0.5" />
                </span>
                See how it works
              </button>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative lg:justify-self-end"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          >
            <div className="relative w-full max-w-sm mx-auto">
              <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl" />
              <div className="relative bg-card rounded-3xl shadow-2xl border border-border overflow-hidden">
                <img
                  src="/mobile-finance-app-showing-budget-dashboard-with-f.jpg"
                  alt="Genwel app interface showing budget dashboard"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
