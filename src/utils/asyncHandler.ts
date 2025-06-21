import { NextFunction, Request, Response, RequestHandler } from "express";

// wrap a function to use try and catch
export const asyncHandler = ( // function return middelware
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
  //accept function as a parameter
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
