import express from "express";

import {
  create,
  getByEncounter,
} from "../controllers/diagnosis.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Create diagnosis
|--------------------------------------------------------------------------
*/

router.post(
  "/encounters/:encounterId/diagnoses",
  create
);


/*
|--------------------------------------------------------------------------
| Get diagnoses for encounter
|--------------------------------------------------------------------------
*/

router.get(
  "/encounters/:encounterId/diagnoses",
  getByEncounter
);

export default router;