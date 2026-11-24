import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';

import type { Plan, Session } from './planner';

const KEY = 'plans';

type Store = {
  plans: Plan[] | null; // null until loaded
  loadFailed: boolean;
  saveFailed: boolean;
  load: () => void;
  savePlan: (plan: Plan) => void;
  deletePlan: (id: string) => void;
  updateSession: (planId: string, sessionId: string, change: (session: Session) => Partial<Session>) => void;
};

const PlansContext = createContext<Store | null>(null);

export function usePlans() {
  const store = use(PlansContext);
  if (!store) throw new Error('usePlans needs a PlansProvider');
  return store;
}

export function PlansProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const load = useCallback(() => {
    AsyncStorage.getItem(KEY)
      .then((saved) => {
        setPlans(saved ? JSON.parse(saved) : []);
        setLoadFailed(false);
      })
      .catch(() => setLoadFailed(true));
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    // Never write before a successful load, so a failed read cannot erase saved plans.
    if (!plans) return;
    AsyncStorage.setItem(KEY, JSON.stringify(plans)).then(
      () => setSaveFailed(false),
      () => setSaveFailed(true),
    );
  }, [plans]);

  const update = useCallback(
    (change: (plans: Plan[]) => Plan[]) => setPlans((current) => current && change(current)),
    [],
  );

  const updateSession = useCallback<Store['updateSession']>(
    (planId, sessionId, change) =>
      update((all) =>
        all.map((p) =>
          p.id !== planId
            ? p
            : { ...p, sessions: p.sessions.map((s) => (s.id === sessionId ? { ...s, ...change(s) } : s)) },
        ),
      ),
    [update],
  );

  const store: Store = {
    plans,
    loadFailed,
    saveFailed,
    load,
    savePlan: (plan) =>
      update((all) =>
        [...all.filter((p) => p.id !== plan.id), plan].sort((a, b) => a.examDate.localeCompare(b.examDate)),
      ),
    deletePlan: (id) => update((all) => all.filter((p) => p.id !== id)),
    updateSession,
  };

  return <PlansContext value={store}>{children}</PlansContext>;
}
