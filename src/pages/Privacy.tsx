/**
 * PRIVACIDADE (Privacy.tsx)
 *
 * Escrita a partir do que o código realmente faz, não de um modelo genérico:
 * as tabelas em uso (profiles, user_profiles, votes, comments, comment_likes,
 * saved_profiles, game_results, game_guesses, user_stats, user_badges,
 * notifications), o bucket "user-profiles" do Storage e o login só com Google.
 *
 * Sem citar legislação, por escolha do operador: linguagem simples, direitos
 * descritos pelo que a pessoa pode pedir na prática. Se um dia o projeto
 * declarar jurisdição, é aqui que a base legal entra.
 */

import { Link } from "react-router-dom";
import { ProseList, ProsePage, ProseSection } from "@/components/kt/Prose";

const CONTACT_EMAIL = "contact@phenotypeindex.com";

const Privacy = () => (
  <ProsePage
    eyebrow="policies"
    title="Privacy"
    path="/privacy"
    updated="14 October 2026"
    metaTitle="Privacy | Phindex"
    metaDescription="What Phindex stores, why, who can see it, and how to have your data or a photo deleted. Written in plain language."
    intro={
      <>
        What the site stores, why it stores it, and how to get it removed. If anything here is unclear, write to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and ask.
      </>
    }
  >
    <ProseSection id="short" title="The short version">
      <ProseList
        items={[
          "You can browse the whole site without an account and without signing in.",
          "An account exists only so that votes, comments and game scores can belong to someone. It is created through Google.",
          "Photos, votes and comments are public by design — that is the point of the site.",
          <>
            Anything here can be deleted on request, including a photo of you posted by somebody else. One email to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> is enough.
          </>,
          "Nothing is sold, and nothing is shared with advertisers or data brokers.",
        ]}
      />
    </ProseSection>

    <ProseSection id="account" title="What is stored about your account">
      <p>Signing in uses Google. Phindex never sees or stores your Google password.</p>
      <ProseList
        items={[
          <>
            <strong>Your email address</strong>, from Google, used to identify the account and to send notifications
            if you leave them on.
          </>,
          <>
            <strong>A nickname and an avatar</strong>, which you choose in <Link to="/settings">Settings</Link>. The
            nickname is what other people see; your email is never shown publicly.
          </>,
          <>
            <strong>Your activity</strong>: votes, comments, likes, saved faces, game results and the badges and
            counts derived from them.
          </>,
        ]}
      />
    </ProseSection>

    <ProseSection id="photos" title="Photos and the faces on the site">
      <p>
        Photos uploaded to a profile are stored on Supabase, the hosting service behind the site, and served
        publicly. A profile also carries whatever the person who created it typed in: a name or nickname, country,
        gender, height and claimed ancestry.
      </p>
      <p>
        Community profiles are shown without a full name, but a photograph identifies a person regardless of the
        label on it. That is worth being clear about rather than glossing over. Anyone who appears in a photo can
        have it removed, whoever posted it and whether or not they have an account.
      </p>
    </ProseSection>

    <ProseSection id="public" title="What is public">
      <p>
        Public to anyone, including search engines: photos, the votes cast on a face and their totals, comments,
        nicknames and avatars, game scores on the <Link to="/leaderboard">leaderboard</Link>, and badges.
      </p>
      <p>
        Not public: your email address, your saved faces, your notification settings, and which particular face you
        personally voted on — only the totals are shown.
      </p>
    </ProseSection>

    <ProseSection id="others" title="Services the site relies on">
      <ProseList
        items={[
          <>
            <strong>Supabase</strong> stores the database and the photos.
          </>,
          <>
            <strong>Vercel</strong> hosts the site and provides basic, aggregated traffic statistics. These do not
            identify individual visitors.
          </>,
          <>
            <strong>Google</strong> handles sign-in. Google knows that you signed in to Phindex; Phindex receives
            only your email address and basic profile information.
          </>,
          <>
            <strong>Google Fonts</strong> serves the typefaces, which means your browser requests them from Google
            when a page loads.
          </>,
        ]}
      />
      <p>No advertising or tracking scripts run on the site, and no data is sold or shared for marketing.</p>
    </ProseSection>

    <ProseSection id="cookies" title="Cookies">
      <p>
        The site does not use advertising or analytics cookies. What it does store in your browser is the sign-in
        session, so you stay logged in, and small preferences such as whether a panel is open. Clearing your browser
        data removes them and signs you out.
      </p>
    </ProseSection>

    <ProseSection id="rights" title="What you can ask for">
      <p>
        Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from any address and say what you want. You
        do not need an account to make any of these requests.
      </p>
      <ProseList
        items={[
          <>
            <strong>Remove a photo.</strong> Including a photo of you that someone else posted. No explanation
            required.
          </>,
          <>
            <strong>Delete your account</strong> and everything attached to it.
          </>,
          <>
            <strong>See what is stored</strong> about you, or have something corrected.
          </>,
        ]}
      />
      <p>
        Requests are handled by one person, usually within a few days. When a profile is deleted, the photos and the
        votes cast on it go with it.
      </p>
    </ProseSection>

    <ProseSection id="children" title="Children">
      <p>
        Phindex is not for children, and photos of children are not allowed, whoever posts them. Accounts are for
        adults. If you find a photo of a child on the site, please report it to{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and it will be removed.
      </p>
    </ProseSection>

    <ProseSection id="changes" title="Changes to this page">
      <p>
        If this policy changes in a way that matters, the date at the top changes with it. The current version is
        always the one on this page.
      </p>
    </ProseSection>
  </ProsePage>
);

export default Privacy;
