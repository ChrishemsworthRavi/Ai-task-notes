"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

export function withAuth(Component: React.ComponentType) {
  return function AuthWrapper(props: any) {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<Session | null>(null);
    const router = useRouter();

    useEffect(() => {
      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.replace("/login");
        } else {
          setSession(session);
        }

        setLoading(false);
      };

      checkSession();

      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (!session) {
          router.replace("/login");
        } else {
          setSession(session);
        }
      });

      return () => {
        listener.subscription.unsubscribe();
      };
    }, [router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    return <Component {...props} session={session} />;
  };
}
