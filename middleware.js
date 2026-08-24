import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/privacy')) {
    return NextResponse.next()
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
