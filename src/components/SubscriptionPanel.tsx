
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { getUserSubscription, createOrUpdateSubscription } from '@/services/supabase';

type BillingInterval = 'monthly' | 'yearly';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: PlanFeature[];
  highlight?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Стандарт',
    description: 'Базовий доступ до AI помічника',
    price: {
      monthly: 9,
      yearly: 90,
    },
    features: [
      { text: '100 запитів на день', included: true },
      { text: 'Стандартна якість відповідей', included: true },
      { text: 'Підтримка спільноти', included: true },
      { text: 'Розширений пошук даних', included: false },
      { text: 'Пріоритетні відповіді', included: false },
    ],
  },
  {
    name: 'Про',
    description: 'Розширені функції для професіоналів',
    price: {
      monthly: 29,
      yearly: 290,
    },
    features: [
      { text: 'Необмежені запити', included: true },
      { text: 'Покращена якість відповідей', included: true },
      { text: 'Пріоритетна підтримка', included: true },
      { text: 'Розширений пошук даних', included: true },
      { text: 'Пріоритетні відповіді', included: true },
    ],
    highlight: true,
  },
];

export const SubscriptionPanel: React.FC = () => {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [currentSubscription, setCurrentSubscription] = useState<{
    plan: 'standard' | 'pro' | null;
    endDate: Date | null;
    isLoading: boolean;
  }>({
    plan: null,
    endDate: null,
    isLoading: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadUserSubscription = async () => {
      try {
        const userId = getUserIdFromLocalStorage();
        
        if (!userId) {
          setCurrentSubscription(prev => ({ ...prev, isLoading: false }));
          return;
        }
        
        const subscription = await getUserSubscription(userId);
        
        if (subscription) {
          setCurrentSubscription({
            plan: subscription.plan,
            endDate: subscription.endDate,
            isLoading: false
          });
        } else {
          setCurrentSubscription({
            plan: null,
            endDate: null,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('Error loading subscription:', error);
        setCurrentSubscription(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    loadUserSubscription();
  }, []);
  
  const getUserIdFromLocalStorage = (): string | null => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) return null;
      
      const user = JSON.parse(userData);
      return user.id || null;
    } catch (e) {
      console.error('Error getting user ID from localStorage:', e);
      return null;
    }
  };
  
  const handleSubscribe = async (planName: string) => {
    const userId = getUserIdFromLocalStorage();
    
    if (!userId) {
      toast({
        title: "Необхідно увійти",
        description: "Будь ласка, увійдіть в свій обліковий запис, щоб підписатися",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const plan = planName.toLowerCase() === 'про' ? 'pro' : 'standard';
      const startDate = new Date();
      const endDate = new Date();
      
      // Set end date based on billing interval
      if (billingInterval === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      const result = await createOrUpdateSubscription(
        userId,
        plan as 'standard' | 'pro',
        startDate,
        endDate,
        true
      );
      
      if (result) {
        toast({
          title: "Підписка оформлена",
          description: `Ви успішно підписалися на план ${planName}`,
        });
        
        setCurrentSubscription({
          plan: plan as 'standard' | 'pro',
          endDate: endDate,
          isLoading: false
        });
      } else {
        throw new Error("Помилка при оформленні підписки");
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося оформити підписку. Спробуйте ще раз пізніше.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-2">Оберіть свій план</h2>
        <p className="text-muted-foreground">
          Виберіть план, який найкраще відповідає вашим потребам
        </p>
        
        <div className="flex items-center justify-center mt-6 space-x-4">
          <Button
            variant={billingInterval === 'monthly' ? 'default' : 'outline'}
            onClick={() => setBillingInterval('monthly')}
            className="gap-2"
          >
            Щомісячно
          </Button>
          <Button
            variant={billingInterval === 'yearly' ? 'default' : 'outline'}
            onClick={() => setBillingInterval('yearly')}
            className="gap-2"
          >
            Щорічно
            <span className="bg-primary-foreground text-primary rounded-full text-xs px-2 py-0.5">
              Економія 20%
            </span>
          </Button>
        </div>
        
        {currentSubscription.isLoading && (
          <div className="flex justify-center mt-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        
        {!currentSubscription.isLoading && currentSubscription.plan && (
          <div className="mt-4 p-3 bg-primary/10 rounded-md inline-block">
            <p className="text-sm">
              Ваша поточна підписка: <strong>{currentSubscription.plan === 'pro' ? 'Про' : 'Стандарт'}</strong>
              {currentSubscription.endDate && (
                <span> (дійсна до {currentSubscription.endDate.toLocaleDateString()})</span>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "flex flex-col",
              plan.highlight ? "border-primary shadow-lg" : ""
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                {plan.highlight && (
                  <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-1 flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Популярний
                  </span>
                )}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold">
                  ${billingInterval === 'monthly' ? plan.price.monthly : plan.price.yearly}
                </span>
                <span className="text-muted-foreground ml-1">
                  /{billingInterval === 'monthly' ? 'місяць' : 'рік'}
                </span>
              </div>
              
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className={cn(
                      "mr-2 h-5 w-5 rounded-full flex items-center justify-center mt-0.5",
                      feature.included ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {feature.included ? <Check className="h-3 w-3" /> : "×"}
                    </span>
                    <span className={feature.included ? "" : "text-muted-foreground"}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.highlight ? "default" : "outline"}
                onClick={() => handleSubscribe(plan.name)}
                disabled={isProcessing || (currentSubscription.plan === (plan.name.toLowerCase() === 'про' ? 'pro' : 'standard'))}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Обробка...
                  </>
                ) : currentSubscription.plan === (plan.name.toLowerCase() === 'про' ? 'pro' : 'standard') ? (
                  'Поточний план'
                ) : (
                  'Підписатися'
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
