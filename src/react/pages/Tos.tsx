import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageShell, PageHero } from "@/components/site/PageShell";

export default function Tos() {
  return (
    <>
      <SiteHeader />
      <PageShell title="Terms of Service" description="Comet Client Terms of Service.">
        <PageHero eyebrow="Legal" title="Terms of Service" />
        <article className="prose prose-invert max-w-3xl mx-auto prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground">
          <p>Last updated: May 2026. By using Comet Client you agree to the following terms.</p>
          <h2>1. Use of service</h2>
          <p>Comet Client is provided free of charge for personal use. You may not redistribute, decompile or commercially resell the software.</p>
          <h2>2. Minecraft account</h2>
          <p>You must own a valid Minecraft Java Edition account. Comet does not store your Microsoft password.</p>
          <h2>3. User content</h2>
          <p>You retain ownership of any content created with Comet. By using cosmetics or skins, you grant us a license to display them in-game.</p>
          <h2>4. Termination</h2>
          <p>We may suspend accounts that violate fair-play or community guidelines.</p>
          <h2>5. Disclaimer</h2>
          <p>Comet is not affiliated with Mojang or Microsoft. Minecraft is a trademark of Mojang AB.</p>
        </article>
      </PageShell>
      <SiteFooter />
    </>
  );
}
