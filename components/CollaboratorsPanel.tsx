'use client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Collaborator {
  id: string;
  name: string;
  color: string;
}

interface CollaboratorsPanelProps {
  collaborators: Collaborator[];
}

export default function CollaboratorsPanel({ collaborators }: CollaboratorsPanelProps) {
  return (
    <div className="flex items-center -space-x-1">
      {collaborators.map(c => (
        <Avatar key={c.id} className="w-6 h-6 border border-white">
          <AvatarFallback style={{ backgroundColor: c.color }}>
            {c.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}
