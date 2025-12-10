import { createBrowserClient } from "@supabase/ssr";

type CookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
};

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Read cookie from browser
          const cookies = document.cookie.split(";");
          const cookie = cookies.find((c) => c.trim().startsWith(`${name}=`));
          return cookie ? decodeURIComponent(cookie.split("=")[1]) : null;
        },
        set(name: string, value: string, options: CookieOptions = {}) {
          // Write cookie to browser
          let cookieString = `${name}=${encodeURIComponent(value)}`;

          if (options?.maxAge) {
            cookieString += `; max-age=${options.maxAge}`;
          }
          if (options?.path) {
            cookieString += `; path=${options.path}`;
          }
          if (options?.domain) {
            cookieString += `; domain=${options.domain}`;
          }
          if (options?.sameSite) {
            cookieString += `; samesite=${options.sameSite}`;
          }
          if (options?.secure) {
            cookieString += "; secure";
          }

          document.cookie = cookieString;
        },
        remove(name: string, options: CookieOptions = {}) {
          // Delete cookie from browser
          this.set(name, "", { ...options, maxAge: 0 });
        },
      },
    }
  );
}
