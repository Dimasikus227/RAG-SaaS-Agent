
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VerifyEmail = () => {
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // First check if we have hash parameters from the URL
        if (location.hash) {
          // Extract token and type from the URL hash
          const params = new URLSearchParams(location.hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const type = params.get('type');

          if (!accessToken) {
            console.error('Invalid verification parameters');
            setVerificationStatus('error');
            setErrorMessage('Неправильні параметри верифікації. Перевірте URL.');
            return;
          }

          // Set the access token in the supabase client
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            console.error('Error setting session:', error);
            setVerificationStatus('error');
            setErrorMessage(error.message);
            return;
          }

          // Check the current session to confirm verification
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            setVerificationStatus('success');
            
            // Store user data in localStorage for persistence
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('name, role, avatar_url')
              .eq('id', session.user.id)
              .single();
              
            if (!profileError && profileData) {
              const userData = {
                id: session.user.id,
                email: session.user.email,
                name: profileData.name || 'Користувач',
                role: profileData.role || 'standard',
                avatarUrl: profileData.avatar_url,
              };
              
              localStorage.setItem('user', JSON.stringify(userData));
            }

            toast({
              title: "Електронну пошту підтверджено",
              description: "Ваш обліковий запис тепер активовано.",
            });
          } else {
            setVerificationStatus('error');
            setErrorMessage('Не вдалося підтвердити вашу електронну пошту. Спробуйте ще раз.');
          }
        } else {
          // Check if we have query parameters instead
          const params = new URLSearchParams(location.search);
          const token = params.get('token');
          const type = params.get('type');
          
          if (token && type === 'recovery') {
            // This is a password reset flow
            setVerificationStatus('success');
            // You can handle password reset here if needed
          } else if (token && type === 'signup') {
            // This is an email confirmation flow using query parameters
            const { error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: 'signup',
            });

            if (error) {
              console.error('Error verifying email:', error);
              setVerificationStatus('error');
              setErrorMessage(error.message);
            } else {
              setVerificationStatus('success');
              toast({
                title: "Електронну пошту підтверджено",
                description: "Ваш обліковий запис тепер активовано.",
              });
            }
          } else {
            // No verification parameters found
            setVerificationStatus('error');
            setErrorMessage('Не знайдено параметрів верифікації в URL.');
          }
        }
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        setErrorMessage('Сталася помилка під час перевірки. Спробуйте ще раз.');
      }
    };

    verifyEmail();
  }, [location.hash, location.search, navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Підтвердження електронної пошти</CardTitle>
          <CardDescription>
            {verificationStatus === 'loading' 
              ? 'Перевірка вашої електронної пошти...' 
              : verificationStatus === 'success' 
                ? 'Вашу електронну пошту підтверджено!' 
                : 'Помилка підтвердження електронної пошти'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center justify-center py-6">
          {verificationStatus === 'loading' && (
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          )}
          
          {verificationStatus === 'success' && (
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          )}
          
          {verificationStatus === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-destructive" />
              <p className="mt-4 text-center text-destructive">{errorMessage}</p>
            </>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          {verificationStatus === 'success' && (
            <Button onClick={() => navigate('/')}>
              Перейти на головну сторінку
            </Button>
          )}
          
          {verificationStatus === 'error' && (
            <Button variant="outline" onClick={() => navigate('/login')}>
              Повернутися до входу
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default VerifyEmail;
