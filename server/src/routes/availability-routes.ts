import { z } from "zod";
import { Router } from "express";

import {
  checkAvailability,
  getAvailabilitySchedule,
} from "../controllers/availability-controller.js";
import { validateRequest } from "../middleware/validate-request.js";
import { availabilityQuerySchema } from "../schemas/availability-schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

const productIdParamsSchema = z.object({
  productId: z.string().uuid(),
});

export const availabilityRouter = Router();

availabilityRouter.get(
  "/:productId/availability",
  validateRequest("params", productIdParamsSchema),
  validateRequest("query", availabilityQuerySchema),
  asyncHandler(checkAvailability),
);

availabilityRouter.get(
  "/:productId/schedule",
  validateRequest("params", productIdParamsSchema),
  asyncHandler(getAvailabilitySchedule),
);
