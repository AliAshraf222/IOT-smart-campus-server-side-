import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/appError";
import { Role} from "@prisma/client";

export const authorize = (roles:Role[] = ['admin','doctor','assistant'] ) => {
  return (req: Request,res: Response,next: NextFunction) => {
    if (!req.user) {
        throw new AppError('Not authenticated',401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(`not authorized to access this route`,403);
    }
    next();
  };
};
