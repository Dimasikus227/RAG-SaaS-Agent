import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizonal, Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface N8nResponse {
  output?: string;
  message?: string;
  error?: string;
}

const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/4efc0770-91b6-4e97-9847-8f40d67e31d8';

interface ChatInterfaceProps {
  userId?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ userId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (userId) {
      const loadChatHistory = async () => {
        try {
          setIsLoadingHistory(true);
          console.log('Loading chat history for user:', userId);
          const { data, error } = await supabase
            .from('queries')
            .select('query, response, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
            
          if (error) {
            console.error('Error loading queries:', error);
            toast({
              title: "Помилка завантаження історії",
              description: "Не вдалося завантажити історію чату. " + error.message,
              variant: "destructive",
            });
            return;
          }
          
          if (data && data.length > 0) {
            console.log('Chat history loaded:', data.length, 'messages');
            const loadedMessages: Message[] = [];
            
            data.forEach(query => {
              const timestamp = new Date(query.created_at);
              
              loadedMessages.push({
                id: `user-${timestamp.getTime()}`,
                content: query.query,
                role: 'user',
                timestamp: timestamp
              });
              
              loadedMessages.push({
                id: `assistant-${timestamp.getTime() + 1}`,
                content: query.response,
                role: 'assistant',
                timestamp: new Date(timestamp.getTime() + 1)
              });
            });
            
            setMessages(loadedMessages);
          } else {
            console.log('No chat history found');
            setMessages([]);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
          toast({
            title: "Помилка",
            description: "Сталася помилка під час завантаження історії чату.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingHistory(false);
        }
      };
      
      loadChatHistory();
    } else {
      setIsLoadingHistory(false);
      setMessages([]);
    }
  }, [userId, toast]);

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
      
      const responseText = await response.text();
      console.log('Raw response from n8n:', responseText);
      
      try {
        const responseData: N8nResponse = JSON.parse(responseText);
        
        if (responseData.output) {
          return responseData.output;
        } else if (responseData.message) {
          return responseData.message;
        } else if (responseData.error) {
          throw new Error(responseData.error);
        } else if (typeof responseData === 'string') {
          return responseData;
        }
      } catch (e) {
        console.log('Response is not valid JSON, using as raw text');
        return responseText;
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

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const n8nResponse = await sendToN8n(userMessage.content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: n8nResponse,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (userId) {
        console.log('Saving chat to database for user:', userId);
        const { error } = await supabase
          .from('queries')
          .insert([
            { 
              user_id: userId, 
              query: userMessage.content, 
              response: n8nResponse,
              created_at: new Date().toISOString()
            }
          ]);
          
        if (error) {
          console.error('Error saving query:', error);
          toast({
            title: "Помилка",
            description: "Не вдалося зберегти запит. " + error.message,
            variant: "destructive",
          });
        }
      } else {
        console.log('User not logged in, skipping save to database');
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
        {isLoadingHistory ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Завантаження історії чату...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Bot className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">AI куратор від Qndriy Education</h2>
            <p className="text-muted-foreground max-w-md">
              Запитай в мене про будь-що про YouTube!
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
