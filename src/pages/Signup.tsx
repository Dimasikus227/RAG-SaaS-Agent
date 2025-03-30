
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Logo } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        toast({
          title: "Обліковий запис створено",
          description: "Ласкаво просимо до AI Curator! Ваш обліковий запис було успішно створено.",
        });
        
        // Navigate to login instead of auto-login to comply with email verification if enabled
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Помилка реєстрації",
        description: error.message || "Не вдалося створити обліковий запис. Можливо, цей email вже використовується.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/40">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Створити обліковий запис</CardTitle>
            <CardDescription>Введіть ваші дані для створення облікового запису</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Повне ім'я</Label>
                <Input
                  id="name"
                  placeholder="Іван Петренко"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Створення облікового запису..." : "Зареєструватися"}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Натискаючи "Зареєструватися", ви погоджуєтеся з нашими{" "}
                <Link to="/terms" className="text-primary hover:underline">Умовами користування</Link>
                {" "}та{" "}
                <Link to="/privacy" className="text-primary hover:underline">Політикою конфіденційності</Link>.
              </p>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Вже маєте обліковий запис?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Увійти
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
