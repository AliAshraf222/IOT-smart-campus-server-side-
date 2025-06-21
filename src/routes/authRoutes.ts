import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { validate } from "../middleware/validateRequest";
import { authSchema } from "../schema/authSchema";
import { asyncHandler } from "~/utils/asyncHandler";
import { authRateLimit } from "~/middleware/ratelimit";
import { validateContentType } from "~/middleware/validateRequest";
import { sanitizeEmail } from "~/middleware/validateRequest";
import { authorize } from "~/middleware/roleMiddleware";// role based acsses control 
const router:Router = Router();
const authController = new AuthController();

router.post(
  "/register",
  authRateLimit,
  validate(authSchema.register),
  sanitizeEmail,
  asyncHandler(authController.register)
);
router.post("/login",validate(authSchema.login), asyncHandler(authController.login));


router.post("/ali",validate(authSchema.ali), authController.ali);

router.get("/verify-email",validate(authSchema.verification,"query"), asyncHandler(authController.verifyEmail));
router.use(validateContentType(["application/json", "application/html"]));
router.get("/refresh", authController.refresh);

export default router;
