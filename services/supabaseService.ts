
import { createClient } from '@supabase/supabase-js';
import { UserProfile, Transaction, CurrencyCode } from '../types';

/* 
   ⚠️ CRITICAL: DATABASE SETUP REQUIRED 
   You MUST run this SQL in your Supabase SQL Editor to create the tables.
*/

// ============================================================================
// 🔴 KEYS (PASTE YOUR REAL SUPABASE URL + ANON KEY HERE ONLY)
// ============================================================================

const SUPABASE_URL: string = 'https://vwjtadsxfygduxmwizdn.supabase.co';
const SUPABASE_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3anRhZHN4ZnlnZHV4bXdpemRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyOTA3MDcsImV4cCI6MjA4MDg2NjcwN30.4xHU53Hg1-PXwIgIie8vn1ICEc9QRgAhKmE-_z5tuv0';

// ============================================================================

// Clean keys
const cleanUrl = SUPABASE_URL.trim();
const cleanKey = SUPABASE_KEY.trim();

// Safety Check
const isConfigured = () => {
    return cleanUrl.startsWith('https://') && cleanKey.startsWith('ey');
};

// Initialize Supabase client
export const supabase = createClient(cleanUrl, cleanKey) as any;

// Helper to log actionable errors
const handleDbError = (context: string, error: any) => {
    if (!error) return;
    if (error.message && (error.message.includes("Could not find the table") || error.code === '42P01')) {
        console.warn(`ℹ️ ${context}: Cloud Sync skipped (Table missing). Data saved locally.`);
    } else {
        console.error(`${context} Failed:`, error.message);
    }
};

// ============================================================================
// AUTH (EMAIL + PASSWORD FLOW)
// ============================================================================

export const sbLogin = async (email: string, password: string): Promise<{ user: UserProfile | null; error: string | null }> => {
    if (!isConfigured()) return { user: null, error: "Database keys invalid." };
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: password
        });

        if (error) return { user: null, error: error.message };
        
        if (data.user) {
            // 1. Try to fetch existing profile
            let profile = await sbGetProfile(data.user.id);
            
            // 2. If profile missing (e.g. first login after email verification), create it now
            if (!profile) {
                const meta = data.user.user_metadata || {};
                profile = {
                    id: data.user.id,
                    email: data.user.email || email,
                    name: meta.name || email.split('@')[0],
                    currency: meta.currency || 'USD',
                    theme: 'light',
                    privacyMode: false,
                    lastLogin: Date.now(),
                    cloudConnected: true
                };
                
                // Don't let database insertion failure stop the login process
                try {
                    await supabase.from("profiles").upsert({ 
                        id: data.user.id, 
                        email: data.user.email, 
                        data: profile 
                    });
                } catch (e) {
                    console.warn("Profile couldn't be synced to cloud during login, using local profile.");
                }
            }
            
            return { user: profile, error: null };
        }
        return { user: null, error: "Authentication returned no user data." };
    } catch (e: any) {
        console.error("Login exception:", e);
        return { user: null, error: e.message || "Connection error during login." };
    }
};

export const sbSignup = async (
    email: string, 
    password: string, 
    name: string, 
    currency: CurrencyCode
): Promise<{ success: boolean; error: string | null; msg?: string }> => {
    if (!isConfigured()) return { success: false, error: "Database keys invalid." };
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password: password,
            options: {
                data: { name, currency } // Store metadata for later profile creation
            }
        });

        if (error) return { success: false, error: error.message };

        // If session exists immediately, profile can be created now (Auto-confirm enabled)
        if (data.user && data.session) {
             const newUser: UserProfile = {
                id: data.user.id,
                email: email,
                name: name,
                currency: currency,
                theme: "light",
                privacyMode: false,
                lastLogin: Date.now(),
                cloudConnected: true,
            };
            
            try {
                await supabase.from("profiles").upsert({ 
                    id: data.user.id, 
                    email: email, 
                    data: newUser 
                });
            } catch (e) {
                console.warn("Profile table missing? Signup successful but profile cloud sync failed.");
            }
            
            return { success: true, error: null };
        }

        // If no session, email confirmation is likely required by Supabase settings
        if (data.user && !data.session) {
            return { 
                success: true, 
                error: null, 
                msg: "Success! We sent a confirmation link to your email. Please verify it before logging in." 
            };
        }

        return { success: false, error: "Signup process completed but returned no user info." };

    } catch (e: any) {
        console.error("Signup exception:", e);
        return { success: false, error: e.message || "Connection error during signup." };
    }
};

