import express from "express";

import {
  getById,
  complete,
} from "../controllers/encounter.controller.js";

const router = express.Router();


/*
|--------------------------------------------------------------------------
| GET ENCOUNTER
|--------------------------------------------------------------------------
*/

router.get(
  "/encounters/:encounterId",
  getById
);


/*
|--------------------------------------------------------------------------
| COMPLETE ENCOUNTER
|--------------------------------------------------------------------------
*/

router.patch(
  "/encounters/:encounterId/complete",
  complete
);


export default router;