import { Request, Response, NextFunction } from "express";
import { CurdServices } from "../services/crudServices";

export class CrudController {
  private CurdServices: CurdServices = new CurdServices();

  // create a new user
  products = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await this.CurdServices.products();
      console.log(products);
      res.status(200).json({
        message: "read successfully",
        data: { ...products }
      });
    } catch (error) {
      console.error(error);
      //   next(error);
    }
  };

  allusers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.CurdServices.allusers();
      console.log(users);
      res.status(200).json({
        message: "read successfully",
        data: { ...users }
      });
    } catch (error) {
      console.error(error);
      //   next(error);
    }
  };
}
