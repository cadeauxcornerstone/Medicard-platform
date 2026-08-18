import express from "express";

import {
  create,
  getByCharge,
  getBalance,
  refund,
  getAuditLogs,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post(
  "/charges/:chargeId/payments",
  create
);

router.get(
  "/charges/:chargeId/payments",
  getByCharge
);

router.get(
  "/charges/:chargeId/balance",
  getBalance
);

router.post(
  "/payments/:paymentId/refund",
  refund
);

router.get(
  "/payments/:paymentId/audit",
  getAuditLogs
);


export default router;