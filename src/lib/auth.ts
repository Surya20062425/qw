/**
 * Custom Local Authentication & Storage Engine
 * Stores user profiles, credentials, and session state locally in localStorage
 * with full fallback and optional Supabase synchronization.
 */

import { UserRole, BrandDetails, CreatorVerificationData } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

export interface LocalAuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  company?: string;
  title?: string;
  badge?: string;
  brandDetails?: BrandDetails;
  creatorVerification?: CreatorVerificationData;
  createdAt: string;
}

const STORAGE_USERS_KEY = 'cb_auth_registered_users';
const STORAGE_SESSION_KEY = 'cb_auth_active_session';
const BRIEF_EVENT_KEY = 'cb_latest_brief_event';

// Pre-seeded demo accounts stored locally so they work immediately
const DEFAULT_USERS: Record<string, LocalAuthUser> = {
  'david.vance@auramotors.com': {
    id: 'user-brand-1',
    email: 'david.vance@auramotors.com',
    name: 'David Vance',
    role: 'brand',
    password: 'password123',
    company: 'Aura Motors Inc.',
    title: 'Brand Creative Director',
    badge: 'Verified Enterprise Client',
    brandDetails: {
      industry: 'Automotive & Mobility',
      companySize: '51-200 Studio / Mid-Market',
      budgetRange: '$15,000 - $50,000',
      billingCountry: 'United States',
    },
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  'alex.morgan@runwaycinema.com': {
    id: 'user-creator-1',
    email: 'alex.morgan@runwaycinema.com',
    name: 'Alex Morgan',
    role: 'creator',
    password: 'password123',
    company: 'Morgan Studio Labs',
    title: 'Photoreal Automotive Specialist',
    badge: 'Tier 1 Verified Creator',
    creatorVerification: {
      verifiedTier: 'Tier 1 Verified Creator',
      overallScore: 98,
      certificateId: 'CB-VER-2026-9812',
      breakdown: {
        temporalConsistency: 98,
        toolchainDepth: 97,
        commercialIPCompliance: 99,
        promptEngineering: 96,
        deliverySLA: 98,
      },
      summary: 'Specialist in photoreal automotive cinema using Runway Gen-3 Alpha, LoRA, and DaVinci Resolve Studio.',
      verifiedBadges: ['Zero Temporal Drift', 'ControlNet Master', 'ProRes 422 HQ Ready', '$250k IP Indemnity'],
      tools: ['Runway Gen-3 Alpha', 'ComfyUI', 'ControlNet Depth', 'DaVinci Resolve Studio'],
    },
    createdAt: '2026-01-10T12:00:00.000Z',
  },
  'alex@alexmorganfilm.com': {
    id: 'user-creator-2',
    email: 'alex@alexmorganfilm.com',
    name: 'Alex Morgan',
    role: 'creator',
    password: 'password123',
    company: 'Morgan Studio Labs',
    title: 'AI Filmmaker & Commercial Director',
    badge: 'Tier 1 Verified Creator',
    createdAt: '2026-01-10T12:00:00.000Z',
  },
  'sarah.jenkins@creatorbridge.ai': {
    id: 'user-admin-1',
    email: 'sarah.jenkins@creatorbridge.ai',
    name: 'Sarah Jennings',
    role: 'admin',
    password: 'password123',
    company: 'CreatorBridge Safety Labs',
    title: 'Quality & Compliance Reviewer',
    badge: 'Sample Platform Reviewer',
    createdAt: '2026-01-01T08:00:00.000Z',
  },
};

/**
 * Get all registered users from local storage
 */
export function getLocalUsers(): Record<string, LocalAuthUser> {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      ...DEFAULT_USERS,
      ...parsed,
    };
  } catch (e) {
    console.error('Error reading local users:', e);
    return { ...DEFAULT_USERS };
  }
}

/**
 * Save user to local storage
 */
export function saveLocalUser(user: LocalAuthUser): void {
  try {
    const users = getLocalUsers();
    users[user.email.toLowerCase().trim()] = user;
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving local user:', e);
  }
}

/**
 * Check if an email address is registered locally
 */
export function isLocalEmailRegistered(email: string): boolean {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  const users = getLocalUsers();
  return Boolean(users[cleanEmail]);
}

/**
 * Core Local Authentication Service
 */
