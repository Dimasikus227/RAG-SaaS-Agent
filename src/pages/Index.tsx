
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ChatInterface } from '@/components/ChatInterface';
import { SubscriptionPanel } from '@/components/SubscriptionPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, CreditCard } from 'lucide-react';

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: 'standard' | 'pro' | 'free_access';
    avatarUrl?: string;
  } | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('user');
      }
    }
  }, []);

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
          <Tabs defaultValue="chat" className="h-full">
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
