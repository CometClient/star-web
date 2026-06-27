import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageShell, PageHero } from "@/components/site/PageShell";

export default function Privacy() {
  return (
    <>
      <SiteHeader />
      <PageShell title="Privacy Policy" description="Comet Client Privacy Policy.">
        <PageHero eyebrow="Legal" title="Privacy Policy" />
        <article className="prose prose-invert max-w-3xl mx-auto prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground">
          <p>We respect your privacy. This policy outlines what we collect and why.</p>
          <h2>What we collect</h2>
          <p>Anonymous crash reports, basic usage analytics (which features are used), and your Minecraft username for cosmetics rendering.</p>
          <h2>What we don't collect</h2>
          <p>We never collect chat messages, world data, IP logs beyond the session, or your Microsoft password.</p>
          <h2>Cookies</h2>
          <p>Our website uses essential cookies only. No third-party trackers.</p>
          <h2>Your rights</h2>
          <p>You may request deletion of any data we hold about you by emailing privacy@cometclient.gg.</p>
        </article>
      </PageShell>
      <SiteFooter />
    </>
  );
}
