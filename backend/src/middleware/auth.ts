import { Request, Response, NextFunction } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { supabaseAdmin } from '../config/supabase.js';

// Extend Express Request with Supabase auth properties
declare global {
  namespace Express {
    interface Request {
      userId?: string;       // UUID from Supabase JWT sub claim
      accessToken?: string;  // Raw JWT for downstream use
    }
  }
}

// Supabase now issues ES256 JWTs — verify via JWKS endpoint (public key rotation safe)
const JWKS = createRemoteJWKSet(
  new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
);

/**
 * Requires a valid Supabase JWT in the Authorization header.
 * Sets req.userId and req.accessToken on success.
 * Returns 401 if token is missing or invalid.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers.authorization?.slice(7);
  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${process.env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    });
    req.userId = payload.sub as string;
    req.accessToken = token;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
}

/**
 * Optional authentication — allows both authenticated and anonymous requests.
 * Sets req.userId and req.accessToken when a valid JWT is present.
 * Does NOT error on missing or invalid tokens — continues as anonymous.
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers.authorization?.slice(7);

  if (!token) {
    req.userId = undefined;
    next();
    return;
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${process.env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    });
    req.userId = payload.sub as string;
    req.accessToken = token;
    next();
  } catch {
    // Invalid token — continue as anonymous (no error)
    req.userId = undefined;
    next();
  }
}

/**
 * Requires the authenticated user to be in the admin_users table.
 * Must be used after requireAuth.
 * Returns 401 if not authenticated, 403 if not an admin.
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('user_id')
    .eq('user_id', req.userId)
    .maybeSingle();

  if (!data) {
    res.status(403).json({ error: 'Admin required' });
    return;
  }
  next();
}

/**
 * Requires the authenticated user to be a super-admin in the admin_users table.
 * Must be used after requireAuth.
 * Returns 401 if not authenticated, 403 if not a super-admin.
 */
export async function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { data } = await supabaseAdmin
    .from('admin_users')
    .select('super_admin')
    .eq('user_id', req.userId)
    .maybeSingle();

  if (!data?.super_admin) {
    res.status(403).json({ error: 'Super-admin required' });
    return;
  }
  next();
}
