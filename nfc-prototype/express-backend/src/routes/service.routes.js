import express from "express";

import {
  create,
  getAll,
  getById,
  update,
  deactivate,
} from "../controllers/service.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| SERVICE CATALOG
|--------------------------------------------------------------------------
*/

router.post(
  "/services",
  create
);

router.get(
  "/services",
  getAll
);

router.get(
  "/services/:serviceId",
  getById
);

router.patch(
  "/services/:serviceId",
  update
);

router.patch(
  "/services/:serviceId/deactivate",
  deactivate
);

export default router;