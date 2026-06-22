'use client';

import { faQuoteLeft } from '@fortawesome/pro-light-svg-icons';
import { faStar } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const testimonials = [
    {
      name: 'Adaeze N.',
      location: 'London',
      image: '/young-black-woman-professional-headshot.jpg',
      quote:
        'Genwel helped me clear £8,000 in credit card debt in 14 months. The debt-first approach just makes sense - no shame, just progress.',
      rating: 5,
    },
    {
      name: 'Marcus T.',
      location: 'Birmingham',
      image: '/young-black-man-professional-headshot.jpg',
      quote:
        "Finally an app that gets it. I can track what I send home to my mum without feeling guilty about my own savings. It's all part of the plan.",
      rating: 5,
    },
    {
      name: 'Priya K.',
      location: 'Manchester',
      image: '/young-south-asian-woman-professional-headshot.jpg',
      quote:
        "The Family Pot feature changed everything. My siblings and I now contribute to our parents' support together - transparent and fair.",
      rating: 5,
    },
    {
      name: 'Daniel O.',
      location: 'Leeds',
      image: '/young-black-man-casual-headshot.jpg',
      quote:
        'I went from -£2,500 to saving for a house deposit. Genwel made me believe zero was just the beginning, not the goal.',
      rating: 5,
    },
    {
      name: 'Fatima A.',
      location: 'Bristol',
      image: '/young-black-woman-hijab-professional-headshot.jpg',
      quote:
        'The remittance tracking is brilliant. I can see exactly how my contributions fit into my overall financial picture.',
      rating: 5,
    },
    {
      name: 'Jason W.',
      location: 'Nottingham',
      image: '/young-mixed-race-man-professional-headshot.jpg',
      quote:
        "No other budgeting app understood that sometimes you're starting from minus. Genwel met me where I was.",
      rating: 5,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section ref={ref} id="testimonials" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground text-balance">
            Real Stories, Real Progress
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Join thousands of people transforming their relationship with money
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="h-full bg-card hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <FontAwesomeIcon
                    icon={faQuoteLeft}
                    size="lg"
                    className="text-primary/30 mb-4"
                  />
                  <p className="text-foreground mb-6 text-pretty">
                    {testimonial.quote}
                  </p>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FontAwesomeIcon
                        key={i}
                        icon={faStar}
                        size="sm"
                        className="text-accent"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.image || '/placeholder.svg'}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-foreground">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.location}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
