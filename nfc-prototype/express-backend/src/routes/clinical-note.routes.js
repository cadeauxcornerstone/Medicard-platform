import express from "express";

import {
  create,
  getByEncounter,
  getById,
} from "../controllers/clinical-note.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Create clinical note
|--------------------------------------------------------------------------
*/

router.post(
  "/encounters/:encounterId/clinical-notes",
  create
);


/*
|--------------------------------------------------------------------------
| Get all clinical notes for an encounter
|--------------------------------------------------------------------------
*/

router.get(
  "/encounters/:encounterId/clinical-notes",
  getByEncounter
);


/*
|--------------------------------------------------------------------------
| Get individual clinical note
|--------------------------------------------------------------------------
*/

router.get(
  "/clinical-notes/:noteId",
  getById
);

export default router;