import express from "express";

import {
  create,
  getByEncounter,
  getById,
  updateStatus,
} from "../controllers/radiology-request.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Create radiology request
|--------------------------------------------------------------------------
*/

router.post(
  "/encounters/:encounterId/radiology-requests",
  create
);


/*
|--------------------------------------------------------------------------
| Get radiology requests for encounter
|--------------------------------------------------------------------------
*/

router.get(
  "/encounters/:encounterId/radiology-requests",
  getByEncounter
);


/*
|--------------------------------------------------------------------------
| Get one radiology request
|--------------------------------------------------------------------------
*/

router.get(
  "/radiology-requests/:radiologyRequestId",
  getById
);


/*
|--------------------------------------------------------------------------
| Update radiology request status
|--------------------------------------------------------------------------
*/

router.patch(
  "/radiology-requests/:radiologyRequestId/status",
  updateStatus
);

export default router;