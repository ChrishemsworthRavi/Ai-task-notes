"use client";

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TemplateCard from './template-card';
import { boardTemplates, BoardTemplate, boardStorage } from '@/lib/boards';
import { User } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import TemplateCardWithDialog from './TemplateCardWithDialog';

interface TemplatesSectionProps {
  user: User;
  onBoardCreate: () => void;
}

export default function TemplatesSection({ user, onBoardCreate }: TemplatesSectionProps) {
  const router = useRouter();

  const handleTemplateClick = (template: BoardTemplate) => {
    const boardName = template.name === 'Blank board' ? 'Untitled' : template.name;
    const newBoard = boardStorage.createBoard(boardName, template.type, user.name, user.id);
    onBoardCreate();
    router.push(`/board/${newBoard.id}`);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
  {boardTemplates.map((template, index) => (
    <TemplateCardWithDialog
      key={template.type}
      template={template}
      index={index}
      onBoardCreated={onBoardCreate}
    />
  ))}
</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6 }}
        className="flex justify-center"
      >
        <Button 
          variant="ghost" 
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          From Miroverse
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}