import React, { createContext, useContext, useState, useEffect } from 'react';
import { Creator, BrandClientProfile, BrandBriefOpportunity } from '../types';
import { CREATORS, BRAND_CLIENTS, BRAND_OPPORTUNITIES } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_CREATORS_KEY = 'cb_marketplace_custom_creators';
const STORAGE_BRANDS_KEY = 'cb_marketplace_custom_brands';
const STORAGE_BRIEFS_KEY = 'cb_marketplace_custom_briefs';

interface MarketplaceDataContextType {
  creators: Creator[];
  brands: BrandClientProfile[];
  brandOpportunities: BrandBriefOpportunity[];
  addCreator: (creator: Creator) => void;
  addBrand: (brand: BrandClientProfile) => void;
  addOpportunity: (opp: BrandBriefOpportunity) => void;
  getCreatorById: (id?: string) => Creator | undefined;
  getBrandById: (id?: string) => BrandClientProfile | undefined;
  refreshData: () => void;
}

const MarketplaceDataContext = createContext<MarketplaceDataContextType | undefined>(undefined);

function loadCustomCreators(): Creator[] {
  try {
    const raw = localStorage.getItem(STORAGE_CREATORS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load custom creators:', e);
  }
  return [];
}

function loadCustomBrands(): BrandClientProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_BRANDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load custom brands:', e);
  }
  return [];
}

function loadCustomBriefs(): BrandBriefOpportunity[] {
  try {
    const raw = localStorage.getItem(STORAGE_BRIEFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load custom briefs:', e);
  }
  return [];
}

export const MarketplaceDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Merge default mock data with any dynamically registered creators
  const [creators, setCreators] = useState<Creator[]>(() => {
    const custom = loadCustomCreators();
    // Prepend newly registered creators before default mock creators
    const defaultIds = new Set(CREATORS.map(c => c.id));
    const uniqueCustom = custom.filter(c => !defaultIds.has(c.id));
    return [...uniqueCustom, ...CREATORS];
  });

  const [brands, setBrands] = useState<BrandClientProfile[]>(() => {
    const custom = loadCustomBrands();
    const defaultIds = new Set(BRAND_CLIENTS.map(b => b.id));
    const uniqueCustom = custom.filter(b => !defaultIds.has(b.id));
    return [...uniqueCustom, ...BRAND_CLIENTS];
  });

  const [brandOpportunities, setBrandOpportunities] = useState<BrandBriefOpportunity[]>(() => {
    const custom = loadCustomBriefs();
    const defaultIds = new Set(BRAND_OPPORTUNITIES.map(o => o.id));
    const uniqueCustom = custom.filter(o => !defaultIds.has(o.id));
    return [...uniqueCustom, ...BRAND_OPPORTUNITIES];
  });

  // Try to sync with Supabase tables if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    async function fetchFromSupabase() {
      try {
        // Fetch custom creators table if it exists
        const { data: supaCreators, error: cErr } = await supabase!
          .from('creators')
          .select('*')
          .order('created_at', { ascending: false });

        if (!cErr && supaCreators && supaCreators.length > 0) {
          const parsed = supaCreators.map((row: any) => row.data || row);
          setCreators(prev => {
            const existingIds = new Set(parsed.map((p: any) => p.id));
            const remaining = prev.filter(c => !existingIds.has(c.id));
            return [...parsed, ...remaining];
          });
        }

        // Fetch custom brands table if it exists
        const { data: supaBrands, error: bErr } = await supabase!
          .from('brands')
          .select('*')
          .order('created_at', { ascending: false });

        if (!bErr && supaBrands && supaBrands.length > 0) {
          const parsed = supaBrands.map((row: any) => row.data || row);
          setBrands(prev => {
            const existingIds = new Set(parsed.map((p: any) => p.id));
            const remaining = prev.filter(b => !existingIds.has(b.id));
            return [...parsed, ...remaining];
          });
        }
      } catch (err) {
        console.warn('Supabase table sync notice:', err);
      }
    }

    fetchFromSupabase();
  }, []);

  const addCreator = (newCreator: Creator) => {
    setCreators(prev => {
      const filtered = prev.filter(c => c.id !== newCreator.id);
      const updated = [newCreator, ...filtered];
      
      // Save custom ones to localStorage
      const customOnes = updated.filter(c => !CREATORS.some(def => def.id === c.id));
      localStorage.setItem(STORAGE_CREATORS_KEY, JSON.stringify(customOnes));
      return updated;
    });

    // Also attempt saving to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      Promise.resolve(
        supabase
          .from('creators')
          .upsert({
            id: newCreator.id,
            name: newCreator.name,
            specialization: newCreator.specialization,
            data: newCreator,
            created_at: new Date().toISOString(),
          })
      )
        .then((res: any) => {
          if (res?.error) console.warn('Supabase creator insert notice:', res.error.message);
        })
        .catch((e: any) => console.warn('Supabase creator sync error:', e));
    }
  };

  const addBrand = (newBrand: BrandClientProfile) => {
    setBrands(prev => {
      const filtered = prev.filter(b => b.id !== newBrand.id);
      const updated = [newBrand, ...filtered];
      
      const customOnes = updated.filter(b => !BRAND_CLIENTS.some(def => def.id === b.id));
      localStorage.setItem(STORAGE_BRANDS_KEY, JSON.stringify(customOnes));
      return updated;
    });

    // Also attempt saving to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      Promise.resolve(
        supabase
          .from('brands')
          .upsert({
            id: newBrand.id,
            name: newBrand.name,
            industry: newBrand.industry,
            data: newBrand,
            created_at: new Date().toISOString(),
          })
      )
        .then((res: any) => {
          if (res?.error) console.warn('Supabase brand insert notice:', res.error.message);
        })
        .catch((e: any) => console.warn('Supabase brand sync error:', e));
    }
  };

  const addOpportunity = (newOpp: BrandBriefOpportunity) => {
    setBrandOpportunities(prev => {
      const filtered = prev.filter(o => o.id !== newOpp.id);
      const updated = [newOpp, ...filtered];
      
      const customOnes = updated.filter(o => !BRAND_OPPORTUNITIES.some(def => def.id === o.id));
      localStorage.setItem(STORAGE_BRIEFS_KEY, JSON.stringify(customOnes));
      return updated;
    });
  };

  const getCreatorById = (id?: string): Creator | undefined => {
    if (!id) return creators[0];
    return creators.find(c => c.id === id) || creators[0];
  };

  const getBrandById = (id?: string): BrandClientProfile | undefined => {
    if (!id) return brands[0];
    return brands.find(b => b.id === id) || brands[0];
  };

  const refreshData = () => {
    const customC = loadCustomCreators();
    const defaultCIds = new Set(CREATORS.map(c => c.id));
    setCreators([...customC.filter(c => !defaultCIds.has(c.id)), ...CREATORS]);

    const customB = loadCustomBrands();
    const defaultBIds = new Set(BRAND_CLIENTS.map(b => b.id));
    setBrands([...customB.filter(b => !defaultBIds.has(b.id)), ...BRAND_CLIENTS]);
  };

  return (
    <MarketplaceDataContext.Provider
      value={{
        creators,
        brands,
        brandOpportunities,
        addCreator,
        addBrand,
        addOpportunity,
        getCreatorById,
        getBrandById,
        refreshData,
      }}
    >
      {children}
    </MarketplaceDataContext.Provider>
  );
};

export const useMarketplaceData = () => {
  const context = useContext(MarketplaceDataContext);
  if (!context) {
    throw new Error('useMarketplaceData must be used within a MarketplaceDataProvider');
  }
  return context;
};
