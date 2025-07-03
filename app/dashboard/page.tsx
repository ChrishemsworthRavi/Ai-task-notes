"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { getCurrentUser, User } from "@/lib/auth";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import TemplatesSection from "@/components/dashboard/templates-section";
import BoardsTable from "@/components/dashboard/boards-table";
import { Board, mapDbBoardToBoard } from "@/lib/boards";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentPage, setCurrentPage] = useState("home");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUserAndBoards = async () => {
      const user = await getCurrentUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      await loadBoards(user.id);
      setLoading(false);
    };

    loadUserAndBoards();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadUserAndBoards();
      } else {
        setUser(null);
        router.push("/login");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  const loadBoards = async (userId: string) => {
    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching boards:", error);
      return;
    }

    const clientBoards = (data || []).map(mapDbBoardToBoard);
    setBoards(clientBoards);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar user={user} currentPage={currentPage} onPageChange={setCurrentPage} />
      <div className="flex-1 flex flex-col">
        <Header user={user} />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TemplatesSection
                user={user}
                onBoardCreate={() => loadBoards(user.id)}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <BoardsTable
                boards={boards}
                currentUser={user.id}
                onBoardsChange={() => loadBoards(user.id)}
              />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