export const sbResetPassword = async (email: string): Promise<{ success: boolean; error: string | null }> => {
    if (!isConfigured()) return { success: false, error: "Database keys invalid." };
    
    // Explicitly append /#reset-password to ensure the app detects the route on return
    const redirectUrl = `${window.location.origin}/#reset-password`;

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
            redirectTo: redirectUrl, 
        });
        if (error) return { success: false, error: error.message };
        return { success: true, error: null };
    } catch (e: any) {
        return { success: false, error: e.message || "Connection error." };
    }
};

export const sbUpdateUserPassword = async (newPassword: string) => {
     if (!isConfigured()) return { error: "No connection" };
     const { error } = await supabase.auth.updateUser({ password: newPassword });
     return { error: error?.message || null };
};

export const sbLogout = async () => {
    if (!isConfigured()) return;
    await supabase.auth.signOut();
};

// ============================================================================
// PROFILES
// ============================================================================

export const sbGetProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!isConfigured()) return null;
    try {
        const { data, error } = await supabase.from("profiles").select("data").eq("id", userId).single();
        if (error) { 
            if (error.code !== 'PGRST116') handleDbError("Get Profile", error); 
            return null; 
        }
        return data.data as UserProfile;
    } catch { return null; }
};

export const sbGetOrCreateProfile = async (authUser: any): Promise<UserProfile | null> => {
    if (!isConfigured() || !authUser) return null;
    try {
        let profile = await sbGetProfile(authUser.id);
        if (!profile) {
            const meta = authUser.user_metadata || {};
            profile = {
                id: authUser.id,
                email: authUser.email || '',
                name: meta.full_name || meta.name || authUser.email?.split('@')[0] || 'User',
                currency: 'USD',
                theme: 'light',
                privacyMode: false,
                lastLogin: Date.now(),
                cloudConnected: true
            };
            // Try to sync but don't crash
            try {
                await supabase.from("profiles").upsert({ id: authUser.id, email: authUser.email, data: profile });
            } catch (e) {
                console.warn("Profile upsert failed during creation fallback.");
            }
        }
        return profile;
    } catch (e) {
        console.error("Profile Create Error", e);
        return null;
    }
};

export const sbUpdateProfile = async (userId: string, profile: UserProfile) => {
    if (!isConfigured()) return;
    try {
        await supabase.auth.updateUser({ data: { name: profile.name, currency: profile.currency } });
        const { error } = await supabase.from("profiles").upsert({ id: userId, data: profile });
        handleDbError("Update Profile", error);
    } catch (e) { console.error("Profile Sync Error", e); }
};

// ============================================================================
// TRANSACTIONS
// ============================================================================

export const sbSaveTransaction = async (userId: string, tx: Transaction) => {
    if (!isConfigured()) return;
    try {
        const { error } = await supabase.from("transactions").upsert({ id: tx.id, user_id: userId, data: tx });
        handleDbError("Save Transaction", error);
    } catch (e) { console.error("TX Save Error", e); }
};

export const sbDeleteTransaction = async (txId: string) => {
    if (!isConfigured()) return;
    try {
        const { error } = await supabase.from("transactions").delete().eq("id", txId);
        handleDbError("Delete Transaction", error);
    } catch (e) { console.error("TX Delete Error", e); }
};

export const sbLoadTransactions = async (userId: string): Promise<Transaction[]> => {
    if (!isConfigured()) return [];
    try {
        const { data, error } = await supabase.from("transactions").select("data").eq("user_id", userId);
        if (error) { handleDbError("Load Transactions", error); return []; }
        return data.map((row: any) => row.data as Transaction).sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch { return []; }
};

// ============================================================================
// TOOLS
// ============================================================================

export const sbSaveToolData = async (userId: string, toolId: string, toolData: any) => {
    if (!isConfigured()) return;
    const rowId = `${userId}_${toolId}`;
    try {
        const { error } = await supabase.from("tools").upsert({ id: rowId, user_id: userId, tool_id: toolId, data: { value: toolData } });
        handleDbError("Save Tool Data", error);
    } catch (e) { console.error("Tool Save Error", e); }
};

export const sbLoadToolData = async (userId: string, toolId: string): Promise<any | null> => {
    if (!isConfigured()) return null;
    const rowId = `${userId}_${toolId}`;
    try {
        const { data, error } = await supabase.from("tools").select("data").eq("id", rowId).single();
        if (error) { if (error.code !== 'PGRST116') handleDbError("Load Tool Data", error); return null; }
        return data.data.value;
    } catch { return null; }
};
