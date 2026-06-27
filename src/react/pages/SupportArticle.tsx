import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageShell } from "@/components/site/PageShell";
import { Link, useParams } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { getSupportArticleBySlug } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

interface Article { id: string; slug: string; title: string; excerpt: string | null; body_md: string; updated_at: string; }

export default function SupportArticle() {
  const { slug } = useParams();
  const [a, setA] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    getSupportArticleBySlug(slug).then((data) => {
      if (!data) { setA(null); setLoading(false); return; }
      setA({
        id: data.id,
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        body_md: data.body ?? "",
        updated_at: new Date().toISOString(),
      });
      setLoading(false);
    });
  }, [slug]);

  return (
    <>
      <SiteHeader />
      <PageShell title={a?.title || "Article"} description={a?.excerpt || "Comet Client support article."}>
        <div className="max-w-3xl mx-auto">
          <Link to="/support" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"><ArrowLeft size={14} /> Back to help center</Link>
          {loading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : !a ? (
            <div className="rounded-xl border border-white/10 p-8 text-center">
              <div className="font-display text-2xl font-bold mb-2">Article not found</div>
              <Link to="/support" className="text-primary hover:underline">Browse the help center</Link>
            </div>
          ) : (
            <article>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">{a.title}</h1>
              {a.excerpt && <p className="text-lg text-muted-foreground mb-8">{a.excerpt}</p>}
              <div className="prose prose-invert max-w-none prose-headings:font-display prose-a:text-primary whitespace-pre-wrap text-foreground/90 leading-relaxed">
                {a.body_md}
              </div>
              <div className="mt-12 pt-6 border-t border-white/10 text-xs font-mono text-muted-foreground">
                Last updated {new Date(a.updated_at).toLocaleDateString()}
              </div>
            </article>
          )}
        </div>
      </PageShell>
      <SiteFooter />
    </>
  );
}
