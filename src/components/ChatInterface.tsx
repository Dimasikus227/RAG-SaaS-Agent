
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizonal, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { saveUserQuery } from '@/services/supabase';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

// Updated interface to match the actual response format from n8n
interface N8nResponse {
  output?: string;
  message?: string;
  error?: string;
}

// n8n webhook URL
const N8N_WEBHOOK_URL = 'https://hudii.app.n8n.cloud/webhook-test/4efc0770-91b6-4e97-9847-8f40d67e31d8';

interface ChatInterfaceProps {
  userId?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendToN8n = async (userQuery: string): Promise<string> => {
    try {
      console.log('Sending to n8n:', userQuery);
      
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userQuery }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP помилка! статус: ${response.status}`);
      }
      
      // Get the response text first to check what we're dealing with
      const responseText = await response.text();
      console.log('Raw response from n8n:', responseText);
      
      let responseData: N8nResponse;
      
      try {
        // Try to parse as JSON
        responseData = JSON.parse(responseText);
      } catch (e) {
        // If it's not valid JSON, use the raw text as the message
        console.log('Response is not valid JSON, using as raw text');
        return responseText;
      }
      
      // Check all possible response formats
      if (responseData.output) {
        return responseData.output;
      } else if (responseData.message) {
        return responseData.message;
      } else if (responseData.error) {
        throw new Error(responseData.error);
      } else if (typeof responseData === 'string') {
        return responseData;
      }
      
      return 'Нема відповіді від сервера.';
    } catch (error) {
      console.error('Error calling n8n workflow:', error);
      return `Сталася помилка під час обробки вашого запиту: ${error instanceof Error ? error.message : 'Невідома помилка'}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      // Get response from n8n workflow
      const n8nResponse = await sendToN8n(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: n8nResponse,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Save the query to Supabase if a user is logged in
      if (userId) {
        await saveUserQuery(userId, userMessage.content, n8nResponse);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося отримати відповідь. Спробуйте ще раз пізніше.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Bot className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Вітаємо в AI Curator</h2>
            <p className="text-muted-foreground max-w-md">
              Запитайте мене про будь-що, і я надам відповіді на основі даних з нашої векторної бази даних. Я працюю на технології RAG!
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
            placeholder="Введіть ваше повідомлення..."
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
