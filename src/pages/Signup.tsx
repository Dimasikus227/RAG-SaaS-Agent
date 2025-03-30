
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Logo } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast({
        title: "Помилка реєстрації",
        description: "Будь ласка, заповніть всі поля",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Помилка реєстрації",
        description: "Пароль повинен містити не менше 6 символів",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
          }
        }
      });
      
      if (error) throw error;
      
      if (data.user) {
        toast({
          title: "Обліковий запис створено",
          description: "Ласкаво просимо! Ваш обліковий запис було успішно створено.",
        });
        
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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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
                  minLength={6}
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
