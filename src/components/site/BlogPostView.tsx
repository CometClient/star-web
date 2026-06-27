import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Clock } from "lucide-react";

export interface BlogPostViewData {
  title: string;
  excerpt?: string | null;
  cover_url?: string | null;
  content_md: string;
  published_at?: string | null;
  mc_author_username?: string | null;
  mc_author_uuid?: string | null;
  read_minutes?: number | null;
}

function mcHead(name?: string | null, uuid?: string | null) {
  if (uuid) return `https://mc-heads.net/avatar/${uuid}/96`;
  if (name) return `https://mc-heads.net/avatar/${name}/96`;
  return null;
}

interface Props {
  post: BlogPostViewData;
  compact?: boolean;
}

export function BlogPostView({ post, compact }: Props) {
  const head = mcHead(post.mc_author_username, post.mc_author_uuid);
  const date = post.published_at ? new Date(post.published_at) : new Date();

  return (
    <article className={compact ? "" : "max-w-3xl mx-auto"}>
      <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-4">Comet Blog</div>
      <h1 className={`font-display ${compact ? "text-3xl" : "text-4xl md:text-6xl"} font-bold tracking-tighter text-gradient mb-5`}>
        {post.title || "Untitled"}
      </h1>
      {post.excerpt && <p className={`${compact ? "text-base" : "text-lg"} text-muted-foreground mb-8`}>{post.excerpt}</p>}

      <div className="flex items-center gap-3 mb-10 pb-8 border-b border-white/5">
        {head && (
          <img
            src={head}
            alt={post.mc_author_username || "author"}
            className="w-11 h-11 rounded-lg ring-1 ring-white/10 [image-rendering:pixelated]"
          />
        )}
        <div>
          {post.mc_author_username && (
            <div className="font-display font-semibold text-sm">{post.mc_author_username}</div>
          )}
          <div className="text-xs font-mono text-muted-foreground">
            {date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            {post.read_minutes ? (
              <>
                {" · "}
                <Clock size={10} className="inline mr-1" />
                {post.read_minutes} min read
              </>
            ) : null}
          </div>
        </div>
      </div>

      {post.cover_url && (
        <img
          src={post.cover_url}
          alt={post.title}
          className="rounded-2xl w-full mb-10 ring-1 ring-white/10"
        />
      )}

      <div className="prose prose-invert max-w-none prose-headings:font-display prose-a:text-primary prose-strong:text-foreground prose-p:text-muted-foreground prose-img:rounded-xl prose-img:ring-1 prose-img:ring-white/10">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.content_md || "*Start writing markdown to preview…*"}
        </ReactMarkdown>
      </div>
    </article>
  );
}
