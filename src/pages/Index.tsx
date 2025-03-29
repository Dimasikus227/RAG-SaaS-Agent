
import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { ChatInterface } from '@/components/ChatInterface';
import { SubscriptionPanel } from '@/components/SubscriptionPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, CreditCard } from 'lucide-react';

const Index = () => {
  // This would come from your authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const user = {
    name: 'Іван Петренко',
    avatarUrl: '',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isLoggedIn={isLoggedIn} user={user} />
      
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
              <ChatInterface />
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
