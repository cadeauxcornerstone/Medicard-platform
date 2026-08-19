import express from "express";

import {
  create,
  get,
  cancel,
  process,
} from "../controllers/payment-intent.controller.js";


const router = express.Router();


/*
|--------------------------------------------------------------------------
| CREATE PAYMENT INTENT
|--------------------------------------------------------------------------
|
| POST
| /api/v1/payment-intents
|
*/

router.post(
  "/",
  create
);


/*
|--------------------------------------------------------------------------
| GET PAYMENT INTENT
|--------------------------------------------------------------------------
|
| GET
| /api/v1/payment-intents/:paymentIntentId
|
*/

router.get(
  "/:paymentIntentId",
  get
);


/*
|--------------------------------------------------------------------------
| CANCEL PAYMENT INTENT
|--------------------------------------------------------------------------
|
| POST
| /api/v1/payment-intents/:paymentIntentId/cancel
|
*/

router.post(
  "/:paymentIntentId/cancel",
  cancel
);


/*
|--------------------------------------------------------------------------
| PROCESS PAYMENT INTENT
|--------------------------------------------------------------------------
|
| POST
| /api/v1/payment-intents/:paymentIntentId/process
|
| This endpoint represents the second NFC tap.
|
*/

router.post(
  "/:paymentIntentId/process",
  process
);


export default router;