/**
 * Child safety enforcement middleware
 * Enforces age-based restrictions and guardian requirements
 */

import { Context } from 'hono';
import { createLogger } from './observability';
import { logSecurityEvent } from './audit';

const childSafetyLogger = createLogger('child_safety');

export interface ChildSafetyCheck {
  userId: string;
  birthYear?: number;
  country?: string;
  action: 'payment' | 'public_portfolio' | 'marketplace_access' | 'ai_interaction' | 'messaging';
}

/**
 * Calculate user age from birth year
 */
export function calculateAge(birthYear: number): number {
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
}

/**
 * Check if user is a minor (under 18)
 */
export function isMinor(birthYear: number): boolean {
  return calculateAge(birthYear) < 18;
}

/**
 * Check if user is a child (under 13)
 */
export function isChild(birthYear: number): boolean {
  return calculateAge(birthYear) < 13;
}

/**
 * Check if user is a young teen (13-17)
 */
export function isYoungTeen(birthYear: number): boolean {
  const age = calculateAge(birthYear);
  return age >= 13 && age < 18;
}

/**
 * Get country policy for user
 */
export async function getCountryPolicy(
  env: any,
  countryCode: string
): Promise<any> {
  try {
    const sql = env.DB;
    const [policy] = await sql`
      SELECT * FROM country_policies WHERE country_code = ${countryCode}
    `;
    return policy;
  } catch (error) {
    childSafetyLogger.error('Failed to get country policy', {
      error: error instanceof Error ? error.message : String(error),
      countryCode,
    });
    return null;
  }
}

/**
 * Check if guardian approval is required for action
 */
export async function requiresGuardianApproval(
  env: any,
  userId: string,
  action: string
): Promise<boolean> {
  try {
    const sql = env.DB;
    
    // Get user's country and birth year
    const [user] = await sql`
      SELECT p.birth_year, p.country
      FROM profiles p
      WHERE p.user_id = ${userId}
    `;

    if (!user) {
      return false; // No profile data, assume adult
    }

    const age = calculateAge(user.birth_year);
    const policy = await getCountryPolicy(env, user.country);

    if (!policy) {
      // Default: guardian required for under 13
      return age < 13;
    }

    // Use country-specific policy
    if (action === 'payment') {
      return age < policy.minimum_age_for_payment;
    }

    if (action === 'public_portfolio') {
      return age < policy.guardian_consent_required_for_under;
    }

    return false;
  } catch (error) {
    childSafetyLogger.error('Failed to check guardian requirement', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      action,
    });
    return false;
  }
}

/**
 * Check if user has guardian approval
 */
