import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, BrandDetails, CreatorVerificationData } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { localAuthService, isLocalEmailRegistered } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  company?: string;
  title?: string;
  brandDetails?: BrandDetails;
  creatorVerification?: CreatorVerificationData;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  role: UserRole;
  login: (email: string, password?: string, specificRole?: UserRole) => Promise<{ success: boolean; error?: string; notRegistered?: boolean }>;
  loginWithEmailOnly: (email: string) => Promise<{ success: boolean; error?: string; notRegistered?: boolean }>;
  logout: () => void;
  register: (payloadOrName: string | RegisterPayload, email?: string, password?: string, role?: UserRole, company?: string, extra?: any) => Promise<boolean> | boolean;
  switchRole: (newRole: UserRole) => void;
  isSupabaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check local session or localStorage. Start with null so unauthenticated user lands on Login first!
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const sessionUser = localAuthService.getSessionUser();
      if (sessionUser) {
        return {
          id: sessionUser.id,
          name: sessionUser.name || sessionUser.email.split('@')[0],
          email: sessionUser.email,
          role: sessionUser.role,
          title: sessionUser.title || (sessionUser.role === 'brand' ? 'Brand Creative Director' : 'AI Generative Filmmaker'),
          company: sessionUser.company || (sessionUser.role === 'brand' ? 'Enterprise Client' : 'Independent AI Studio'),
          avatar: sessionUser.role === 'creator' ? DEMO_USERS.creator.avatar : sessionUser.role === 'admin' ? DEMO_USERS.admin.avatar : DEMO_USERS.brand.avatar,
          badge: sessionUser.badge || (sessionUser.role === 'brand' ? 'Verified Enterprise Client' : 'Tier 1 Verified Creator'),
          brandDetails: sessionUser.brandDetails,
          creatorVerification: sessionUser.creatorVerification,
        };
      }
      const saved = localStorage.getItem('creatorbridge_user');
      if (saved) return JSON.parse(saved);
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('creatorbridge_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('creatorbridge_user');
    }
  }, [currentUser]);

  // Listen for cross-tab or custom auth changes
  useEffect(() => {
    const handleAuthChange = (e: any) => {
      if (e.detail) {
        const u = e.detail;
        setCurrentUser({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          title: u.title || (u.role === 'brand' ? 'Brand Creative Director' : 'AI Generative Filmmaker'),
          company: u.company || (u.role === 'brand' ? 'Enterprise Client' : 'Independent AI Studio'),
          avatar: u.role === 'creator' ? DEMO_USERS.creator.avatar : u.role === 'admin' ? DEMO_USERS.admin.avatar : DEMO_USERS.brand.avatar,
          badge: u.badge || (u.role === 'brand' ? 'Verified Enterprise Client' : 'Tier 1 Verified Creator'),
          brandDetails: u.brandDetails,
          creatorVerification: u.creatorVerification,
        });
      }
    };
    window.addEventListener('cb-auth-changed', handleAuthChange);
    return () => window.removeEventListener('cb-auth-changed', handleAuthChange);
  }, []);

  // Email-only authentication stored locally
  const loginWithEmailOnly = async (email: string): Promise<{ success: boolean; error?: string; notRegistered?: boolean }> => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      
      // Check if email is registered locally
      if (!isLocalEmailRegistered(cleanEmail)) {
        return {
          success: false,
          error: 'NOT_REGISTERED',
          notRegistered: true,
        };
      }

      const res = await localAuthService.signInWithEmailOnly(cleanEmail);
      if (res.success && res.user) {
        const u = res.user;
        const role = u.role;
        const activeUser: User = {
          id: u.id,
          name: u.name || u.email.split('@')[0].replace(/[._]/g, ' '),
          email: u.email,
          role,
          title: u.title || (role === 'brand' ? 'Brand Creative Director' : 'AI Generative Filmmaker'),
          company: u.company || (role === 'brand' ? 'Enterprise Client' : 'Independent AI Studio'),
          avatar: role === 'creator' ? DEMO_USERS.creator.avatar : role === 'admin' ? DEMO_USERS.admin.avatar : DEMO_USERS.brand.avatar,
          badge: u.badge || (role === 'brand' ? 'Verified Enterprise Client' : 'Tier 1 Verified Creator'),
          brandDetails: u.brandDetails,
          creatorVerification: u.creatorVerification,
        };
        setCurrentUser(activeUser);
        return { success: true };
      }
      return { 
        success: false, 
        error: res.error || 'Could not verify email',
        notRegistered: res.notRegistered 
      };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // Email + Password login
  const login = async (email: string, password?: string, specificRole?: UserRole): Promise<{ success: boolean; error?: string; notRegistered?: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if email is registered locally
    if (!isLocalEmailRegistered(cleanEmail)) {
      return {
        success: false,
        error: 'NOT_REGISTERED',
        notRegistered: true,
      };
    }

    const res = await localAuthService.signInWithPassword(cleanEmail, password);
    if (res.success && res.user) {
      const u = res.user;
      const role = u.role || specificRole || 'brand';
      const activeUser: User = {
        id: u.id,
        name: u.name || u.email.split('@')[0].replace(/[._]/g, ' '),
        email: u.email,
        role,
        title: u.title || (role === 'brand' ? 'Brand Creative Director' : 'AI Generative Filmmaker'),
        company: u.company || (role === 'brand' ? 'Enterprise Client' : 'Independent AI Studio'),
        avatar: role === 'creator' ? DEMO_USERS.creator.avatar : role === 'admin' ? DEMO_USERS.admin.avatar : DEMO_USERS.brand.avatar,
        badge: u.badge || (role === 'brand' ? 'Verified Enterprise Client' : 'Tier 1 Verified Creator'),
        brandDetails: u.brandDetails,
        creatorVerification: u.creatorVerification,
      };
      setCurrentUser(activeUser);
      return { success: true };
    }

    return {
      success: false,
      error: res.error || 'Invalid credentials',
      notRegistered: res.notRegistered,
    };
  };

  const logout = () => {
    localAuthService.signOut();
    setCurrentUser(null);
  };

  const register = (
    payloadOrName: string | RegisterPayload,
    email?: string,
    password?: string,
    roleArg?: UserRole,
    companyArg?: string
  ): boolean => {
    let name = '';
    let userEmail = '';
    let role: UserRole = 'brand';
    let company: string | undefined;
    let title: string | undefined;
    let brandDetails: BrandDetails | undefined;
    let creatorVerification: CreatorVerificationData | undefined;

    if (typeof payloadOrName === 'object') {
      name = payloadOrName.name;
      userEmail = payloadOrName.email;
      role = payloadOrName.role;
      company = payloadOrName.company;
      title = payloadOrName.title;
      brandDetails = payloadOrName.brandDetails;
      creatorVerification = payloadOrName.creatorVerification;
    } else {
      name = payloadOrName;
      userEmail = email || '';
      role = roleArg || 'brand';
      company = companyArg;
    }

    const defaultTitle = role === 'brand' 
      ? 'Brand Creative Director' 
      : role === 'creator' 
        ? 'AI Generative Filmmaker' 
        : 'Compliance Officer';

    const defaultBadge = role === 'brand'
      ? (brandDetails?.companySize ? `${brandDetails.companySize} Enterprise Brand` : 'Verified Enterprise Client')
      : role === 'creator'
        ? (creatorVerification?.verifiedTier || 'Tier 1 Verified Creator')
        : 'System Auditor';

    const cleanEmail = userEmail.trim().toLowerCase();

    // Register and store locally
    localAuthService.registerUser({
      name,
      email: cleanEmail,
      password: password || 'password123',
      role,
      company: company || (role === 'brand' ? 'Enterprise Brand Client' : 'Independent AI Studio'),
      title: title || defaultTitle,
      brandDetails,
      creatorVerification,
    });

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email: cleanEmail,
      role,
      title: title || defaultTitle,
      company: company || (role === 'brand' ? 'Enterprise Client' : 'Independent AI Studio'),
      avatar: role === 'creator' ? DEMO_USERS.creator.avatar : role === 'admin' ? DEMO_USERS.admin.avatar : DEMO_USERS.brand.avatar,
      badge: defaultBadge,
      brandDetails,
      creatorVerification,
    };

    setCurrentUser(newUser);
    return true;
  };

  const switchRole = (newRole: UserRole) => {
    if (DEMO_USERS[newRole]) {
      const demoUser = DEMO_USERS[newRole];
      setCurrentUser(demoUser);
      localAuthService.signInWithEmailOnly(demoUser.email);
    }
  };

  const role: UserRole = currentUser?.role || 'brand';

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      role,
      login,
      loginWithEmailOnly,
      logout,
      register,
      switchRole,
      isSupabaseActive: isSupabaseConfigured,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
