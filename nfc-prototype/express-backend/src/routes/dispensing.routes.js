import express from "express";

import {
  dispense,
  getByPrescription,
} from "../controllers/dispensing.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| DISPENSE PRESCRIPTION
|--------------------------------------------------------------------------
*/

router.post(
  "/prescriptions/:prescriptionId/dispense",
  dispense
);


/*
|--------------------------------------------------------------------------
| GET DISPENSING HISTORY
|--------------------------------------------------------------------------
*/

router.get(
  "/prescriptions/:prescriptionId/dispensing",
  getByPrescription
);

export default router;