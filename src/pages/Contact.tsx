/**
 * CONTATO (Contact.tsx)
 *
 * Um endereço de e-mail e para que escrever. Sem formulário: o e-mail abre no
 * cliente do usuário e a resposta chega por lá.
 */

import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { CenAnchor, outlineCapsule } from "@/components/kt/Centromere";
import { SC } from "@/components/kt/Misc";

const EMAIL = "contact@phenotypeindex.com";

const TOPICS = [
  { title: "technical support", body: "Website issues, bugs or technical difficulties." },
  { title: "reports & removals", body: "A profile or comment that breaks the rules, or a face that should come down." },
  { title: "suggestions", body: "Ideas to improve the platform and new features." },
  { title: "partnerships", body: "Collaboration proposals and research or business partnerships." },
];

const Contact = () => {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Contact Phindex | Get in Touch</title>
        <meta
          name="description"
          content="Contact the Phindex team to report content, request a profile removal, or ask about phenotype classification."
        />
        <link rel="canonical" href="https://www.phenotypeindex.com/contact" />
        <meta property="og:title" content="Contact Phindex | Get in Touch" />
        <meta
          property="og:description"
          content="Contact the Phindex team to report content, request a profile removal, or ask about phenotype classification."
        />
        <meta property="og:url" content="https://www.phenotypeindex.com/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Phindex - Phenotype Index" />
        <meta property="og:image" content="https://www.phenotypeindex.com/og-phindex-faces.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@phenotypeindex" />
        <meta name="twitter:title" content="Contact | Phindex" />
        <meta
          name="twitter:description"
          content="Contact the Phindex team to report content, request a profile removal, or ask about phenotype classification."
        />
        <meta name="twitter:image" content="https://www.phenotypeindex.com/og-phindex-faces.png" />
      </Helmet>

      <SC as="p" className="m-0 text-[16px] text-kt-teal">
        help
      </SC>
      <h1 className="mb-0 mt-1 text-[clamp(48px,5.8vw,84px)] font-medium leading-[0.95] tracking-[-0.028em] text-kt-ink">
        Contact
      </h1>
      <p className="mb-0 mt-3 max-w-[52ch] text-[19px] italic text-kt-body">
        One address for everything. We usually reply within a day on business days.
      </p>

      <div className="mt-8 max-w-[860px] rounded-[3px] border border-kt-rule bg-white px-[clamp(18px,3vw,32px)] py-7">
        <SC as="p" className="m-0 text-[14px] text-kt-body">
          write to
        </SC>
        <p className="mb-0 mt-1 break-all text-[clamp(26px,3.4vw,40px)] leading-[1.1] text-kt-ink">{EMAIL}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
          <CenAnchor href={`mailto:${EMAIL}`}>send an email</CenAnchor>
          <button type="button" onClick={copyEmail} className={outlineCapsule("min-h-[52px] font-[inherit] text-[17px]")}>
            {copied ? "copied" : "copy address"}
          </button>
          <span className="sr-only" role="status">
            {copied ? "Email address copied" : ""}
          </span>
        </div>
      </div>

      <section aria-labelledby="topics-title" className="mt-10 max-w-[860px]">
        <h2 id="topics-title" className="mb-2 mt-0 text-[30px] font-medium leading-[1.15] text-kt-ink">
          What to write about
        </h2>
        <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-x-10">
          {TOPICS.map((topic) => (
            <div key={topic.title} className="border-t border-kt-rule py-4">
              <SC as="dt" className="text-[16px] font-semibold text-kt-slate">
                {topic.title}
              </SC>
              <dd className="mb-0 ml-0 mt-1 text-[17px] leading-normal text-kt-body">{topic.body}</dd>
            </div>
          ))}
        </dl>
        <p className="mb-0 mt-4 border-t border-kt-rule pt-4 text-[15px] text-kt-body">
          Reporting a profile or comment? Include its link. Many questions are already answered in{" "}
          <Link to="/faq">About the index</Link>.
        </p>
      </section>
    </AppLayout>
  );
};

export default Contact;
