import {
  createCard,
  getCardByUid,
  identifyCard,
  blockCard,
  unblockCard,
} from "../services/card.service.js";

import { env } from "../config/env.js";


/*
|--------------------------------------------------------------------------
| CREATE CARD
|--------------------------------------------------------------------------
*/

export const create = async (req, res, next) => {
  try {
    const card = await createCard(req.body);

    res.status(201).json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET CARD BY UID
|--------------------------------------------------------------------------
*/

export const getByUid = async (req, res, next) => {
  try {
    const card = await getCardByUid(
      req.params.cardUid
    );

    res.json({
      success: true,
      data: card,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| IDENTIFY CARD
|--------------------------------------------------------------------------
|
| Production:
|   req.user provides userId, facilityId and role.
|
| Prototype:
|   NFC_DEMO_* environment variables provide the temporary
|   clinical context.
|
|--------------------------------------------------------------------------
*/

export const identify = async (req, res, next) => {

  /*
  |--------------------------------------------------------------------------
  | Keep cardUid outside try
  |--------------------------------------------------------------------------
  |
  | The catch block also needs access to the original NFC UID
  | when the card is not registered.
  |
  */

  const cardUid = req.body?.cardUid;


  try {

    if (!cardUid) {
      return res.status(400).json({
        success: false,
        message: "cardUid is required",
      });
    }


    /*
    |--------------------------------------------------------------------------
    | Resolve identification context
    |--------------------------------------------------------------------------
    |
    | Real authenticated user takes priority.
    |
    | The demo context is only a temporary fallback for
    | the MedCard prototype while authentication is simulated.
    |
    */

    const userId =
      req.user?.id ||
      req.body.userId ||
      env.nfcDemoUserId;

    const facilityId =
      req.user?.facilityId ||
      req.body.facilityId ||
      env.nfcDemoFacilityId;

    const role =
      req.user?.role ||
      req.body.role ||
      env.nfcDemoRole;


    /*
    |--------------------------------------------------------------------------
    | Validate context
    |--------------------------------------------------------------------------
    */

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated user is required",
      });
    }

    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message:
          "Facility is required",
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message:
          "User role is required",
      });
    }


    /*
    |--------------------------------------------------------------------------
    | Identify patient
    |--------------------------------------------------------------------------
    */

    const result = await identifyCard({
      cardUid,
      userId,
      facilityId,
      role,
    });


    /*
    |--------------------------------------------------------------------------
    | Notify connected React frontends
    |--------------------------------------------------------------------------
    */

    const io = req.app.get("io");

    if (io) {
      io.emit(
        "patient:identified",
        {
          success: true,

          message:
            "Patient identified successfully",

          data: result,
        }
      );
    }


    /*
    |--------------------------------------------------------------------------
    | REST response
    |--------------------------------------------------------------------------
    */

    res.json({
      success: true,

      message:
        "Patient identified successfully",

      data: result,
    });

  } catch (error) {

    /*
    |--------------------------------------------------------------------------
    | Notify frontend about identification failure
    |--------------------------------------------------------------------------
    */

    const io = req.app.get("io");

    if (io) {
      io.emit(
        "card:identification-failed",
        {
          success: false,

          code:
            error.statusCode === 404
              ? "CARD_NOT_REGISTERED"
              : error.statusCode === 403
                ? "CARD_NOT_ALLOWED"
                : "IDENTIFICATION_ERROR",

          message:
            error.message,

          /*
          |--------------------------------------------------------------------------
          | Preserve the original NFC card UID
          |--------------------------------------------------------------------------
          |
          | Reception can use this UID to link the card after
          | registering the patient.
          |
          | No second physical tap is required.
          |
          */

          cardUid,
        }
      );
    }

    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| BLOCK CARD
|--------------------------------------------------------------------------
*/

export const block = async (req, res, next) => {
  try {
    const card = await blockCard(
      req.params.cardUid
    );

    res.json({
      success: true,

      message:
        "Card blocked successfully",

      data: card,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| UNBLOCK CARD
|--------------------------------------------------------------------------
*/

export const unblock = async (req, res, next) => {
  try {
    const card = await unblockCard(
      req.params.cardUid
    );

    res.json({
      success: true,

      message:
        "Card unblocked successfully",

      data: card,
    });
  } catch (error) {
    next(error);
  }
};