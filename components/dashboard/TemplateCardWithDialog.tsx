"use client";

import { useState } from "react";
import TemplateCard from "./template-card";
import CreateBoardDialog from "./CreateBoardDialog";
import { BoardTemplate } from "@/lib/boards";

interface TemplateCardWithDialogProps {
  template: BoardTemplate;
  index: number;
  onBoardCreated: () => void;
}

export default function TemplateCardWithDialog({
  template,
  index,
  onBoardCreated,
}: TemplateCardWithDialogProps) {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(true); // Just open the dialog, no create yet!
  };

  return (
    <>
      <TemplateCard template={template} index={index} onClick={handleClick} />
      <CreateBoardDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={onBoardCreated}
        templateType={template.type}
      />
    </>
  );
}
