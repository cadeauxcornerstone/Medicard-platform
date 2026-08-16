import {
  createCard,
  getCardByUid,
  identifyCard,
  blockCard,
  unblockCard,
} from "../services/card.service.js";

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
    const card = await getCardByUid(req.params.cardUid);

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
| This endpoint is called by the Python NFC service.
|
| Successful card:
|
| Python
|   ↓
| Express
|   ↓
| PostgreSQL
|   ↓
| Patient found
|   ↓
| Socket.IO
|   ↓
| React frontend
|
| Failed/unregistered card:
|
| Python
|   ↓
| Express
|   ↓
| PostgreSQL
|   ↓
| Card not found
|   ↓
| Socket.IO
|   ↓
| React frontend
|
|--------------------------------------------------------------------------
*/

export const identify = async (req, res, next) => {
  try {
    const { cardUid } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate request
    |--------------------------------------------------------------------------
    */

    if (!cardUid) {
      return res.status(400).json({
        success: false,
        message: "cardUid is required",
      });
    }


    /*
    |--------------------------------------------------------------------------
    | Get Socket.IO instance
    |--------------------------------------------------------------------------
    */

    const io = req.app.get("io");


    /*
    |--------------------------------------------------------------------------
    | Identify card
    |--------------------------------------------------------------------------
    */

    const card = await identifyCard(cardUid);


    /*
    |--------------------------------------------------------------------------
    | Prepare safe response
    |--------------------------------------------------------------------------
    */

    const responseData = {
      card: {
        id: card.id,
        cardUid: card.cardUid,
        status: card.status,
        lastUsedAt: card.lastUsedAt,
      },

      patient: card.patient,
    };


    /*
    |--------------------------------------------------------------------------
    | Notify React frontend
    |--------------------------------------------------------------------------
    */

    if (io) {
      io.emit("patient:identified", {
        success: true,
        message: "Card identified successfully",
        data: responseData,
      });

      console.log(
        `📡 Socket.IO → patient:identified → ${card.patient.firstName} ${card.patient.lastName}`
      );
    } else {
      console.warn(
        "⚠️ Socket.IO instance not available."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Keep REST response for Python
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,
      message: "Card identified successfully",
      data: responseData,
    });

  } catch (error) {

    /*
    |--------------------------------------------------------------------------
    | Get Socket.IO instance
    |--------------------------------------------------------------------------
    */

    const io = req.app.get("io");


    /*
    |--------------------------------------------------------------------------
    | Determine frontend error type
    |--------------------------------------------------------------------------
    */

    let code = "IDENTIFICATION_ERROR";


    if (error.statusCode === 404) {
      code = "CARD_NOT_REGISTERED";
    }

    if (error.statusCode === 403) {
      code = "CARD_NOT_ALLOWED";
    }


    /*
    |--------------------------------------------------------------------------
    | Notify React frontend
    |--------------------------------------------------------------------------
    */

    if (io) {
      io.emit("card:identification-failed", {
        success: false,
        code,
        message: error.message,
      });

      console.log(
        `📡 Socket.IO → card:identification-failed → ${code}`
      );
    } else {
      console.warn(
        "⚠️ Socket.IO instance not available."
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Keep existing REST error response for Python
    |--------------------------------------------------------------------------
    */

    return next(error);
  }
};


/*
|--------------------------------------------------------------------------
| BLOCK CARD
|--------------------------------------------------------------------------
*/

export const block = async (req, res, next) => {
  try {
    const card = await blockCard(req.params.cardUid);

    res.json({
      success: true,
      message: "Card blocked successfully",
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
    const card = await unblockCard(req.params.cardUid);

    res.json({
      success: true,
      message: "Card unblocked successfully",
      data: card,
    });
  } catch (error) {
    next(error);
  }
};