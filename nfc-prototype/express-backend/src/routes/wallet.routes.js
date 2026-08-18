import express from "express";

import {
  create,
  get,
  topUp,
  transactions,
} from "../controllers/wallet.controller.js";

const router = express.Router();


router.post(
  "/patients/:patientId/wallet",
  create
);


router.get(
  "/patients/:patientId/wallet",
  get
);


router.post(
  "/patients/:patientId/wallet/top-up",
  topUp
);


router.get(
  "/patients/:patientId/wallet/transactions",
  transactions
);


export default router;