import express from "express";

import {
  getPrescriptionQueue,
  getQueueSummary,
} from "../controllers/pharmacy.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| PHARMACY PRESCRIPTION QUEUE
|--------------------------------------------------------------------------
*/

/*
| GET
| /api/v1/pharmacy/prescriptions
|
| Example:
|
| /api/v1/pharmacy/prescriptions?facilityId=...
|
| Search:
|
| /api/v1/pharmacy/prescriptions?facilityId=...&search=Wilson
|
*/

router.get(
  "/pharmacy/prescriptions",
  getPrescriptionQueue
);


/*
|--------------------------------------------------------------------------
| PHARMACY QUEUE SUMMARY
|--------------------------------------------------------------------------
*/

router.get(
  "/pharmacy/summary",
  getQueueSummary
);

export default router;