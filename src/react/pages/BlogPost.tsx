import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageShell } from "@/components/site/PageShell";
import { BlogPostView } from "@/components/site/BlogPostView";
import { useParams, Link } from "@/lib/navigation";
import { useEffect, useState } from "react";
import { getBlogPostBySlug } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

interface Post {
  id: string; title: string; excerpt: string | null; cover_url: string | null;
  content_md: string; published_at: string | null;
  mc_author_username: string | null; mc_author_uuid: string | null; read_minutes: number | null;
}

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  useEffect(() => {
    if (!slug) return;
    getBlogPostBySlug(slug).then((data) => {
      if (!data) { setPost(null); return; }
      setPost({
        id: data.id,
        title: data.title,
        excerpt: data.excerpt,
        cover_url: data.cover_url,
        content_md: data.body ?? "",
        published_at: data.published_at,
        mc_author_username: data.mc_author_username,
        mc_author_uuid: data.mc_author_uuid,
        read_minutes: data.read_minutes,
      });
    });
  }, [slug]);

  if (!post) return (<><SiteHeader /><PageShell title="Loading"><div className="text-center text-muted-foreground py-32">Loading…</div></PageShell><SiteFooter /></>);

  return (
    <>
      <SiteHeader />
      <PageShell title={post.title} description={post.excerpt || undefined}>
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8"><ArrowLeft size={16} /> All posts</Link>
        <BlogPostView post={post} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org", "@type": "BlogPosting",
            headline: post.title, description: post.excerpt,
            datePublished: post.published_at,
            author: post.mc_author_username ? { "@type": "Person", name: post.mc_author_username } : undefined,
          })
        }} />
      </PageShell>
      <SiteFooter />
    </>
  );
}
