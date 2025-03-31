
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ChatInterface } from '@/components/ChatInterface';
import { supabase } from "@/services/supabase";
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: 'standard' | 'pro' | 'free_access';
    avatarUrl?: string;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.id);
        setSession(currentSession);
        
        if (currentSession?.user) {
          setIsLoggedIn(true);
          
          // Get user from localStorage or fetch from database
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              if (parsedUser.id === currentSession.user.id) {
                setUser(parsedUser);
              } else {
                // User ID mismatch, fetch fresh data
                fetchUserProfile(currentSession.user.id);
              }
            } catch (e) {
              console.error('Error parsing stored user:', e);
              fetchUserProfile(currentSession.user.id);
            }
          } else {
            fetchUserProfile(currentSession.user.id);
          }
        } else {
          setIsLoggedIn(false);
          setUser(null);
          localStorage.removeItem('user');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('Existing session check:', currentSession?.user?.id);
      setSession(currentSession);
      
      if (currentSession?.user) {
        setIsLoggedIn(true);
        
        // Get user from localStorage or fetch from database
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.id === currentSession.user.id) {
              setUser(parsedUser);
            } else {
              // User ID mismatch, fetch fresh data
              fetchUserProfile(currentSession.user.id);
            }
          } catch (e) {
            console.error('Error parsing stored user:', e);
            fetchUserProfile(currentSession.user.id);
          }
        } else {
          fetchUserProfile(currentSession.user.id);
        }
      } else {
        // Redirect to login if not logged in
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      // Using setTimeout to prevent Supabase auth deadlocks
      setTimeout(async () => {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('name, role, avatar_url, email')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }

        if (profileData) {
          const userProfile = {
            id: userId,
            name: profileData.name || 'Користувач',
            email: profileData.email || '',
            role: profileData.role as 'standard' | 'pro' | 'free_access',
            avatarUrl: profileData.avatar_url,
          };

          console.log('User profile fetched:', userProfile);
          setUser(userProfile);
          localStorage.setItem('user', JSON.stringify(userProfile));
        }
      }, 0);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        isLoggedIn={isLoggedIn} 
        user={user ? {
          name: user.name,
          avatarUrl: user.avatarUrl || '',
        } : undefined} 
      />
      
      <main className="flex-1 mt-16 pb-4">
        <div className="container mx-auto max-w-7xl h-full">
          <div className="h-[calc(100vh-136px)]">
            <ChatInterface userId={user?.id} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
