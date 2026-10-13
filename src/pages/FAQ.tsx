/**
 * SOBRE O ÍNDICE / FAQ (FAQ.tsx)
 *
 * A definição de fenótipo, as perguntas frequentes (details/summary nativos,
 * sem JavaScript) e um glossário dos termos que aparecem na votação, com a
 * escala ordinal desenhada como faixas para os índices mais difíceis.
 */

import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { SC } from "@/components/kt/Misc";
import { KT, bandSeparators, equalBands } from "@/components/kt/bands";
import { outlineCapsule } from "@/components/kt/Centromere";

const CONTACT_EMAIL = "contact@phenotypeindex.com";

const DEFINITION =
  "An individual’s observable characteristics, such as height, eye color or blood type, shaped by both their genotype and their environment. Phindex only asks about what a photo can show.";

interface FaqItem {
  question: string;
  /** Texto puro, usado no schema FAQPage. */
  answer: string;
  /** Versão com links, quando houver. */
  body?: ReactNode;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is Phindex?",
    answer:
      "Phindex is a platform for classification and discussion of physical phenotypes. Users can create profiles, vote on classifications, and participate in discussions about phenotypic diversity.",
  },
  {
    question: "How does the voting system work?",
    answer:
      "Each profile can receive votes in different phenotypic categories. Users can vote once per profile in each category, and results are aggregated to show the most popular classifications.",
  },
  {
    question: "What are phenotypic regions?",
    answer:
      "Phenotypic regions organize profiles by geographic origin and predominant physical characteristics: Europe, Africa, Asia, Americas, Middle East and Oceania. The classification refers to the human distribution around the year 1500, before colonisation and globalisation.",
  },
  {
    question: "How do I add a profile?",
    answer: "Sign in, choose “add a face” in the header, fill in the details and upload the photos.",
  },
  {
    question: "Can I edit or delete a profile?",
    answer:
      "You can edit or delete only the profiles you created. On the profile page, the options to edit or delete appear if you are the creator.",
  },
  {
    question: "How does the comment system work?",
    answer:
      "Each profile has a comments section where users can discuss classifications. Comments can be liked and organized by relevance.",
  },
  {
    question: "How does profile search work?",
    answer:
      "Use the search box in the header — or press / — to find faces by name, country, phenotype or category as you type. Explore adds filters for region and category.",
    body: (
      <>
        Use the search box in the header — or press <kbd className="rounded-[3px] border border-kt-rule bg-white px-1.5 text-[15px]">/</kbd> — to
        find faces by name, country, phenotype or category as you type. <Link to="/explore">Explore</Link> adds filters for region
        and category.
      </>
    ),
  },
  {
    question: "What if I find inappropriate content?",
    answer:
      "Contact us through the contact page and tell us which profile or comment is the problem. We will review it and take the necessary measures.",
    body: (
      <>
        Contact us through the <Link to="/contact">contact page</Link> and tell us which profile or comment is the problem. We
        will review it and take the necessary measures.
      </>
    ),
  },
  {
    question: "How do I change my photo and username?",
    answer:
      "Open Settings from the menu that appears when you click your photo. There you can change your name and profile photo.",
  },
  {
    question: "Is the platform free?",
    answer: "Yes, Phindex is completely free to use. You can create profiles, vote and comment at no cost.",
  },
  {
    question: "Can I download profile photos?",
    answer: `Photos are the property of the users who uploaded them. Please respect copyright and don’t download without permission. Please check for duplicates before adding a face; inactive or duplicated profiles are cleaned out periodically. To remove a profile, write to ${CONTACT_EMAIL}.`,
    body: (
      <>
        Photos are the property of the users who uploaded them. Please respect copyright and don’t download without
        permission. Please check for duplicates before adding a face; inactive or duplicated profiles are cleaned out
        periodically. To remove a profile, write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </>
    ),
  },
];

interface GlossaryItem {
  term: string;
  aka?: string;
  body: ReactNode;
  /** Rótulos das pontas e do meio de uma escala ordinal de cinco faixas. */
  scale?: [string, string, string];
}

const GLOSSARY: GlossaryItem[] = [
  {
    term: "Head type",
    aka: "cephalic index",
    body: (
      <>
        Head breadth divided by head length, seen from above. <em>Dolichocephalic</em> heads are long and narrow,{" "}
        <em>mesocephalic</em> medium, <em>brachycephalic</em> short and broad.
      </>
    ),
    scale: ["very long", "medium", "very short"],
  },
  {
    term: "Nasal breadth",
    aka: "nasal index",
    body: (
      <>
        Nose width divided by nose height. <em>Leptorrhine</em> means narrow (under about 70), <em>mesorrhine</em> medium,{" "}
        <em>platyrrhine</em> wide (over about 85).
      </>
    ),
    scale: ["very narrow", "medium", "very wide"],
  },
  {
    term: "Facial breadth",
    aka: "facial index",
    body: (
      <>
        Face height against face width. <em>Leptoprosop</em> faces are long, <em>mesoprosop</em> medium,{" "}
        <em>euryprosop</em> broad.
      </>
    ),
  },
  {
    term: "Jaw type",
    body: (
      <>
        Where the jaw sits, seen in profile: <em>retrognathous</em> sits back, <em>orthognathous</em> is straight,{" "}
        <em>prognathous</em> projects forward.
      </>
    ),
  },
  {
    term: "Body type",
    aka: "somatotype",
    body: (
      <>
        <em>Ectomorph</em> is lean and linear, <em>mesomorph</em> muscular, <em>endomorph</em> rounder. Most people mix all
        three; pick the strongest.
      </>
    ),
  },
  {
    term: "Genotype",
    body: <>The genetic code itself. Phindex never sees it; every vote here is about the phenotype.</>,
  },
];

