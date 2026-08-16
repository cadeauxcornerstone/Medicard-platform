import express from "express";

import {
  create,
  getAll,
  getCurrent,
  deactivate,
} from "../controllers/service-price.controller.js";

const router = express.Router();

router.post(
  "/services/:serviceId/prices",
  create
);

router.get(
  "/services/:serviceId/prices",
  getAll
);

router.get(
  "/services/:serviceId/prices/current",
  getCurrent
);

router.patch(
  "/service-prices/:priceId/deactivate",
  deactivate
);

export default router;