import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

export interface BrandingData {
  id?: string;
  officeId?: string;
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  defaultTheme: 'light' | 'dark';
  replyToEmail?: string;
  replyToName?: string;
  isCustom: boolean;
  officeName?: string;
  officeSlug?: string;
}

const DEFAULT_BRANDING: BrandingData = {
  companyName: 'STS TaxRepair',
  logoUrl: null,
  primaryColor: '#1a4d2e',
  secondaryColor: '#4CAF50',
  accentColor: '#22c55e',
  defaultTheme: 'light',
  replyToEmail: 'Info.ststax@gmail.com',
  replyToName: 'STS TaxRepair Support',
  isCustom: false
};

function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyBrandingStyles(branding: BrandingData) {
  const root = document.documentElement;
  
  if (branding.primaryColor) {
    const primaryHSL = hexToHSL(branding.primaryColor);
    root.style.setProperty('--brand-primary', primaryHSL);
  }
  
  if (branding.secondaryColor) {
    const secondaryHSL = hexToHSL(branding.secondaryColor);
    root.style.setProperty('--brand-secondary', secondaryHSL);
  }
  
  if (branding.accentColor) {
    const accentHSL = hexToHSL(branding.accentColor);
    root.style.setProperty('--brand-accent', accentHSL);
  }
}

function setDynamicFavicon(logoUrl: string | null, companyName: string) {
  if (logoUrl) {
    let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = logoUrl;
    link.type = logoUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  }
  
  document.title = companyName ? `${companyName} - Tax Portal` : 'STS TaxRepair - Tax Portal';
}

function getOfficeSlugFromUrl(): string | undefined {
  const params = new URLSearchParams(window.location.search);
  return params.get('_office') || undefined;
}

export function useBranding(officeId?: string) {
  const slug = getOfficeSlugFromUrl();
  
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (officeId) params.set('officeId', officeId);
    else if (slug) params.set('slug', slug);
    return params.toString();
  }, [officeId, slug]);
  
  const { data: branding, isLoading, error } = useQuery<BrandingData>({
    queryKey: ['/api/branding', queryParams],
    queryFn: async () => {
      const url = `/api/branding${queryParams ? `?${queryParams}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch branding');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
  
  useEffect(() => {
    if (branding) {
      applyBrandingStyles(branding);
      setDynamicFavicon(branding.logoUrl, branding.companyName);
    }
  }, [branding]);
  
  return {
    branding: branding || DEFAULT_BRANDING,
    isLoading,
    error,
    isCustomBranding: branding?.isCustom || false
  };
}

export function useSaveBranding() {
  return {
    saveBranding: async (officeId: string, data: Partial<BrandingData>) => {
      const res = await fetch(`/api/offices/${officeId}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save branding');
      }
      
      return res.json();
    },
    resetBranding: async (officeId: string) => {
      const res = await fetch(`/api/offices/${officeId}/branding`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to reset branding');
      }
      
      return res.json();
    }
  };
}

export function useUserTheme() {
  return {
    saveTheme: async (userId: string, theme: 'system' | 'light' | 'dark') => {
      const res = await fetch(`/api/users/${userId}/theme`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ theme })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save theme preference');
      }
      
      return res.json();
    }
  };
}
