import express from "express";

import {
  create,
  getByEncounter,
  getById,
  updateStatus,
} from "../controllers/lab-request.controller.js";

const router = express.Router();


/*
|--------------------------------------------------------------------------
| Create laboratory request
|--------------------------------------------------------------------------
*/

router.post(
  "/encounters/:encounterId/lab-requests",
  create
);


/*
|--------------------------------------------------------------------------
| Get laboratory requests for encounter
|--------------------------------------------------------------------------
*/

router.get(
  "/encounters/:encounterId/lab-requests",
  getByEncounter
);


/*
|--------------------------------------------------------------------------
| Get one laboratory request
|--------------------------------------------------------------------------
*/

router.get(
  "/lab-requests/:labRequestId",
  getById
);


/*
|--------------------------------------------------------------------------
| Update laboratory request status
|--------------------------------------------------------------------------
*/

router.patch(
  "/lab-requests/:labRequestId/status",
  updateStatus
);


export default router;