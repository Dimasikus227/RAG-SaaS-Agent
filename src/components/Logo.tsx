
import React from 'react';
import { Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Logo: React.FC = () => {
  return (
    <Link to="/" className="flex items-center gap-2 text-primary">
      <Brain className="h-8 w-8" />
      <span className="font-bold text-xl">AI Curator</span>
    </Link>
  );
};