export async function hasGuardianApproval(
  env: any,
  userId: string
): Promise<boolean> {
  try {
    const sql = env.DB;
    const [settings] = await sql`
      SELECT guardian_approval_status
      FROM child_safety_settings
      WHERE user_id = ${userId}
    `;

    if (!settings) {
      return false;
    }

    return settings.guardian_approval_status === 'approved';
  } catch (error) {
    childSafetyLogger.error('Failed to check guardian approval', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return false;
  }
}

/**
 * Enforce child safety for action
 */
export async function enforceChildSafety(
  env: any,
  check: ChildSafetyCheck
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const sql = env.DB;
    
    // Get user profile
    const [profile] = await sql`
      SELECT birth_year, country
      FROM profiles
      WHERE user_id = ${check.userId}
    `;

    if (!profile) {
      // No profile data, assume adult
      return { allowed: true };
    }

    const age = calculateAge(profile.birth_year);
    const policy = await getCountryPolicy(env, profile.country);

    // Get child safety settings
    const [settings] = await sql`
      SELECT * FROM child_safety_settings
      WHERE user_id = ${check.userId}
    `;

    // Check age-based restrictions
    if (check.action === 'payment') {
      const minimumAge = policy?.minimum_age_for_payment || 18;
      if (age < minimumAge) {
        await logSecurityEvent(env, {
          event_type: 'minor_payment_attempt',
          severity: 'high',
          user_id: check.userId,
          details: { age, minimumAge, action: check.action },
        });
        return {
          allowed: false,
          reason: `Payment requires minimum age of ${minimumAge}`,
        };
      }
    }

    if (check.action === 'public_portfolio') {
      const minimumAge = policy?.guardian_consent_required_for_under || 16;
      if (age < minimumAge) {
        if (settings?.portfolio_visibility !== 'private') {
          await logSecurityEvent(env, {
            event_type: 'minor_public_portfolio',
            severity: 'medium',
            user_id: check.userId,
            details: { age, currentVisibility: settings?.portfolio_visibility },
          });
          return {
            allowed: false,
            reason: 'Public portfolio requires guardian consent',
          };
        }
      }
    }

    if (check.action === 'marketplace_access') {
      if (age < 18) {
        if (settings?.marketplace_access) {
          await logSecurityEvent(env, {
            event_type: 'minor_marketplace_access',
            severity: 'high',
            user_id: check.userId,
            details: { age, marketplaceAccess: settings?.marketplace_access },
          });
          return {
            allowed: false,
            reason: 'Marketplace access not allowed for minors',
          };
        }
      }
    }

    if (check.action === 'ai_interaction') {
      if (age < 13) {
        // Children should have limited AI interactions
        const restrictions = policy?.ai_restrictions_for_under || {};
        if (!settings?.ai_interactions_enabled) {
          return {
            allowed: false,
            reason: 'AI interactions disabled for children',
          };
        }
      }
    }

    if (check.action === 'messaging') {
      if (age < 13) {
        if (settings?.messaging_enabled) {
          await logSecurityEvent(env, {
            event_type: 'minor_messaging_attempt',
            severity: 'medium',
            user_id: check.userId,
            details: { age, messagingEnabled: settings?.messaging_enabled },
          });
          return {
            allowed: false,
            reason: 'Messaging not allowed for children',
          };
        }
      }
    }

    // Check guardian approval if required
    const requiresApproval = await requiresGuardianApproval(env, check.userId, check.action);
    if (requiresApproval) {
      const hasApproval = await hasGuardianApproval(env, check.userId);
      if (!hasApproval) {
        return {
          allowed: false,
          reason: 'Guardian approval required',
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    childSafetyLogger.error('Child safety check failed', {
      error: error instanceof Error ? error.message : String(error),
      check,
    });
    return { allowed: false, reason: 'Child safety check failed' };
  }
}

/**
 * Child safety enforcement middleware
 */
export function childSafetyMiddleware(action: string) {
  return async (c: Context, next: () => Promise<void>) => {
    const user = c.get('user') as any;
    
    if (!user) {
      return c.json({ error: 'unauthorized' }, 401);
    }

    const check: ChildSafetyCheck = {
      userId: user.id,
      action: action as any,
    };

    const result = await enforceChildSafety(c.env, check);

    if (!result.allowed) {
      childSafetyLogger.warn('Child safety violation', {
        userId: user.id,
        action,
        reason: result.reason,
      });
      return c.json({
        error: 'forbidden',
        message: result.reason || 'Child safety restriction',
      }, 403);
    }

    await next();
  };
}

/**
 * Apply default child safety settings for new users
 */
export async function applyDefaultChildSafetySettings(
  env: any,
  userId: string,
  birthYear: number
): Promise<void> {
  try {
    const sql = env.DB;
    const age = calculateAge(birthYear);

    // Default settings based on age
    const settings = {
      portfolio_visibility: age < 13 ? 'private' : 'guardian-only',
      marketplace_access: false,
      ai_interactions_enabled: age >= 13,
      messaging_enabled: false,
      guardian_approval_required: age < 13,
      guardian_approval_status: age < 13 ? 'not_required' : 'not_required',
    };

    await sql`
      INSERT INTO child_safety_settings (
        user_id,
        portfolio_visibility,
        marketplace_access,
        ai_interactions_enabled,
        messaging_enabled,
        guardian_approval_required,
        guardian_approval_status
      )
      VALUES (
        ${userId},
        ${settings.portfolio_visibility},
        ${settings.marketplace_access},
        ${settings.ai_interactions_enabled},
        ${settings.messaging_enabled},
        ${settings.guardian_approval_required},
        ${settings.guardian_approval_status}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        portfolio_visibility = ${settings.portfolio_visibility},
        marketplace_access = ${settings.marketplace_access},
        ai_interactions_enabled = ${settings.ai_interactions_enabled},
        messaging_enabled = ${settings.messaging_enabled},
        guardian_approval_required = ${settings.guardian_approval_required},
        guardian_approval_status = ${settings.guardian_approval_status}
    `;

    childSafetyLogger.info('Applied default child safety settings', {
      userId,
      age,
      settings,
    });
  } catch (error) {
    childSafetyLogger.error('Failed to apply child safety settings', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      birthYear,
    });
  }
}
