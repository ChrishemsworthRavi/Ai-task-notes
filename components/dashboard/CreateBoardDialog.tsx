"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCurrentUser, User } from "@/lib/auth";

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  templateType: string;
}

export default function CreateBoardDialog({
  open,
  onOpenChange,
  onCreated,
  templateType,
}: CreateBoardDialogProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    if (!user) {
      alert("You must be logged in to create a board");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("boards")
      .insert([
        {
          name,
          type: templateType,
          owner_id: user.id,
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Error creating board:", error);
      alert("Failed to create board");
      setLoading(false);
      return;
    }

    if (data?.id) {
      onCreated();
      router.push(`/board/${data.id}`);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New {templateType} Board</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Enter board name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
