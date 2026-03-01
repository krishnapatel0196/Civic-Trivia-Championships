import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
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

// Encode secret once at module level — reused on every request
const SECRET_KEY = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

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
    const { payload } = await jwtVerify(token, SECRET_KEY, {
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

// Backward-compat alias — existing callers importing authenticateToken continue to work
// until Plan 02 migrates them to requireAuth
export { requireAuth as authenticateToken };

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
    const { payload } = await jwtVerify(token, SECRET_KEY, {
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
 * Requires the authenticated user to have a verified connected_profiles row
 * in the connect schema. Must be used after requireAuth.
 * Returns 403 if no verified connected profile exists.
 */
export async function requireConnected(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { data } = await (supabaseAdmin as any)
    .schema('connect')
    .from('connected_profiles')
    .select('verification_status')
    .eq('user_id', req.userId!)
    .maybeSingle();

  if (!data || data.verification_status !== 'verified') {
    res.status(403).json({ error: 'Connected account required' });
    return;
  }
  next();
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
