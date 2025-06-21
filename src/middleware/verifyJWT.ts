import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/appError";
import { getEnv } from "../utils/validateEnv";


// JWT verification middleware
export function verifyjwt() {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
      const authHeader = req.headers.authorization || req.headers.Authorization;

      // Check if authHeader exists and is a string that starts with "Bearer "
      if (
        !authHeader ||
        typeof authHeader !== "string" ||
        !authHeader.startsWith("Bearer ")
      ) {
        throw new AppError("Unauthorized: No valid token provided", 401);
      }

      // Extract the token from the Authorization header
      const token = authHeader.split(" ")[1];

      if (!token) {
        throw new AppError("Unauthorized: Token is required", 401);
      }
      const { ACCESS_TOKEN_SECRET } = getEnv();
      if (!ACCESS_TOKEN_SECRET) {
        throw new AppError(
          "ACCESS_TOKEN_SECRET is not defined in environment variables",
          500
        );
      }

      // Verify the token
      jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) return next(new AppError("Forbidden", 403));

        // Type assertion for the decoded token
        const decodedToken = decoded as { userInfo: { id: string } };
        req.body.userid = decodedToken.userInfo.id;
        next();
      });
  };
}
