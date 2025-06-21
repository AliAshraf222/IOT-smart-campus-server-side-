import { Router } from "express";
import { AiController } from "../controllers/aiController";
import { validate } from "../middleware/validateRequest";
import { aiSchema } from "../schema/aiSchema";
import { asyncHandler } from "~/utils/asyncHandler";
import { validateContentType } from "~/middleware/validateRequest";
import { uploadMiddleware } from "../middleware/uploadMiddleware";
import { uploadMiddlewareUser } from "../middleware/uploadMiddlewareUser";
const router: Router = Router();
const aiController = new AiController();

router.post("/embedding", asyncHandler(aiController.embedding));

router.post(
  "/attendance/start",
  validate(aiSchema.attendance),
  asyncHandler(aiController.attendance)
);
router.post("/send-attendance-email", asyncHandler(aiController.sendEmail));
router.post(
  "/attendance/stop",
  validate(aiSchema.stop),
  asyncHandler(aiController.stopService)
);
router.post(
  "/licenseplate",
  uploadMiddleware,
  asyncHandler(aiController.licenseplate)
);

router.post(
  "/upload/:id",
  uploadMiddlewareUser,
  asyncHandler(aiController.upload)
);
// router.use(validateContentType(["application/json", "application/html"]));

export default router;
