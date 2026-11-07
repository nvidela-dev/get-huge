// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { getTableName, type SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';

vi.mock('@/lib/auth', () => ({
  getOrCreateUser: async () => ({ language: 'en', email: 'admin@example.test', currentPlanId: null }),
  isAdmin: () => true,
}));
vi.mock('./actions', () => ({ selectPlan: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn(), useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/db', () => ({
  db: { select: () => ({
    from: (table: Parameters<typeof getTableName>[0]) => {
      const name = getTableName(table);
      const query = {
        innerJoin: () => query,
        where: (condition: SQL) => {
          if (name === 'plans') {
            const sql = new PgDialect().sqlToQuery(condition);
            expect(sql.sql).toBe('"plans"."is_template" = $1');
            expect(sql.params).toEqual([true]);
            return Promise.resolve([
              { id: 'template', name: 'Template plan', description: null, daysPerWeek: 3, isTemplate: true },
              { id: '2a973902-f931-478b-9da8-d1771795fd01', name: 'Riga Split', description: null, daysPerWeek: 3, isTemplate: false },
            ].filter(plan => plan.isTemplate));
          }
          if (name === 'plan_days') return { orderBy: async () => [] };
          return Promise.resolve([{ count: 0 }]);
        },
      };
      return query;
    },
  }) },
}));
import PlansPage from './page';

afterEach(cleanup);

it('keeps the public plans catalog template-only', async () => {
  render(await PlansPage());
  expect(screen.getByRole('link', { name: /TEMPLATE PLAN/ }).getAttribute('href')).toBe('/plans/template');
  expect(screen.queryByRole('link', { name: /RIGA SPLIT/ })).toBeNull();
});
