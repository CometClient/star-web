import { AppProviders } from "@/components/AppProviders";
import { PathProvider } from "@/lib/navigation";
import Auth from "@/react/pages/Auth";
import Blog from "@/react/pages/Blog";
import BlogPost from "@/react/pages/BlogPost";
import Changelog from "@/react/pages/Changelog";
import Denied from "@/react/pages/Denied";
import Download from "@/react/pages/Download";
import Home from "@/react/pages/Home";
import Jobs from "@/react/pages/Jobs";
import NotFound from "@/react/pages/NotFound";
import Privacy from "@/react/pages/Privacy";
import Status from "@/react/pages/Status";
import Store from "@/react/pages/Store";
import StoreProduct from "@/react/pages/StoreProduct";
import Support from "@/react/pages/Support";
import SupportArticle from "@/react/pages/SupportArticle";
import SupportNewTicket from "@/react/pages/SupportNewTicket";
import SupportTickets from "@/react/pages/SupportTickets";
import Tos from "@/react/pages/Tos";
import BetaAuth from "@/react/pages/beta/BetaAuth";
import BetaHome from "@/react/pages/beta/BetaHome";
import type { ComponentType } from "react";

const PAGES = {
  home: Home,
  download: Download,
  blog: Blog,
  "blog-post": BlogPost,
  support: Support,
  "support-article": SupportArticle,
  "support-new": SupportNewTicket,
  "support-tickets": SupportTickets,
  status: Status,
  jobs: Jobs,
  store: Store,
  "store-product": StoreProduct,
  changelog: Changelog,
  tos: Tos,
  privacy: Privacy,
  auth: Auth,
  denied: Denied,
  "beta-auth": BetaAuth,
  "beta-home": BetaHome,
  notFound: NotFound,
} satisfies Record<string, ComponentType>;

export type ReactPageId = keyof typeof PAGES;

export function ReactPage({ page }: { page: ReactPageId }) {
  const Page = PAGES[page];
  if (!Page) return null;

  return (
    <AppProviders>
      <PathProvider path="">
        <Page />
      </PathProvider>
    </AppProviders>
  );
}
