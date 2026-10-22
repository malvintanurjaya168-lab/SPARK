import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { ROLES } from '@/lib/constants';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/setup-password'];
const publicApiRoutes = ['/api/auth/login', '/api/auth/setup-password', '/api/keep-alive'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.') // Assumes files with extensions are public assets
  ) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check session
  const session = await getSession(request);

  // If unauthenticated and not on a public page, redirect to login
  if (!session && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If authenticated and on login page, redirect to respective dashboard
  if (session && publicRoutes.includes(pathname)) {
    if (session.role === ROLES.KESISWAAN) {
      return NextResponse.redirect(new URL('/kesiswaan', request.url));
    } else if (session.role === ROLES.GURU) {
      return NextResponse.redirect(new URL('/guru', request.url));
    } else if (session.role === ROLES.ADMIN_PEMBINA_ASRAMA) {
      return NextResponse.redirect(new URL('/admin-pembina-asrama', request.url));
    } else {
      return NextResponse.redirect(new URL('/siswa', request.url));
    }
  }

  // Role-based route protection
  if (session) {
    if (pathname.startsWith('/kesiswaan') && session.role !== ROLES.KESISWAAN) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (pathname.startsWith('/guru') && session.role !== ROLES.GURU) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (pathname.startsWith('/admin-pembina-asrama') && session.role !== ROLES.ADMIN_PEMBINA_ASRAMA) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    if (pathname.startsWith('/siswa') && session.role !== ROLES.SISWA) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
