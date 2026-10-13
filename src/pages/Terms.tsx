/**
 * TERMOS (Terms.tsx)
 *
 * As regras que o modal de adicionar rosto já mostra (HOUSE_RULES em
 * AddProfileModal), agora escritas por extenso e com endereço próprio — o
 * modal pede concordância com regras que não existiam em lugar nenhum.
 *
 * Sem citar legislação, por escolha do operador.
 */

import { Link } from "react-router-dom";
import { ProseList, ProsePage, ProseSection } from "@/components/kt/Prose";

const CONTACT_EMAIL = "contact@phenotypeindex.com";

const Terms = () => (
  <ProsePage
    eyebrow="policies"
    title="Terms"
    path="/terms"
    updated="14 October 2026"
    metaTitle="Terms | Phindex"
    metaDescription="The rules for using Phindex: what you may post, what you may not, who owns what, and how removals work."
    intro={
      <>
        The rules for using Phindex. Browsing needs no account and no agreement; posting, voting and commenting mean
        accepting what is on this page.
      </>
    }
  >
    <ProseSection id="what" title="What Phindex is">
      <p>
        Phindex is an independent community project where people vote on how they read human faces. It is free, it
        is not a scientific instrument, and its results are opinions rather than measurements —{" "}
        <Link to="/about">About</Link> explains this in more detail. Nothing here should be used to make a decision
        about a real person.
      </p>
    </ProseSection>

    <ProseSection id="account" title="Your account">
      <p>
        Accounts are for adults and are created through Google. Keep yours to yourself: activity under your account
        is treated as yours. You can delete it at any time by writing to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </ProseSection>

    <ProseSection id="rules" title="Posting a face">
      <p>These are the rules shown before you add a photo, in full:</p>
      <ProseList
        items={[
          <>
            <strong>Only post photos you are allowed to share.</strong> Your own photo, or one you have permission
            to use.
          </>,
          <>
            <strong>Do not post someone else's photo without their agreement.</strong> A private person who has not
            agreed does not belong on the site.
          </>,
          <>
            <strong>No photos of children.</strong> No exceptions.
          </>,
          <>
            <strong>Describe ancestry accurately</strong>, or leave it out. Invented detail makes the whole index
            worth less.
          </>,
          <>
            <strong>Classify what is visible</strong>, not what you assume about a group.
          </>,
          <>
            <strong>Check for duplicates</strong> before adding a face.
          </>,
        ]}
      />
      <p>
        Public figures are a narrower case: a photo you have the right to use, of someone genuinely public, filed
        under the right category.
      </p>
    </ProseSection>

    <ProseSection id="conduct" title="Voting and commenting">
      <p>
        Vote for what you actually see. Do not create several accounts to push a result, and do not vote to make a
        point about a person.
      </p>
      <p>
        Comments are for discussing the reading of a face. Harassment, slurs, and content attacking people for their
        appearance, ancestry, ethnicity, religion, gender or sexuality are removed, and the accounts behind them are
        closed. Treating the taxonomy as a ranking of human beings is a misuse of this site.
      </p>
    </ProseSection>

    <ProseSection id="ownership" title="Who owns what">
      <p>
        Photos belong to whoever uploaded them, or to their original copyright holder. Posting one here gives
        Phindex permission to display it on the site and to show it in link previews — nothing more, and only for as
        long as it stays up.
      </p>
      <p>
        Please do not download or republish other people's photos from the site. The votes and totals are generated
        by the community collectively; the site code and design belong to the project.
      </p>
    </ProseSection>

    <ProseSection id="removals" title="Removals">
      <p>
        Anyone in a photo can have it removed, with no explanation and no account needed:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. The same address handles copyright complaints and
        reports of content that breaks these rules — include the link.
      </p>
      <p>
        Profiles that break the rules are removed. Duplicated and abandoned profiles are cleared out periodically.
        Accounts used for harassment or vote manipulation are closed.
      </p>
    </ProseSection>

    <ProseSection id="asis" title="No guarantees">
      <p>
        The site is provided as it is. It may be slow, wrong, or briefly gone. Classifications are the opinions of
        whoever happened to vote, they are often based on very few votes, and they are not a statement of fact about
        anybody. Use the site accordingly.
      </p>
    </ProseSection>

    <ProseSection id="changes" title="Changes">
      <p>
        These terms can change as the site changes. The date at the top shows the last revision, and continuing to
        use Phindex means accepting the current version.
      </p>
    </ProseSection>
  </ProsePage>
);

export default Terms;
