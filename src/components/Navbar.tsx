
import React from 'react';
import { Button } from "@/components/ui/button";
import { UserButton } from '@/components/UserButton';
import { Logo } from '@/components/Logo';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  isLoggedIn: boolean;
  user?: {
    name: string;
    avatarUrl: string;
  };
}

export const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, user }) => {
  const navigate = useNavigate();

  return (
    <header className="border-b border-border fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Logo />
        
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <UserButton user={user} />
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')}
              >
                Log in
              </Button>
              <Button 
                onClick={() => navigate('/signup')}
              >
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
