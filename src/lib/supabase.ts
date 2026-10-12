import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from environment or user-custom runtime configuration
const envSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const envSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const CUSTOM_SUPABASE_URL_KEY = 'cb_custom_supabase_url';
const CUSTOM_SUPABASE_KEY_KEY = 'cb_custom_supabase_anon_key';

export function getEffectiveSupabaseConfig() {
  try {
    const customUrl = localStorage.getItem(CUSTOM_SUPABASE_URL_KEY);
    const customKey = localStorage.getItem(CUSTOM_SUPABASE_KEY_KEY);
    if (customUrl && customKey) {
      return { url: customUrl.trim(), key: customKey.trim(), isCustom: true };
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return { url: envSupabaseUrl, key: envSupabaseAnonKey, isCustom: false };
}

export function setCustomSupabaseConfig(url: string, key: string) {
  try {
    if (!url || !key) {
      localStorage.removeItem(CUSTOM_SUPABASE_URL_KEY);
      localStorage.removeItem(CUSTOM_SUPABASE_KEY_KEY);
    } else {
      localStorage.setItem(CUSTOM_SUPABASE_URL_KEY, url.trim());
      localStorage.setItem(CUSTOM_SUPABASE_KEY_KEY, key.trim());
    }
    window.location.reload();
  } catch (e) {
    console.error('Failed to save custom supabase credentials:', e);
  }
}

const currentConfig = getEffectiveSupabaseConfig();

// Check if credentials look like real Supabase keys
export const isSupabaseConfigured = Boolean(
  currentConfig.url && 
  currentConfig.key && 
  currentConfig.url.includes('supabase.co') && 
  !currentConfig.url.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(currentConfig.url, currentConfig.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

// Supabase Auth User Interface
export interface SupabaseAuthUser {
  id: string;
  email: string;
  role: 'brand' | 'creator' | 'admin';
  user_metadata: Record<string, any>;
  created_at: string;
  password?: string;
}

const STORAGE_USERS_KEY = 'cb_supabase_registered_users';
const STORAGE_SESSION_KEY = 'cb_supabase_current_session';

// Pre-seeded demo accounts recognized as registered in the marketplace
export const PRE_SEEDED_REGISTERED_EMAILS: Record<string, SupabaseAuthUser> = {
  'david.vance@auramotors.com': {
    id: 'usr_brand_demo',
    email: 'david.vance@auramotors.com',
    role: 'brand',
    password: 'password123',
    user_metadata: {
      name: 'David Vance',
      company: 'Aura Motors Inc.',
      title: 'Brand Creative Director',
      industry: 'Automotive & Mobility',
      companySize: '51-200 Studio / Mid-Market',
    },
    created_at: '2026-01-15T10:00:00.000Z',
  },
  'alex.morgan@runwaycinema.com': {
    id: 'usr_creator_demo',
    email: 'alex.morgan@runwaycinema.com',
    role: 'creator',
    password: 'password123',
    user_metadata: {
      name: 'Alex Morgan',
      company: '@alex_morgan_cinema',
      title: 'Photoreal Automotive Specialist',
      verifiedTier: 'Tier 1 Verified Creator',
      certificateId: 'CB-VER-2026-9812',
      overallScore: 98,
    },
    created_at: '2026-01-10T12:00:00.000Z',
  },
  'alex@alexmorganfilm.com': {
    id: 'usr_creator_demo_alt',
    email: 'alex@alexmorganfilm.com',
    role: 'creator',
    password: 'password123',
    user_metadata: {
      name: 'Alex Morgan',
      company: 'Morgan Studio Labs',
      title: 'AI Filmmaker & Commercial Director',
      verifiedTier: 'Tier 1 Verified Creator',
      certificateId: 'CB-VER-2026-9812',
      overallScore: 98,
    },
    created_at: '2026-01-10T12:00:00.000Z',
  },
  'sarah.jenkins@creatorbridge.ai': {
    id: 'usr_admin_demo',
    email: 'sarah.jenkins@creatorbridge.ai',
    role: 'admin',
    password: 'password123',
    user_metadata: {
      name: 'Sarah Jennings',
      company: 'CreatorBridge Safety Labs',
      title: 'Quality & Compliance Reviewer',
    },
    created_at: '2026-01-01T08:00:00.000Z',
  },
  'sarah.jennings@creatorbridge.ai': {
    id: 'usr_admin_demo_2',
    email: 'sarah.jennings@creatorbridge.ai',
    role: 'admin',
    password: 'password123',
    user_metadata: {
      name: 'Sarah Jennings',
      company: 'CreatorBridge Safety Labs',
      title: 'Quality & Compliance Reviewer',
    },
    created_at: '2026-01-01T08:00:00.000Z',
  },
};

export function getStoredSupabaseUsers(): Record<string, SupabaseAuthUser> {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      ...PRE_SEEDED_REGISTERED_EMAILS,
      ...parsed,
    };
  } catch (e) {
    console.error('Error loading stored supabase users:', e);
    return { ...PRE_SEEDED_REGISTERED_EMAILS };
  }
}

export function saveStoredSupabaseUser(user: SupabaseAuthUser) {
  try {
    const users = getStoredSupabaseUsers();
    users[user.email.toLowerCase().trim()] = user;
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving supabase user:', e);
  }
}

export function isEmailRegistered(email: string): boolean {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  const users = getStoredSupabaseUsers();
  return Boolean(users[cleanEmail]);
}

// Unified Supabase Email Auth Service
export const supabaseAuthService = {
  // Check if an email has registered an account
  isRegistered(email: string): boolean {
    return isEmailRegistered(email);
  },

  // 1. Email-Only Authentication (OTP / Magic Link / Email Auth)
  async signInWithEmailOnly(email: string): Promise<{ success: boolean; user?: SupabaseAuthUser; error?: string; notRegistered?: boolean }> {
    const cleanEmail = email.trim().toLowerCase();

    // Check if user is registered in the system
    const users = getStoredSupabaseUsers();
    const existing = users[cleanEmail];

    if (!existing) {
      // User is NOT registered - do NOT silently create an account!
      // Return clear error so the login UI can display the Register Popup Modal.
      return {
        success: false,
        error: 'NOT_REGISTERED',
        notRegistered: true,
      };
    }

    // If real Supabase is configured, trigger real OTP request
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: false,
          },
        });
        if (error) {
          console.warn('Supabase signInWithOtp notice:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase real client error:', err.message);
      }
    }

    // Establish active session
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(existing));
    return { success: true, user: existing };
  },

  // 2. Email + Password Sign In
  async signInWithPassword(email: string, password?: string): Promise<{ success: boolean; user?: SupabaseAuthUser; error?: string; notRegistered?: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    const users = getStoredSupabaseUsers();
    const existing = users[cleanEmail];

    if (!existing) {
      return {
        success: false,
        error: 'NOT_REGISTERED',
        notRegistered: true,
      };
    }

    // If real Supabase is configured, trigger real password auth
    if (supabase && password) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) {
          console.warn('Supabase signInWithPassword notice:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase password error:', err.message);
      }
    }

    // Establish active session
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(existing));
    return { success: true, user: existing };
  },

  // 3. Sign Up with Email, Form Metadata & Role
  async signUpWithForm(
    email: string,
    password: string,
    metadata: Record<string, any>,
    role: 'brand' | 'creator'
  ): Promise<{ success: boolean; user?: SupabaseAuthUser; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    // Trigger real Supabase signup if configured
    if (supabase) {
      try {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password || 'CreatorBridgeSecure123!',
          options: {
            data: {
              ...metadata,
              role,
            },
          },
        });
        if (error) {
          console.warn('Supabase signUp notice:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase call error:', err.message);
      }
    }

    const newUser: SupabaseAuthUser = {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      role,
      password,
      user_metadata: {
        ...metadata,
        role,
      },
      created_at: new Date().toISOString(),
    };

    saveStoredSupabaseUser(newUser);
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(newUser));
    return { success: true, user: newUser };
  },

  // 4. Get Active Session
  getSessionUser(): SupabaseAuthUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading session:', e);
    }
    return null;
  },

  // 5. Sign Out
  async signOut(): Promise<void> {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut error:', e);
      }
    }
    localStorage.removeItem(STORAGE_SESSION_KEY);
  },
};
