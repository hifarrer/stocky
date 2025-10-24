'use client';

import React from 'react';
import { Check, X, Star, Zap, Clock, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout';

const features = [
  {
    name: 'Real-time Market Data',
    free: true,
    premium: true,
  },
  {
    name: 'Price Charts & Technical Analysis',
    free: true,
    premium: true,
  },
  {
    name: 'Market Heatmaps',
    free: true,
    premium: true,
  },
  {
    name: 'News & Market Sentiment',
    free: true,
    premium: true,
  },
  {
    name: 'Top Movers & Sector Performance',
    free: true,
    premium: true,
  },
  {
    name: 'Economic Calendar',
    free: true,
    premium: true,
  },
  {
    name: 'Crypto Portfolio Tracking',
    free: false,
    premium: true,
  },
  {
    name: 'Stock Portfolio Tracking',
    free: false,
    premium: true,
  },
  {
    name: 'Data Delay',
    free: '5 minutes',
    premium: 'Real-time',
  },
  {
    name: 'Email Support',
    free: 'Community',
    premium: 'Priority',
  },
  {
    name: 'Widget Customization',
    free: true,
    premium: true,
  },
  {
    name: 'Advanced Analytics',
    free: false,
    premium: true,
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started with market data',
    features: features,
    buttonText: 'Get Started',
    buttonVariant: 'outline' as const,
    popular: false,
    icon: Star,
  },
  {
    name: 'Premium',
    price: '$29',
    period: 'per month',
    description: 'Full access to all features and real-time data',
    features: features,
    buttonText: 'Upgrade to Premium',
    buttonVariant: 'default' as const,
    popular: true,
    icon: Zap,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get the market data you need with our flexible pricing plans. 
            Start free and upgrade when you need more features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${plan.popular ? 'bg-primary/10' : 'bg-muted'}`}>
                    <plan.icon className={`h-6 w-6 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">/{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{feature.name}</span>
                    <div className="flex items-center">
                      {feature.free === true && plan.name === 'Free' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : feature.premium === true && plan.name === 'Premium' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : feature.free === false && plan.name === 'Free' ? (
                        <X className="h-4 w-4 text-red-500" />
                      ) : feature.premium === false && plan.name === 'Premium' ? (
                        <X className="h-4 w-4 text-red-500" />
                      ) : typeof feature.free === 'string' && plan.name === 'Free' ? (
                        <span className="text-sm text-muted-foreground">{feature.free}</span>
                      ) : typeof feature.premium === 'string' && plan.name === 'Premium' ? (
                        <span className="text-sm text-muted-foreground">{feature.premium}</span>
                      ) : (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.buttonVariant}
                  size="lg"
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Additional Benefits */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure & Reliable</h3>
            <p className="text-muted-foreground text-sm">
              Bank-level security with 99.9% uptime guarantee
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-time Updates</h3>
            <p className="text-muted-foreground text-sm">
              Get instant market updates and price changes
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Priority Support</h3>
            <p className="text-muted-foreground text-sm">
              Premium users get dedicated email support
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">What&apos;s the difference between Free and Premium?</h3>
              <p className="text-muted-foreground">
                Free users get access to most widgets but with 5-minute delayed data and no portfolio tracking. 
                Premium users get real-time data, portfolio tracking, and priority support.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I upgrade or downgrade my plan anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade to Premium anytime to unlock all features. 
                Downgrading will take effect at your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">What happens to my data if I downgrade?</h3>
              <p className="text-muted-foreground">
                Your portfolio data will be preserved but hidden until you upgrade again. 
                All other features remain accessible with the Free plan limitations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
