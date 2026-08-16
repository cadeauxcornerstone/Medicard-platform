import express from "express";

import {
  create,
  getByRequest,
  verify,
} from "../controllers/lab-result.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Create laboratory result
|--------------------------------------------------------------------------
|
| POST
| /api/v1/lab-requests/:labRequestId/results
|
*/

router.post(
  "/lab-requests/:labRequestId/results",
  create
);


/*
|--------------------------------------------------------------------------
| Get results for laboratory request
|--------------------------------------------------------------------------
|
| GET
| /api/v1/lab-requests/:labRequestId/results
|
*/

router.get(
  "/lab-requests/:labRequestId/results",
  getByRequest
);


/*
|--------------------------------------------------------------------------
| Verify laboratory result
|--------------------------------------------------------------------------
|
| PATCH
| /api/v1/lab-results/:labResultId/verify
|
*/

router.patch(
  "/lab-results/:labResultId/verify",
  verify
);

export default router;