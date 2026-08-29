import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQ = () => {
  const faqData = [
    {
      question: "What is a phenotype?",
      answer: "A phenotype is an individual's observable physical, biochemical, and behavioral characteristics, such as height, eye color, or blood type, which are determined by both their genotype (genetic makeup) and environmental factors, like diet and exercise. The list of phenotypes presented on this website is a partial list that will be updated as we develop our community further."
    },
    {
      question: "What is Phindex?",
      answer: "Phindex is a platform for classification and discussion of physical phenotypes. Users can create profiles, vote on classifications, and participate in discussions about phenotypic diversity."
    },
    {
      question: "How to create a profile?",
      answer: "To create a profile, you need to be logged in. Click the 'Classify Now!' button in the header, fill out the requested information, and upload the necessary photos."
    },
    {
      question: "How does the voting system work?",
      answer: "Each profile can receive votes in different phenotypic categories. Users can vote once per profile in each category, and results are aggregated to show the most popular classifications."
    },
    {
      question: "What are phenotypic regions?",
      answer: "Phenotypic regions organize profiles by geographic origin and predominant physical characteristics, such as Europe, Africa, Asia, Americas, Middle East, and Oceania. Phenotypes classification refer to the human distribution around the year 1500 before the processes of colonisation and globalisation."
    },
    {
      question: "Can I edit or delete a profile?",
      answer: "You can edit or delete only the profiles that you created. On the profile page, there will be options to edit or delete if you are the creator."
    },
    {
      question: "How does the comment system work?",
      answer: "Each profile has a comments section where users can discuss classifications. Comments can be liked and organized by relevance."
    },
    {
      question: "What to do if I find inappropriate content?",
      answer: "Contact us through the contact page informing the problematic profile or comment. We will review and take necessary measures."
    },
    {
      question: "How to change my photo and username?",
      answer: "Access the Settings page through the top menu that appears when you click on your photo. There you can change your name and profile photo."
    },
    {
      question: "Is the platform free?",
      answer: "Yes, Phindex is completely free to use. You can create profiles, vote, and comment at no cost."
    },
    {
      question: "How does profile search work?",
      answer: "You can search for profiles by name in the search bar in the header. The search shows real-time results as you type."
    },
    {
      question: "Can I download profile photos?",
      answer: "Photos are property of the users who uploaded them. We recommend respecting copyright and not downloading without permission. Please do your best to check for duplicates, periodically, we will clean out inactive or duplicated profiles. If you would like to remove a profile, please report to contact@phenotypeindex.com."
    }
  ];

  // Schema FAQPage: torna as perguntas elegíveis a rich results na busca,
  // expandidas direto no resultado do Google.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(({ question, answer }) => ({
      "@type": "Question",
      "name": question,
      "acceptedAnswer": { "@type": "Answer", "text": answer },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>FAQ - Frequently Asked Questions | Phindex</title>
        <meta
          name="description"
          content="Answers to common questions about Phindex: what a phenotype is, how the voting system works, how to create a profile, and how phenotypic regions are classified."
        />
        <link rel="canonical" href="https://www.phenotypeindex.com/faq" />
        <meta property="og:title" content="FAQ - Frequently Asked Questions | Phindex" />
        <meta
          property="og:description"
          content="Answers to common questions about Phindex, phenotype classification and the voting system."
        />
        <meta property="og:url" content="https://www.phenotypeindex.com/faq" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Phindex - Phenotype Index" />
        <meta property="og:image" content="https://www.phenotypeindex.com/og-default.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@phenotypeindex" />
        <meta name="twitter:title" content="FAQ | Phindex" />
        <meta
          name="twitter:description"
          content="Answers to common questions about Phindex and phenotype classification."
        />
        <meta name="twitter:image" content="https://www.phenotypeindex.com/og-default.png" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
      <Header />
      <AppSidebar />
      <main className="lg:ml-80 pt-16">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <HelpCircle className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">Frequently Asked Questions</CardTitle>
              <CardDescription className="text-lg">
                Find answers to the most common questions about Phindex
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {/* Contact Section */}
              <Card className="mt-8 bg-muted/50">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2">Didn't find your answer?</h3>
                  <p className="text-muted-foreground mb-4">
                    Contact us and we'll be happy to help!
                  </p>
                  <a 
                    href="/contact" 
                    className="text-primary hover:underline font-medium"
                  >
                    Go to contact page →
                  </a>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default FAQ;