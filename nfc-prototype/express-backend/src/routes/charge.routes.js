import express from "express";

import {
  create,
  getByEncounter,
  getById,
} from "../controllers/charge.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| CREATE CHARGE FOR ENCOUNTER
|--------------------------------------------------------------------------
*/

router.post(
  "/encounters/:encounterId/charges",
  create
);


/*
|--------------------------------------------------------------------------
| GET CHARGES FOR ENCOUNTER
|--------------------------------------------------------------------------
*/

router.get(
  "/encounters/:encounterId/charges",
  getByEncounter
);


/*
|--------------------------------------------------------------------------
| GET CHARGE BY ID
|--------------------------------------------------------------------------
*/

router.get(
  "/charges/:chargeId",
  getById
);

export default router;