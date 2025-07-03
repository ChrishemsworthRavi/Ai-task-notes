"use client";

import { useState } from "react";
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
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
  .from("boards")
  .insert([{ name, type: templateType }])
  .select("id")
  .single();

if (data?.id) {
  router.push(`/board/${data.id}`);
}

    setLoading(false);

    if (error) {
      console.error("Failed to create board:", error);
      alert("Error creating board.");
      return;
    }

    setName("");
    onOpenChange(false);
    onCreated();

    if (data?.id) {
      router.push(`/board/${data.id}`);
    }
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
