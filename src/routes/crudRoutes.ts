import { Router } from "express";
import { CrudController } from "../controllers/crudController";
import { verifyjwt } from "../middleware/verifyJWT";
const router: Router = Router();
const crudcontroller = new CrudController();

// router.post(
//   "/register",
//   validateRequest(authSchema.register),
//   authController.register
// );

router.get("/allusers", verifyjwt(), crudcontroller.allusers);

export default router;
