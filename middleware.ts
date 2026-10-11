import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return NextResponse.next();

  const { pathname } = request.nextUrl;
  const platform = ['/evaluate','/portfolio','/history','/proof','/network','/calculator','/guide','/support'];
  if (!platform.some(r => pathname.startsWith(r))) return NextResponse.next();

  try {
    const { createServerClient } = await import('@supabase/ssr');
    let res = NextResponse.next({ request });
    const sb = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(c) {
          c.forEach(({ name, value }) => request.cookies.set(name, value));
          res = NextResponse.next({ request });
          c.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        }
      }
    });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.redirect(new URL('/', request.url));
    return res;
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
