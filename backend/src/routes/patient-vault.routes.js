import express from "express";
import { authenticate, requirePatient } from "../middleware/auth.middleware.js";
import {
  addAllergy,
  addCondition,
  addDependent,
  deleteHealthItem,
  getDashboard,
  getOwnPlanPaymentStatus,
  initiatePlanPayment,
  updateProfile,
} from "../controllers/patient-vault.controller.js";

const router = express.Router();
router.use(authenticate, requirePatient);

router.get("/me", getDashboard);
router.post("/payment/initiate", initiatePlanPayment);
router.get("/payment/:paymentId/status", getOwnPlanPaymentStatus);
router.patch("/profiles/:profileId", updateProfile);
router.post("/dependents", addDependent);
router.post("/profiles/:profileId/allergies", addAllergy);
router.post("/profiles/:profileId/conditions", addCondition);
router.delete("/profiles/:profileId/health/:kind/:itemId", deleteHealthItem);

export default router;
