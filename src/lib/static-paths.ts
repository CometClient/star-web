import { getBlogPosts, getProducts, getSupportArticles } from "./api";

export async function staticSlugs(
  table: string,
  column = "slug",
  filter?: Record<string, unknown>,
): Promise<string[]> {
  if (table === "store_products" || table === "products") {
    const products = await getProducts();
    return products.map((p) => p.slug);
  }
  if (table === "blog_posts") {
    const posts = await getBlogPosts();
    return posts.map((p) => p.slug);
  }
  if (table === "support_articles") {
    const articles = await getSupportArticles();
    return articles.map((a) => a.slug);
  }
  void column;
  void filter;
  return [];
}
