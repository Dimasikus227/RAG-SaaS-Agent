
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizonal, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };
    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm your AI assistant powered by RAG technology. I can provide answers based on the data stored in the vector database. How can I help you today?",
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Bot className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Welcome to RAGent</h2>
            <p className="text-muted-foreground max-w-md">
              Ask me anything, and I'll provide answers based on data from our vector database. I'm powered by RAG technology!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                "flex items-start gap-3 max-w-3xl mx-auto",
                message.role === 'user' ? "flex-row-reverse self-end" : ""
              )}
            >
              <div className={cn(
                "flex h-8 w-8 rounded-md items-center justify-center",
                message.role === 'assistant' ? "bg-primary/10 text-primary" : "bg-muted"
              )}>
                {message.role === 'assistant' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </div>
              <div className={cn(
                "rounded-lg px-4 py-2 text-sm",
                message.role === 'assistant' ? "bg-muted" : "bg-primary text-primary-foreground"
              )}>
                {message.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-start gap-3 max-w-3xl mx-auto">
            <div className="flex h-8 w-8 rounded-md items-center justify-center bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <div className="bg-muted rounded-lg px-4 py-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};
