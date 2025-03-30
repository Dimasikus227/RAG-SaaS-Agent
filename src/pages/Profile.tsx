
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'standard' | 'pro' | 'free_access';
  avatarUrl?: string;
}

const Profile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        
        // Get session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }
        
        // Get user profile from database
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email, role, avatar_url')
          .eq('id', session.user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Помилка",
            description: "Не вдалося завантажити профіль користувача.",
            variant: "destructive",
          });
          return;
        }
        
        if (data) {
          const profile: UserProfile = {
            id: data.id,
            name: data.name || '',
            email: data.email || session.user.email || '',
            role: data.role as 'standard' | 'pro' | 'free_access',
            avatarUrl: data.avatar_url
          };
          
          setUser(profile);
          setName(profile.name);
          setEmail(profile.email);
          setAvatarUrl(profile.avatarUrl || '');
        }
      } catch (error) {
        console.error('Error in profile page:', error);
        toast({
          title: "Помилка",
          description: "Сталася помилка під час завантаження профілю.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [navigate, toast]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Помилка",
          description: "Не вдалося оновити профіль. " + error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Update local storage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          const updatedUser = {
            ...parsedUser,
            name,
            avatarUrl
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (e) {
          console.error('Error updating local storage:', e);
        }
      }
      
      toast({
        title: "Профіль оновлено",
        description: "Ваш профіль було успішно оновлено.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Помилка",
        description: "Сталася помилка під час оновлення профілю.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar 
          isLoggedIn={true} 
          user={user ? { name: user.name, avatarUrl: user.avatarUrl || '' } : undefined} 
        />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        isLoggedIn={true} 
        user={user ? { name: user.name, avatarUrl: user.avatarUrl || '' } : undefined} 
      />
      
      <main className="flex-1 mt-16 container max-w-3xl mx-auto py-8 px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Профіль користувача</CardTitle>
            <CardDescription>
              Керуйте вашими персональними даними та налаштуваннями облікового запису
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex items-center justify-center mb-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-lg">
                    {user ? getInitials(user.name) : <User />}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Ім'я</Label>
                    <Input
                      id="name"
                      placeholder="Ваше ім'я"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Електронна пошта</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Ваша електронна пошта"
                      value={email}
                      disabled
                    />
                    <p className="text-sm text-muted-foreground">
                      Електронну пошту можна змінити в налаштуваннях облікового запису
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="avatar">URL аватару</Label>
                    <Input
                      id="avatar"
                      placeholder="URL зображення аватару"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Введіть URL-адресу зображення для вашого аватару
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Тип підписки</Label>
                  <div className="p-2 bg-muted rounded-md">
                    <p className="text-sm">
                      {user?.role === 'pro' 
                        ? 'Професійна підписка' 
                        : user?.role === 'free_access' 
                          ? 'Безкоштовний доступ' 
                          : 'Стандартна підписка'}
                    </p>
                  </div>
                </div>
              </div>
            
              <CardFooter className="px-0 pt-4">
                <Button type="submit" className="ml-auto" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Зберегти зміни
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
