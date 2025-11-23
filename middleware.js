// middleware.js
import { NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export async function middleware(req) {
  const TEAM_DOMAIN = process.env.CLOUDFLARE_TEAM_DOMAIN;
  const AUD_TAG = process.env.CLOUDFLARE_AUD_TAG;

  // Skip authentication on localhost for development
  if (req.nextUrl.hostname === 'localhost' || req.nextUrl.hostname === '127.0.0.1') {
    console.log('🏠 Localhost detected - skipping Cloudflare authentication');
    return NextResponse.next();
  }

  // Get the Cloudflare Access JWT token
  const token = req.headers.get('Cf-Access-Jwt-Assertion') || 
                req.cookies.get('CF_Authorization')?.value;

  // No token means user bypassed Cloudflare or isn't authenticated
  if (!token) {
    console.error('❌ No Cloudflare Access token found');
    return new NextResponse(
      JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Missing Cloudflare Access token. Please access via the protected domain.'
      }),
      { 
        status: 403, 
        headers: { 'content-type': 'application/json' } 
      }
    );
  }

  try {
    // Load Cloudflare's public keys for JWT verification
    const CERTS_URL = `${TEAM_DOMAIN}/cdn-cgi/access/certs`;
    const JWKS = createRemoteJWKSet(new URL(CERTS_URL));

    // Verify the token was issued by Cloudflare for your team and app
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: TEAM_DOMAIN,
      audience: AUD_TAG,
    });

    console.log('✅ Authenticated user:', payload.email);

    // Optional: Add user email to request headers for use in your app
    const response = NextResponse.next();
    response.headers.set('X-User-Email', payload.email);
    
    return response;

  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Invalid Cloudflare Access token'
      }),
      { 
        status: 403, 
        headers: { 'content-type': 'application/json' } 
      }
    );
  }
}

// Protect all routes except static assets
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
