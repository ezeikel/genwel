import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FaqSection = () => {
  const faqs = [
    {
      question: 'Is Genwel only for Black people?',
      answer:
        'No. Genwel is designed for anyone who relates to the "minus to wealth" journey. While we\'ve built features with Black British financial realities in mind—like family support and remittance tracking—the app is for anyone who wants a budgeting tool that gets real life.',
    },
    {
      question: 'How does Genwel connect to my bank?',
      answer:
        "Genwel uses Open Banking, a secure, FCA-regulated way to connect to your bank. You authorise access through your bank's own app or website. We never see your login credentials.",
    },
    {
      question: 'Is my money safe?',
      answer:
        'Absolutely. Genwel only has read-only access to your transaction data. We cannot move your money, make payments, or access your accounts directly. Your funds stay exactly where they are.',
    },
    {
      question: 'How much will it cost?',
      answer:
        "We're still finalising pricing, but our goal is to make Genwel accessible. Join the waitlist to get early access and special launch pricing.",
    },
    {
      question: 'Do I have to send remittances to use it?',
      answer:
        'Not at all. Remittance tracking is just one feature. Genwel works for anyone with any money situation—whether you send money abroad or not.',
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
