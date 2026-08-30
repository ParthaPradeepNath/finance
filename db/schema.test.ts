import { describe, it, expect } from "vitest";
import {
  accounts,
  categories,
  transactions,
  insertAccountSchema,
  insertCategorySchema,
  insertTransactionSchema,
} from "@/db/schema";

describe("db/schema - table definitions", () => {
  it("accounts table has correct columns", () => {
    // drizzle table columns are defined; check basic existence via schema objects
    expect(accounts).toBeDefined();
    expect(accounts.userId).toBeDefined();
    expect(accounts.name).toBeDefined();
    expect(accounts.id).toBeDefined();
  });

  it("categories table has correct columns", () => {
    expect(categories).toBeDefined();
    expect(categories.userId).toBeDefined();
    expect(categories.name).toBeDefined();
  });

  it("transactions table has correct columns", () => {
    expect(transactions).toBeDefined();
    expect(transactions.amount).toBeDefined();
    expect(transactions.payee).toBeDefined();
    expect(transactions.date).toBeDefined();
    expect(transactions.accountId).toBeDefined();
  });
});

describe("db/schema - insert schemas", () => {
  it("insertAccountSchema validates valid account", () => {
    const result = insertAccountSchema.safeParse({
      id: "acc_123",
      name: "Checking",
      userId: "user_123",
    });
    expect(result.success).toBe(true);
  });

  it("insertAccountSchema requires name and userId", () => {
    const result = insertAccountSchema.safeParse({
      id: "acc_123",
    });
    expect(result.success).toBe(false);
  });

  it("insertCategorySchema validates valid category", () => {
    const result = insertCategorySchema.safeParse({
      id: "cat_123",
      name: "Food",
      userId: "user_123",
    });
    expect(result.success).toBe(true);
  });

  it("insertTransactionSchema validates valid transaction", () => {
    const result = insertTransactionSchema.safeParse({
      id: "txn_123",
      amount: 10500,
      payee: "Grocery Store",
      date: new Date("2024-01-15"),
      accountId: "acc_123",
      categoryId: "cat_123",
      notes: "Weekly groceries",
    });
    expect(result.success).toBe(true);
  });

  it("insertTransactionSchema coerces date strings", () => {
    const result = insertTransactionSchema.safeParse({
      id: "txn_123",
      amount: 5000,
      payee: "Test",
      date: "2024-01-15",
      accountId: "acc_123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.date).toBeInstanceOf(Date);
    }
  });

  it("insertTransactionSchema requires amount and payee", () => {
    const result = insertTransactionSchema.safeParse({
      id: "txn_123",
      accountId: "acc_123",
      date: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("insertTransactionSchema allows null notes and optional categoryId", () => {
    const result = insertTransactionSchema.safeParse({
      id: "txn_123",
      amount: 1000,
      payee: "Payee",
      date: new Date(),
      accountId: "acc_123",
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it("insertTransactionSchema rejects missing accountId", () => {
    const result = insertTransactionSchema.safeParse({
      id: "txn_123",
      amount: 1000,
      payee: "Payee",
      date: new Date(),
    });
    expect(result.success).toBe(false);
  });
});
