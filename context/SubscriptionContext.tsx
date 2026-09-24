import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MOCK_SUBSCRIPTIONS, Subscription } from '@/constants/subscriptions';

interface SubscriptionContextType {
  subscriptions: Subscription[];
  addSubscription: (sub: Omit<Subscription, 'id'>) => void;
  removeSubscription: (id: string) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(MOCK_SUBSCRIPTIONS);

  const addSubscription = (sub: Omit<Subscription, 'id'>) => {
    const newSub: Subscription = {
      ...sub,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    setSubscriptions(prev => [...prev, newSub]);
  };

  const removeSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <SubscriptionContext.Provider value={{ subscriptions, addSubscription, removeSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptions() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscriptions must be used inside SubscriptionProvider');
  return ctx;
}
