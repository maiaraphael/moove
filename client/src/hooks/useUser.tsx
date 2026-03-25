import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FrameConfig } from '../utils/frameUtils';
import i18n from '../i18n';

const AVATAR_STORAGE_KEY = 'moove_user_avatar';

export interface RankConfig {
    id: string;
    name: string;
    color: string;
    minMmr: number;
    iconUrl: string | null;
    iconScale: number;
}

export interface MatchRecord {
    id: string;
    mode: string;
    won: boolean;
    players: string[];
    duration?: number | null;
    createdAt: string;
}

export interface UserStats {
    ranked: { played: number; won: number; winRate: number };
    casual: { played: number; won: number; winRate: number };
}

export interface UserProfile {
    id: string;
    name: string;
    level: number;
    xpProgress: number;
    avatar: string;
    credits: number;
    gems: number;
    mmr: number;
    rank: string;
    role: string;
    inventory?: { itemId: string; itemType: string; isEquipped: boolean }[];
    isPremium?: boolean;
    vipExpiresAt?: string | null;
    equippedFrame?: FrameConfig | null;
    rankConfig?: RankConfig | null;
    stats?: UserStats;
    recentMatches?: MatchRecord[];
}

interface UserContextType {
    user: UserProfile | null;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
    setUserAvatar: (avatarUrl: string) => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const hasFetched = useRef(false);

    const fetchUserData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            // Don't redirect on public pages
            const publicPaths = ['/', '/login', '/register', '/forgot-password'];
            const isPublicPath = publicPaths.some(p => window.location.pathname === p || window.location.pathname.startsWith(p + '?'));
            if (!token) {
                if (!isPublicPath) navigate('/login');
                setIsLoading(false);
                return;
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const userData = await res.json();
                // Normalise any accumulated XP that exceeds the level threshold
                // (safety net in case a server-side level-up wasn't persisted)
                let displayLevel = userData.level as number;
                let displayXp = userData.xp as number;
                while (displayXp >= displayLevel * 100) {
                    displayXp -= displayLevel * 100;
                    displayLevel++;
                }
                const xpNeed = displayLevel * 100;
                const xpProgress = Math.round((displayXp / xpNeed) * 100);

                // Use DB avatarUrl, fallback to localStorage (set when user equips avatar)
                const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
                const avatarToUse = userData.avatarUrl || savedAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`;

                setUser({
                    id: userData.id,
                    name: userData.username,
                    level: displayLevel,
                    xpProgress: isNaN(xpProgress) ? 0 : xpProgress,
                    avatar: avatarToUse,
                    credits: userData.credits || 0,
                    gems: userData.gems || 0,
                    mmr: userData.mmr || 0,
                    rank: userData.rank || 'IRON',
                    role: userData.role || 'USER',
                    inventory: userData.inventory || [],
                    isPremium: userData.isPremium || false,
                    vipExpiresAt: userData.vipExpiresAt || null,
                    equippedFrame: userData.equippedFrameConfig || null,
                    rankConfig: userData.rankConfig || null,
                    stats: userData.stats || null,
                    recentMatches: userData.recentMatches || [],
                });
                // Apply the user's saved language preference if it differs from current
                if (userData.preferredLanguage && userData.preferredLanguage !== i18n.language) {
                    localStorage.setItem('moove_lang', userData.preferredLanguage);
                    i18n.changeLanguage(userData.preferredLanguage);
                }
            } else {
                localStorage.removeItem('token');
                if (!isPublicPath) navigate('/login');
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    // Instantly update avatar in UI + persist to localStorage
    const setUserAvatar = useCallback((avatarUrl: string) => {
        localStorage.setItem(AVATAR_STORAGE_KEY, avatarUrl);
        setUser(prev => prev ? { ...prev, avatar: avatarUrl } : prev);
    }, []);

    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchUserData();
        }
    }, [fetchUserData]);

    return (
        <UserContext.Provider value={{ user, isLoading, refreshUser: fetchUserData, setUserAvatar }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error('useUser must be used inside UserProvider');
    return ctx;
}
