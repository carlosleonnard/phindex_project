/**
 * SOBRE (About.tsx)
 *
 * A auditoria de SEO apontou a ausência de qualquer identidade do operador
 * como a falha de confiança mais barata de corrigir: num tema sensível, um
 * site anônimo que classifica pessoas por aparência é julgado com severidade,
 * por avaliadores humanos e por quem chega pela busca.
 *
 * O texto diz o que o Phindex é, o que ele não é, e onde estão os limites do
 * método — a mesma honestidade que o glossário do FAQ já tinha ("Phindex
 * never sees it; every vote here is about the phenotype"), agora visível
 * fora do glossário.
 */

import { Link } from "react-router-dom";
import { ProseList, ProsePage, ProseSection } from "@/components/kt/Prose";

const CONTACT_EMAIL = "contact@phenotypeindex.com";

const About = () => (
  <ProsePage
    eyebrow="about"
    title="About Phindex"
    path="/about"
    metaTitle="About Phindex | Who Runs It and How It Works"
    metaDescription="Phindex is an independent community project for comparing how people read human faces. Who runs it, how the voting works, and what the results do and do not mean."
    intro={
      <>
        Phindex is an independent, non-commercial project. It asks a narrow question: when people look at a face,
        what do they see — and how much do they agree with each other?
      </>
    }
  >
    <ProseSection id="who" title="Who runs this">
      <p>
        Phindex is built and maintained by one person, working on it independently. It is not affiliated with any
        university, laboratory, company or organisation, and no one is paid to influence what appears here.
      </p>
      <p>
        Questions, corrections and complaints all go to the same place:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. A real person reads them. If something on the site is
        wrong, or a photo should not be here, that address is the fastest way to fix it — see{" "}
        <Link to="/contact">Contact</Link>.
      </p>
    </ProseSection>

    <ProseSection id="what" title="What the site does">
      <p>
        Someone adds a face. Other people look at it and vote on what they see: a region, a phenotype, and ten
        physical traits such as skin colour, hair texture and nose shape. The site adds the votes up and shows where
        people agreed and where they did not.
      </p>
      <p>
        The disagreement is the interesting part. A face that half the voters read one way and half another says
        something that a single confident label never could.
      </p>
      <p>
        There is also a game, <Link to="/game">Guess the phenotype</Link>, which asks the same question with the name
        and country hidden — so you can compare what people guess from a face alone against what they say when they
        know who they are looking at.
      </p>
    </ProseSection>

    <ProseSection id="limits" title="What the results mean, and what they don't">
      <p>
        Everything here is <strong>opinion data</strong>: a record of how a group of people on the internet read a
        photograph. That is all it is, and the distinction matters.
      </p>
      <ProseList
        items={[
          <>
            <strong>It is not genetics.</strong> Phindex never sees anyone's DNA. Every vote is about what is visible
            in a photo.
          </>,
          <>
            <strong>It is not ancestry testing.</strong> A phenotype label is not a finding about where someone's
            family came from. The ancestry shown on a profile is what the person who posted it typed in.
          </>,
          <>
            <strong>It is not a measurement.</strong> Nobody here measures a skull or a nose. People look and choose
            from a list, and lighting, angle and expression all change what they choose.
          </>,
          <>
            <strong>Small numbers mean little.</strong> Most faces have only a handful of votes. A trait showing
            "100%" on two votes tells you about those two voters, not about the face.
          </>,
          <>
            <strong>Voters are not a sample of anyone.</strong> They are whoever happened to visit the site, which is
            not a representative group of any population.
          </>,
        ]}
      />
      <p>
        The vocabulary of physical types comes from older physical anthropology, a field that has largely moved away
        from it. We use it because it is the shared vocabulary this community already speaks, not because these
        categories are natural divisions of humanity. They are not.
      </p>
    </ProseSection>

    <ProseSection id="people" title="The people in the photos">
      <p>
        Faces reach the site in two ways: public figures, filed under a category, and community profiles, posted by
        people about themselves or someone they know, shown without a full name.
      </p>
      <p>
        If you are in a photo here and you would rather not be, write to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and it will be taken down. You do not have to explain
        why, and you do not need an account. The same goes for a photo of someone you are responsible for.
      </p>
      <p>
        Posting a photo of another person without their agreement is against <Link to="/terms">the rules</Link>, and
        photos of children are not allowed at all.
      </p>
    </ProseSection>

    <ProseSection id="rules" title="How it is moderated">
      <p>
        Reports go to the contact address and are handled by the same person who runs the site — usually within a day,
        sometimes longer. Profiles that break the rules are removed. Duplicates and abandoned profiles are cleared out
        from time to time.
      </p>
      <p>
        This is a small project, not a moderation team. If something slips through, reporting it is what makes it get
        fixed.
      </p>
    </ProseSection>

    <ProseSection id="more" title="Read more">
      <p>
        <Link to="/faq">About the index</Link> explains the voting and defines the measurement terms.{" "}
        <Link to="/privacy">Privacy</Link> covers what is stored and how to have it deleted.{" "}
        <Link to="/terms">Terms</Link> sets out the rules for posting.
      </p>
    </ProseSection>
  </ProsePage>
);

export default About;
