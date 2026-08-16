import express from "express";

import {
  create,
  getByEncounter,
  getById,
  updateStatus,
} from "../controllers/prescription.controller.js";

const router = express.Router();


/*
|--------------------------------------------------------------------------
| Create prescription
|--------------------------------------------------------------------------
*/

router.post(
  "/encounters/:encounterId/prescriptions",
  create
);


/*
|--------------------------------------------------------------------------
| Get prescriptions for encounter
|--------------------------------------------------------------------------
*/

router.get(
  "/encounters/:encounterId/prescriptions",
  getByEncounter
);


/*
|--------------------------------------------------------------------------
| Get one prescription
|--------------------------------------------------------------------------
*/

router.get(
  "/prescriptions/:prescriptionId",
  getById
);


/*
|--------------------------------------------------------------------------
| Update prescription status
|--------------------------------------------------------------------------
*/

router.patch(
  "/prescriptions/:prescriptionId/status",
  updateStatus
);


export default router;