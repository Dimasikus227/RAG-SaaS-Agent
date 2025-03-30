
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ChatInterface } from '@/components/ChatInterface';
import { SubscriptionPanel } from '@/components/SubscriptionPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, CreditCard } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Session } from '@supabase/supabase-js';

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

  useEffect(() => {
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
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
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Using setTimeout to prevent Supabase auth deadlocks
      setTimeout(async () => {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('name, role, avatar_url')
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
            email: '', // Email is not typically stored in the profiles table
            role: profileData.role as 'standard' | 'pro' | 'free_access',
            avatarUrl: profileData.avatar_url,
          };

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
          <Tabs defaultValue={isLoggedIn ? "chat" : "subscribe"} className="h-full">
            <div className="flex justify-center mb-4">
              <TabsList>
                <TabsTrigger value="chat" className="flex gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Чат</span>
                </TabsTrigger>
                <TabsTrigger value="subscribe" className="flex gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Підписка</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="chat" className="h-[calc(100vh-136px)]">
              <ChatInterface userId={user?.id} />
            </TabsContent>
            
            <TabsContent value="subscribe">
              <SubscriptionPanel />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