const SCALE_BACKGROUND = `${bandSeparators(5)},${equalBands([KT.wash, KT.b25, KT.b50, KT.b75, KT.slate])}`;

const FAQ = () => {
  // Schema FAQPage: torna as perguntas elegíveis a rich results na busca,
  // expandidas direto no resultado do Google.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [{ question: "What is a phenotype?", answer: DEFINITION }, ...FAQ_ITEMS].map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };

  return (
    <AppLayout>
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
        <meta property="og:image" content="https://www.phenotypeindex.com/og-phindex-faces.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@phenotypeindex" />
        <meta name="twitter:title" content="FAQ | Phindex" />
        <meta name="twitter:description" content="Answers to common questions about Phindex and phenotype classification." />
        <meta name="twitter:image" content="https://www.phenotypeindex.com/og-phindex-faces.png" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <SC as="p" className="m-0 text-[16px] text-kt-teal">
        help
      </SC>
      <h1 className="mb-0 mt-1 text-[clamp(48px,5.8vw,84px)] font-medium leading-[0.95] tracking-[-0.028em] text-kt-ink">
        About the index
      </h1>
      <div className="mt-[22px] max-w-[720px] border-t-[1.5px] border-kt-ink pt-4">
        <p className="m-0 text-[19px] leading-[1.6] text-kt-slate">
          <strong className="font-bold text-kt-ink">phe·no·type</strong> <span className="text-kt-body">/ˈfiː.nə.taɪp/</span>{" "}
          <em>noun.</em> {DEFINITION}
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-start gap-x-14 gap-y-10">
        <section aria-labelledby="faq-title" className="min-w-0 flex-[999_1_420px]">
          <h2 id="faq-title" className="mb-2 mt-0 text-[30px] font-medium leading-[1.15] text-kt-ink">
            Questions
          </h2>
          {FAQ_ITEMS.map((item, index) => (
            <details
              key={item.question}
              open={index === 0}
              className="group border-t border-kt-rule last:border-b"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-1.5 text-[19px] text-kt-ink [&::-webkit-details-marker]:hidden">
                {item.question}
                <Plus
                  aria-hidden="true"
                  strokeWidth={1.7}
                  className="h-[18px] w-[18px] shrink-0 text-kt-teal transition-transform duration-250 ease-kt group-open:rotate-45"
                />
              </summary>
              <p className="mb-[18px] mt-0 max-w-[64ch] text-[17px] leading-[1.6] text-kt-body">{item.body ?? item.answer}</p>
            </details>
          ))}
        </section>

        <section aria-labelledby="gloss-title" className="min-w-0 max-w-[400px] flex-[1_1_320px]">
          <h2 id="gloss-title" className="mb-2 mt-0 text-[30px] font-medium leading-[1.15] text-kt-ink">
            Glossary
          </h2>
          <p className="mb-1.5 mt-0 text-[15px] italic text-kt-body">The terms you’ll meet when voting, in plain words.</p>
          <dl className="m-0">
            {GLOSSARY.map((item) => (
              <div key={item.term} className="border-t border-kt-rule py-4 last:border-b">
                <dt className="text-[19px] text-kt-ink">
                  {item.term}
                  {item.aka && <span className="text-[15px] italic text-kt-body"> · {item.aka}</span>}
                </dt>
                <dd className="mb-0 ml-0 mt-1.5 text-[16px] leading-[1.55] text-kt-body">{item.body}</dd>
                {item.scale && (
                  <>
                    <div
                      aria-hidden="true"
                      className="mt-2.5 box-border h-2.5 rounded-full border border-kt-ink"
                      style={{ background: SCALE_BACKGROUND }}
                    />
                    <div aria-hidden="true" className="mt-[3px] flex justify-between text-[12px] italic text-kt-body">
                      {item.scale.map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="mt-11 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-[3px] border border-kt-rule bg-white px-7 py-6">
        <div>
          <p className="m-0 text-[22px] text-kt-ink">Still stuck?</p>
          <p className="mb-0 mt-1 text-[16px] text-kt-body">
            Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or use the contact page.
          </p>
        </div>
        <Link to="/contact" className={outlineCapsule("min-h-12 px-[22px] text-[17px]")}>
          contact us
        </Link>
      </div>
    </AppLayout>
  );
};

export default FAQ;
