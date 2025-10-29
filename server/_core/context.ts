import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
// OAuth removed - using admin_users authentication only

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  return {
    req: opts.req,
    res: opts.res,
  };
}
