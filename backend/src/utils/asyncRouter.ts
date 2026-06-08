import { Router as ExpressRouter, RequestHandler, IRouterMatcher } from "express";

// Express 4 does not forward rejected promises from async handlers to the
// error-handling middleware — an unhandled rejection in a controller crashes
// the whole process. This wraps every handler passed to a router method so
// thrown errors and rejected promises are routed to next(err) instead.
const wrap = (handler: RequestHandler): RequestHandler => (req, res, next) => {
  Promise.resolve()
    .then(() => handler(req, res, next))
    .catch(next);
};

const wrapArgs = (args: unknown[]): unknown[] =>
  args.map((arg) => {
    if (typeof arg === "function") return wrap(arg as RequestHandler);
    if (Array.isArray(arg)) return wrapArgs(arg);
    return arg;
  });

const METHODS = ["get", "post", "put", "patch", "delete", "use"] as const;

export const Router = (): ReturnType<typeof ExpressRouter> => {
  const router = ExpressRouter();

  for (const method of METHODS) {
    const original = (router[method] as IRouterMatcher<typeof router>).bind(router);
    (router as any)[method] = (path: unknown, ...handlers: unknown[]) =>
      original(path as never, ...(wrapArgs(handlers) as never[]));
  }

  return router;
};
