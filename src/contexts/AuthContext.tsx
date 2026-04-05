import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, type UserProfile } from "@/lib/supabase";

// ---------- context shape ----------

interface AuthContextValue {
    session: Session | null;
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: (
        email: string,
        password: string
    ) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ---------- helpers ----------

async function fetchProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error || !data) return null;

    // Attach email from auth user (not stored in user_profiles)
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return {
        ...data,
        email: user?.email ?? "",
    } as UserProfile;
}

// ---------- provider ----------

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Load profile when we detect a user
    const loadProfile = useCallback(async (currentUser: User | null) => {
        if (!currentUser) {
            setProfile(null);
            return;
        }
        const userProfile = await fetchProfile(currentUser.id);
        setProfile(userProfile);
    }, []);

    useEffect(() => {
        // 1. Recover existing session
        supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
            setSession(existingSession);
            setUser(existingSession?.user ?? null);
            loadProfile(existingSession?.user ?? null).finally(() =>
                setLoading(false)
            );
        });

        // 2. Subscribe to auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            setUser(newSession?.user ?? null);
            loadProfile(newSession?.user ?? null);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [loadProfile]);

    // ---------- actions ----------

    const signIn = useCallback(
        async (
            email: string,
            password: string
        ): Promise<{ error: string | null }> => {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // Translate common Supabase errors to Portuguese
                if (error.message === "Invalid login credentials") {
                    return { error: "E-mail ou palavra-passe incorrectos." };
                }
                return { error: error.message };
            }

            return { error: null };
        },
        []
    );

    const signOut = useCallback(async () => {
        setProfile(null);
        await supabase.auth.signOut();
    }, []);

    return (
        <AuthContext.Provider
            value={{ session, user, profile, loading, signIn, signOut }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// ---------- hook ----------

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (ctx === undefined) {
        throw new Error("useAuth deve ser utilizado dentro de um AuthProvider.");
    }
    return ctx;
}