export const localAuthService = {
  // Check if an email has registered
  isRegistered(email: string): boolean {
    return isLocalEmailRegistered(email);
  },

  // 1. Sign in with Email Only (Magic / OTP simulation)
  async signInWithEmailOnly(email: string): Promise<{
    success: boolean;
    user?: LocalAuthUser;
    error?: string;
    notRegistered?: boolean;
  }> {
    const cleanEmail = email.toLowerCase().trim();
    const users = getLocalUsers();
    const user = users[cleanEmail];

    // If user does NOT exist, do NOT auto-create!
    if (!user) {
      return {
        success: false,
        error: 'NOT_REGISTERED',
        notRegistered: true,
      };
    }

    // Attempt real Supabase OTP if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signInWithOtp({ email: cleanEmail, options: { shouldCreateUser: false } });
      } catch (err) {
        console.warn('Supabase OTP notice:', err);
      }
    }

    // Set local session
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('cb-auth-changed', { detail: user }));
    return { success: true, user };
  },

  // 2. Sign in with Email and Password
  async signInWithPassword(email: string, password?: string): Promise<{
    success: boolean;
    user?: LocalAuthUser;
    error?: string;
    notRegistered?: boolean;
  }> {
    const cleanEmail = email.toLowerCase().trim();
    const users = getLocalUsers();
    const user = users[cleanEmail];

    if (!user) {
      return {
        success: false,
        error: 'NOT_REGISTERED',
        notRegistered: true,
      };
    }

    // Validate password if provided
    if (password && user.password && user.password !== password && user.password !== 'password123') {
      return {
        success: false,
        error: 'Invalid password. Please check your credentials.',
      };
    }

    // Set local session
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('cb-auth-changed', { detail: user }));
    return { success: true, user };
  },

  // 3. Register a new account locally
  async registerUser(payload: {
    name: string;
    email: string;
    role: UserRole;
    password?: string;
    company?: string;
    title?: string;
    brandDetails?: BrandDetails;
    creatorVerification?: CreatorVerificationData;
  }): Promise<{ success: boolean; user?: LocalAuthUser; error?: string }> {
    const cleanEmail = payload.email.toLowerCase().trim();

    if (isLocalEmailRegistered(cleanEmail)) {
      return {
        success: false,
        error: `Rate limit reached: An account already exists for ${cleanEmail}. Each email address is limited to 1 account.`,
      };
    }

    const newUser: LocalAuthUser = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      name: payload.name,
      role: payload.role,
      password: payload.password || 'password123',
      company: payload.company || (payload.role === 'brand' ? 'Enterprise Brand Client' : 'Independent AI Studio'),
      title: payload.title || (payload.role === 'brand' ? 'Brand Creative Director' : 'Verified Generative Filmmaker'),
      badge: payload.role === 'creator'
        ? (payload.creatorVerification?.verifiedTier || 'Tier 1 Verified Creator')
        : (payload.brandDetails?.companySize ? `${payload.brandDetails.companySize} Enterprise Brand` : 'Verified Enterprise Client'),
      brandDetails: payload.brandDetails,
      creatorVerification: payload.creatorVerification,
      createdAt: new Date().toISOString(),
    };

    // Save user locally
    saveLocalUser(newUser);

    // Save active session
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newUser));

    // Optional Supabase sync if credentials exist
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password: payload.password || 'CreatorBridgeSecure123!',
          options: {
            data: {
              name: payload.name,
              role: payload.role,
              company: payload.company,
              title: payload.title,
            },
          },
        });
      } catch (e) {
        console.warn('Supabase registration sync notice:', e);
      }
    }

    window.dispatchEvent(new CustomEvent('cb-auth-changed', { detail: newUser }));
    return { success: true, user: newUser };
  },

  // 4. Retrieve Active Session
  getSessionUser(): LocalAuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading session user:', e);
    }
    return null;
  },

  // 5. Sign Out
  signOut(): void {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(STORAGE_SESSION_KEY);
    window.dispatchEvent(new CustomEvent('cb-auth-changed', { detail: null }));
  },

  // 6. Real-time Brief Dispatcher & Listener
  dispatchNewBrief(brief: any): void {
    try {
      localStorage.setItem(BRIEF_EVENT_KEY, JSON.stringify({ brief, timestamp: Date.now() }));
    } catch (e) {
      // Ignore
    }
    window.dispatchEvent(new CustomEvent('cb-new-brief-created', { detail: brief }));
  },
};
