import { Request, Response, NextFunction } from "express";
import { Database } from "../database/db";
import { Role } from "@prisma/client";

export class CurdServices {
  private db = new Database();

  async allusers(role?: Role) {
    try {
      const users = await this.db.getAllUsers(role);
      if (!users.length) {
        throw new Error("No users found");
      }
      return { ...users };
    } catch (error) {
      return { status: 500, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  async products() {
    return { id: 1, name: "playstation" };
  }
}
