// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { getTableName, type SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { plans, users } from '../../lib/db/schema';
import { translations } from '../../lib/translations';

vi.mock('@/lib/auth', () => ({ getAdminUser: async () => ({ language: 'en' }) }));
vi.mock('./actions', () => ({ assignPlanToUser: vi.fn(), removePlanFromUser: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/db', () => ({
  db: { select: (fields: Record<string, unknown>) => {
    let joined = false;
    return { from: (table: typeof users | typeof plans) => {
      if (getTableName(table) === 'plans') {
        const catalog = [
          { id: 'template', name: 'Template plan', isTemplate: true },
          { id: '2a973902-f931-478b-9da8-d1771795fd01', name: 'Riga Split', isTemplate: false },
        ];
        return Object.assign(Promise.resolve(catalog), {
          where: (condition: SQL) => {
            const query = new PgDialect().sqlToQuery(condition);
            expect(query.sql).toBe('"plans"."is_template" = $1');
            expect(query.params).toEqual([true]);
            return Promise.resolve(catalog.filter(plan => plan.isTemplate));
          },
        });
      }
      const query = {
        leftJoin: (table: typeof plans, condition: SQL) => {
          expect(table).toBe(plans);
          const sql = new PgDialect().sqlToQuery(condition);
          expect(sql.sql).toBe('"users"."current_plan_id" = "plans"."id"');
          expect(sql.params).toEqual([]);
          joined = true;
          return query;
        },
        orderBy: async () => [
          { id: 'custom-user', email: 'custom@example.test', name: 'Custom user', currentPlanId: '2a973902-f931-478b-9da8-d1771795fd01', planName: 'Riga Split' },
          { id: 'none-user', email: 'none@example.test', name: 'Unassigned user', currentPlanId: null, planName: null },
          { id: 'template-user', email: 'template@example.test', name: 'Template user', currentPlanId: 'template', planName: 'Template plan' },
        ].map(({ planName, ...user }) => ({ ...user, ...(joined && fields.planName === plans.name ? { planName } : {}) })),
      };
      return query;
    } };
  } },
}));
import AdminPage from './page';

afterEach(cleanup);

async function renderPage() {
  render(await AdminPage());
  return screen.getAllByRole('combobox') as HTMLSelectElement[];
}

it('displays an assigned custom plan and provides its selected option', async () => {
  const [custom] = await renderPage();
  expect(screen.getAllByText('Riga Split').length).toBe(2);
  expect(custom.value).toBe('2a973902-f931-478b-9da8-d1771795fd01');
  expect(custom.selectedOptions[0].textContent).toBe('Riga Split');
  expect(screen.queryByRole('button', { name: translations.en.admin.assign })).toBeNull();
});

it('keeps unassigned users on No plan without offering another user’s custom plan', async () => {
  const [, unassigned] = await renderPage();
  expect(unassigned.value).toBe('');
  expect(unassigned.selectedOptions[0].textContent).toBe(translations.en.admin.noPlan);
  expect(within(unassigned).queryByRole('option', { name: 'Riga Split' })).toBeNull();
});

it('preserves template selection without offering custom plans to unrelated users', async () => {
  const [, , template] = await renderPage();
  expect(template.value).toBe('template');
  expect(within(template).getAllByRole('option', { name: 'Template plan' })).toHaveLength(1);
  expect(within(template).queryByRole('option', { name: 'Riga Split' })).toBeNull();
  expect(screen.getByRole('link', { name: /TEMPLATE PLAN/ }).getAttribute('href')).toBe('/admin/plans/template');

});

it('includes a non-template Riga Split in admin plan management with its existing edit URL', async () => {
  await renderPage();
  expect(screen.getByRole('link', { name: /RIGA SPLIT/ }).getAttribute('href'))
    .toBe('/admin/plans/2a973902-f931-478b-9da8-d1771795fd01');
});
