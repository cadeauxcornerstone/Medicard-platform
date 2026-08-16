import express from "express";

import {
  create,
  getByRequest,
  getById,
} from "../controllers/radiology-study.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Create study
|--------------------------------------------------------------------------
*/

router.post(
  "/radiology-requests/:radiologyRequestId/studies",
  create
);


/*
|--------------------------------------------------------------------------
| Get studies for request
|--------------------------------------------------------------------------
*/

router.get(
  "/radiology-requests/:radiologyRequestId/studies",
  getByRequest
);


/*
|--------------------------------------------------------------------------
| Get one study
|--------------------------------------------------------------------------
*/

router.get(
  "/radiology-studies/:studyId",
  getById
);

export default router;