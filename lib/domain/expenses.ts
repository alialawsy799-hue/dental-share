import type { Actor, Database, Expense } from "./types";
import { AccessError, fail, ok, type Result } from "./errors";
import { audit, requirePermission, requireSameClinic, uid } from "./guard";

export interface ExpenseSummary {
  settledIqd: number;
  unpaidIqd: number;
  estimatedIqd: number;
  collapsedSources: number;
}

export interface LedgerRow {
  id: string;
  description: string;
  category: Expense["category"];
  bucket: Expense["bucket"];
  amountIqd: number;
  occurredOn: string;
  sourceType: Expense["sourceType"];
  sourceId?: string;
  fundFrom?: Expense["fundFrom"];
  collapsed: boolean;
}

function sourceKey(expense: Expense): string {
  return expense.sourceId ? `${expense.clinicId}:${expense.sourceType}:${expense.sourceId}` : expense.id;
}

export function groupExpenses(expenses: Expense[]): { chosen: Expense; collapsed: boolean }[] {
  const groups = new Map<string, Expense[]>();
  for (const expense of expenses) {
    const key = sourceKey(expense);
    const list = groups.get(key) ?? [];
    list.push(expense);
    groups.set(key, list);
  }
  return [...groups.values()].map((list) => {
    const paid = list.find((expense) => expense.bucket === "paid");
    return { chosen: paid ?? list[0], collapsed: list.length > 1 };
  });
}

export function summarizeExpenses(expenses: Expense[]): ExpenseSummary {
  const groups = groupExpenses(expenses);
  let settledIqd = 0;
  let unpaidIqd = 0;
  let estimatedIqd = 0;
  let collapsedSources = 0;
  for (const group of groups) {
    if (group.collapsed) collapsedSources += 1;
    if (group.chosen.bucket === "paid") settledIqd += group.chosen.amountIqd;
    else if (group.chosen.bucket === "unpaid") unpaidIqd += group.chosen.amountIqd;
    else estimatedIqd += group.chosen.amountIqd;
  }
  return { settledIqd, unpaidIqd, estimatedIqd, collapsedSources };
}

export function expenseLedger(db: Database, actor: Actor): { summary: ExpenseSummary; rows: LedgerRow[] } {
  requirePermission(actor, "expenses.read");
  const own = db.expenses.filter((expense) => expense.clinicId === actor.clinicId);
  const summary = summarizeExpenses(own);
  const rows = groupExpenses(own)
    .map(({ chosen, collapsed }) => ({
      id: chosen.id,
      description: chosen.description,
      category: chosen.category,
      bucket: chosen.bucket,
      amountIqd: chosen.amountIqd,
      occurredOn: chosen.occurredOn,
      sourceType: chosen.sourceType,
      sourceId: chosen.sourceId,
      fundFrom: chosen.fundFrom,
      collapsed,
    }))
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn));
  return { summary, rows };
}

export function getExpense(db: Database, actor: Actor, id: string): Expense {
  requirePermission(actor, "expenses.read");
  const expense = db.expenses.find((item) => item.id === id);
  if (!expense) throw new AccessError("NOT_FOUND", "السجل غير موجود.");
  requireSameClinic(actor, expense.clinicId);
  return expense;
}

export function upsertSourceExpense(
  db: Database,
  clinicId: string,
  input: Omit<Expense, "id" | "clinicId">,
): Expense {
  const matches = db.expenses.filter(
    (expense) =>
      expense.clinicId === clinicId &&
      expense.sourceId &&
      expense.sourceId === input.sourceId &&
      expense.sourceType === input.sourceType,
  );
  if (matches.length === 0) {
    const created: Expense = { ...input, id: uid("exp"), clinicId };
    db.expenses.push(created);
    return created;
  }
  const keeper = matches[0];
  keeper.bucket = input.bucket;
  keeper.amountIqd = input.amountIqd;
  keeper.description = input.description;
  keeper.category = input.category;
  keeper.occurredOn = input.occurredOn;
  if (matches.length > 1) {
    const drop = new Set(matches.slice(1));
    db.expenses = db.expenses.filter((expense) => !drop.has(expense));
  }
  return keeper;
}

export function createManualExpense(
  db: Database,
  actor: Actor,
  input: {
    description: string;
    amountIqd: number;
    bucket: Expense["bucket"];
    category: "operating" | "other";
    occurredOn: string;
    fundFrom?: Expense["fundFrom"];
  },
): Result<Expense> {
  requirePermission(actor, "expenses.write");
  if (!input.description.trim() || input.description.trim().length < 3) {
    return fail("اكتب وصفاً أوضح للمصروف.", { description: "الوصف قصير." });
  }
  if (!Number.isInteger(input.amountIqd) || input.amountIqd <= 0) {
    return fail("المبلغ يجب أن يكون رقماً صحيحاً أكبر من صفر.", { amountIqd: "مبلغ غير صالح." });
  }
  if (input.bucket === "estimated" && input.category !== "other" && input.category !== "operating") {
    return fail("التصنيف غير صالح.");
  }
  const fundFrom = input.fundFrom === "external" ? "external" : input.fundFrom === "income" ? "income" : undefined;
  const created: Expense = {
    id: uid("exp"),
    clinicId: actor.clinicId!,
    category: input.category,
    bucket: input.bucket,
    amountIqd: input.amountIqd,
    description: input.description.trim(),
    sourceType: "manual",
    fundFrom,
    occurredOn: input.occurredOn,
  };
  db.expenses.push(created);
  audit(db, actor, "expense.create", "expense", created.id);
  return ok(created);
}
