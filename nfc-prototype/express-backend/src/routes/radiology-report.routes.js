import express from "express";

import {
  create,
  getByStudy,
} from "../controllers/radiology-report.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Create radiology report
|--------------------------------------------------------------------------
|
| POST
| /api/v1/radiology-studies/:studyId/report
|
*/

router.post(
  "/radiology-studies/:studyId/report",
  create
);


/*
|--------------------------------------------------------------------------
| Get radiology report
|--------------------------------------------------------------------------
|
| GET
| /api/v1/radiology-studies/:studyId/report
|
*/

router.get(
  "/radiology-studies/:studyId/report",
  getByStudy
);

export default router;