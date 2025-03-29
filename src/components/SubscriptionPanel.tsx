
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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
              >
                {plan.price.monthly === 0 ? "Почати" : "Підписатися"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};
