import { Router } from "express";
import authRouter from "./authRoutes";
import crudRouter from "./crudRoutes";
import aiRouter from "./aiRoutes";

const router:Router = Router();

router.use("/auth", authRouter);
router.use("/crud", crudRouter);
router.use("/ai", aiRouter);

export default router;
