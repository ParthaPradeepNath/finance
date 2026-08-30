import type { Mock } from "vitest";

export type ChainableMock<T> = Promise<T> & {
  [K in string]: (...args: unknown[]) => ChainableMock<T>;
};

/** Drizzle/Hono chain mock: every property access returns a function that
 *  returns the same proxy, and `then`/`catch` make it awaitable.
 *  No `any` — all args are `unknown`, return is typed `ChainableMock<T>`.
 */
export function chainable<T>(data: T): ChainableMock<T> {
  const proxy = new Proxy({} as Record<string | symbol, unknown>, {
    get(_target: Record<string | symbol, unknown>, prop: string | symbol): unknown {
      if (prop === "then") {
        return (
          onFulfilled?: ((value: T) => unknown) | null,
          onRejected?: ((reason: unknown) => unknown) | null
        ): Promise<unknown> => Promise.resolve(data).then(onFulfilled, onRejected);
      }
      if (prop === "catch") {
        return (onRejected?: ((reason: unknown) => unknown) | null): Promise<unknown> =>
          Promise.resolve(data).catch(onRejected);
      }
      if (typeof prop === "symbol") return undefined;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      return (..._args: unknown[]): ChainableMock<T> => proxy as unknown as ChainableMock<T>;
    },
  });
  return proxy as unknown as ChainableMock<T>;
}

export type MockDrizzleDb = {
  select: Mock<(...args: unknown[]) => ChainableMock<unknown>>;
  insert: Mock<(...args: unknown[]) => ChainableMock<unknown>>;
  delete: Mock<(...args: unknown[]) => ChainableMock<unknown>>;
  update: Mock<(...args: unknown[]) => ChainableMock<unknown>>;
  with: Mock<(...args: unknown[]) => ChainableMock<unknown>>;
  $with: Mock<(...args: unknown[]) => { as: Mock<(...args: unknown[]) => ChainableMock<unknown>> }>;
};

export type MockAuthReturn = { userId: string } | null;

export type ApiErrorBody = { error: string };
export type ApiDataBody<D> = { data: D };
