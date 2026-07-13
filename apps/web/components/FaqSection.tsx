import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FaqSection = () => {
  const faqs = [
    {
      question: 'How does Genwel connect to my bank?',
      answer:
        "Genwel uses Open Banking to connect to your bank securely. You authorise access through your bank's own app or website, and we never see your login details.",
    },
    {
      question: 'Which banks does Genwel support?',
      answer:
        'Every major UK bank, plus your credit cards. Genwel connects through Open Banking, so if your bank supports it, Genwel can bring your accounts together in one clear view.',
    },
    {
      question: 'How is Genwel different from my banking app?',
      answer:
        'Your banking app shows one account. Genwel brings every bank and card into one view, sorts your spending automatically, and shows you what to fix, like duplicate subscriptions, price rises, and money leaking each month.',
    },
    {
      question: 'Is my money safe?',
      answer:
        'Yes. Genwel only has read-only access to your transaction data. We cannot move your money, make payments, or touch your accounts. Your funds stay exactly where they are.',
    },
    {
      question: 'How much does Genwel cost?',
      answer:
        'Genwel is free to start, with everything you need to see your money in one place. Pro unlocks unlimited bank connections, smart insights, and Ask Genwel for £6.99 a month or £54.99 a year, with a 7-day free trial. See the pricing page for the full breakdown.',
    },
    {
      question: 'Do I have to use every feature?',
      answer:
        'No. Genwel adapts to your money situation, whether you have side-gig income, are paying down an overdraft or credit cards, or send money to family. Use what helps and ignore the rest.',
    },
    {
      question: 'Can I disconnect my bank at any time?',
      answer:
        "Yes. You can remove any connected account instantly from within the app, and we'll delete the associated data.",
    },
  ];

  return (
    <section id="faq" className="py-20 md:py-28 bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider mb-2 block">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
            Got questions? We've got answers.
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-foreground hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FaqSection;
