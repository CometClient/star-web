import {
  createContext,
  useContext,
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

type Params = Record<string, string>;

const PathContext = createContext<string>("");

export function PathProvider({ path, children }: { path: string; children: ReactNode }) {
  return <PathContext.Provider value={path}>{children}</PathContext.Provider>;
}

function currentPath() {
  if (typeof window !== "undefined") return window.location.pathname;
  return "";
}

export function useLocation() {
  const ctx = useContext(PathContext);
  const [pathname, setPathname] = useState(ctx || currentPath());

  useEffect(() => {
    setPathname(currentPath());
  }, [ctx]);

  return {
    pathname: ctx || pathname,
    search: typeof window !== "undefined" ? window.location.search : "",
    hash: typeof window !== "undefined" ? window.location.hash : "",
    state: null as unknown,
  };
}

function parseParams(pathname: string): Params {
  const blog = pathname.match(/^\/blog\/([^/]+)/);
  if (blog) return { slug: decodeURIComponent(blog[1]) };

  const store = pathname.match(/^\/store\/([^/]+)/);
  if (store) return { slug: decodeURIComponent(store[1]) };

  const support = pathname.match(/^\/support\/([^/]+)/);
  if (support && support[1] !== "new" && support[1] !== "tickets") {
    return { slug: decodeURIComponent(support[1]) };
  }

  return {};
}

export function useParams<T extends Params = Params>(): T {
  const { pathname } = useLocation();
  return parseParams(pathname) as T;
}

export function useNavigate() {
  return (to: string, options?: { replace?: boolean }) => {
    if (options?.replace) window.location.replace(to);
    else window.location.assign(to);
  };
}

type SearchParamSetter = URLSearchParams | Record<string, never>;

export function useSearchParams(): [URLSearchParams, (next: SearchParamSetter) => void] {
  const { search, pathname } = useLocation();
  const [params, setParamsState] = useState(() => new URLSearchParams(search));

  useEffect(() => {
    setParamsState(new URLSearchParams(search));
  }, [search]);

  const setParams = (next: SearchParamSetter) => {
    const qs =
      next instanceof URLSearchParams
        ? next.toString()
        : "";
    const url = qs ? `${pathname}?${qs}` : pathname;
    window.history.replaceState(null, "", url);
    setParamsState(new URLSearchParams(qs));
  };

  return [params, setParams];
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { to: string };

export function Link({ to, href, children, ...props }: LinkProps) {
  return (
    <a href={href ?? to} {...props}>
      {children}
    </a>
  );
}

type NavLinkProps = Omit<LinkProps, "className"> & {
  className?: string | ((state: { isActive: boolean; isPending: boolean }) => string);
  end?: boolean;
};

export function NavLink({ to, className, end, children, ...props }: NavLinkProps) {
  const { pathname } = useLocation();
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const resolved =
    typeof className === "function" ? className({ isActive, isPending: false }) : className;

  return (
    <a href={to} className={resolved} aria-current={isActive ? "page" : undefined} {...props}>
      {children}
    </a>
  );
}
