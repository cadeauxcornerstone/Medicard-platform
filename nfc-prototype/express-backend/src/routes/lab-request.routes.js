import express from "express";

import {
  create,
  getByEncounter,
  getById,
  getQueue,
  updateStatus,
} from "../controllers/lab-request.controller.js";

const router = express.Router();


/*
|--------------------------------------------------------------------------
| CREATE LABORATORY REQUEST
|--------------------------------------------------------------------------
*/

router.post(
  "/encounters/:encounterId/lab-requests",
  create
);


/*
|--------------------------------------------------------------------------
| GET LABORATORY REQUESTS FOR ENCOUNTER
|--------------------------------------------------------------------------
*/

router.get(
  "/encounters/:encounterId/lab-requests",
  getByEncounter
);


/*
|--------------------------------------------------------------------------
| GET LABORATORY WORK QUEUE
|--------------------------------------------------------------------------
|
| Example:
|
| GET /api/v1/lab-requests?facilityId=...
|
| Optional:
|
| GET /api/v1/lab-requests?facilityId=...&status=PROCESSING
|
*/

router.get(
  "/lab-requests",
  getQueue
);


/*
|--------------------------------------------------------------------------
| GET ONE LABORATORY REQUEST
|--------------------------------------------------------------------------
*/

router.get(
  "/lab-requests/:labRequestId",
  getById
);


/*
|--------------------------------------------------------------------------
| UPDATE LABORATORY REQUEST STATUS
|--------------------------------------------------------------------------
*/

router.patch(
  "/lab-requests/:labRequestId/status",
  updateStatus
);


export default router;