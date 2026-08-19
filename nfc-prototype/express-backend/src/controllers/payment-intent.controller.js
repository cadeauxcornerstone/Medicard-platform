import {
  createPaymentIntent,
  getPaymentIntent,
  cancelPaymentIntent,
  processPaymentIntent,
} from "../services/payment-intent.service.js";


/*
|--------------------------------------------------------------------------
| CREATE PAYMENT INTENT
|--------------------------------------------------------------------------
|
| Doctor / Pharmacy / Cashier calls this.
|
| This does NOT charge the patient.
|
| It only creates:
|
| READY_FOR_TAP
|
|--------------------------------------------------------------------------
*/

export const create = async (
  req,
  res,
  next
) => {
  try {

    const {
      chargeId,
      patientId,
      facilityId,
    } = req.body || {};


    /*
    |--------------------------------------------------------------------------
    | Resolve facility
    |--------------------------------------------------------------------------
    |
    | Authentication can provide this later.
    |
    | For the current prototype we allow facilityId
    | to come from the request body.
    |
    |--------------------------------------------------------------------------
    */

    const resolvedFacilityId =
      req.user?.facilityId ||
      facilityId;


    if (!resolvedFacilityId) {
      return res.status(400).json({
        success: false,
        message: "facilityId is required",
      });
    }


    if (!chargeId) {
      return res.status(400).json({
        success: false,
        message: "chargeId is required",
      });
    }


    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "patientId is required",
      });
    }


    const result =
      await createPaymentIntent({

        chargeId,

        patientId,

        facilityId:
          resolvedFacilityId,

        createdById:
          req.user?.id || null,

      });


    res.status(
      result.alreadyExists
        ? 200
        : 201
    ).json({

      success: true,

      message:
        result.alreadyExists
          ? "Active payment intent already exists"
          : "Payment intent created successfully",

      data:
        result.paymentIntent,

    });

  } catch (error) {

    next(error);

  }
};


/*
|--------------------------------------------------------------------------
| GET PAYMENT INTENT
|--------------------------------------------------------------------------
*/

export const get = async (
  req,
  res,
  next
) => {
  try {

    const paymentIntent =
      await getPaymentIntent(
        req.params.paymentIntentId
      );


    res.json({

      success: true,

      data:
        paymentIntent,

    });

  } catch (error) {

    next(error);

  }
};


/*
|--------------------------------------------------------------------------
| CANCEL PAYMENT INTENT
|--------------------------------------------------------------------------
*/

export const cancel = async (
  req,
  res,
  next
) => {
  try {

    const paymentIntent =
      await cancelPaymentIntent(
        req.params.paymentIntentId
      );


    res.json({

      success: true,

      message:
        "Payment intent cancelled",

      data:
        paymentIntent,

    });

  } catch (error) {

    next(error);

  }
};


/*
|--------------------------------------------------------------------------
| PROCESS PAYMENT INTENT
|--------------------------------------------------------------------------
|
| THIS IS THE SECOND NFC TAP.
|
| The NFC reader sends:
|
| cardUid
|
| The backend then processes the pending payment intent.
|
|--------------------------------------------------------------------------
*/

export const process = async (
  req,
  res,
  next
) => {
  try {

    const {
      cardUid,
    } = req.body || {};


    if (!cardUid) {
      return res.status(400).json({

        success: false,

        message:
          "cardUid is required",

      });
    }


    const result =
      await processPaymentIntent({

        paymentIntentId:
          req.params.paymentIntentId,

        cardUid,

        actorId:
          req.user?.id || null,

      });


    res.status(200).json({

      success: true,

      message:
        result.alreadyProcessed
          ? "Payment already processed"
          : "Payment completed successfully",

      data:
        result,

    });

  } catch (error) {

    next(error);

  }
};