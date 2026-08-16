import {
  createCard,
  getCardByUid,
  identifyCard,
  blockCard,
  unblockCard,
} from "../services/card.service.js";

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

export const identify = async (req, res, next) => {
  try {
    const { cardUid } = req.body;

    if (!cardUid) {
      return res.status(400).json({
        success: false,
        message: "cardUid is required",
      });
    }

    /*
     * TEMPORARY DEVELOPMENT CONTEXT
     *
     * Later this MUST come from req.user
     * after JWT authentication is connected.
     */
    const userId =
      req.user?.id || req.body.userId;

    const facilityId =
      req.user?.facilityId || req.body.facilityId;

    const role =
      req.user?.role || req.body.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user is required",
      });
    }

    if (!facilityId) {
      return res.status(400).json({
        success: false,
        message: "Facility is required",
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "User role is required",
      });
    }

    const result = await identifyCard({
      cardUid,
      userId,
      facilityId,
      role,
    });

    /*
     * Notify connected React frontends
     */
    const io = req.app.get("io");

    if (io) {
      io.emit("patient:identified", {
        success: true,
        message: "Patient identified successfully",
        data: result,
      });
    }

    /*
     * Keep REST response for Python NFC service
     */
    res.json({
      success: true,
      message: "Patient identified successfully",
      data: result,
    });
  } catch (error) {
    const io = req.app.get("io");

    if (io) {
      io.emit("card:identification-failed", {
        success: false,
        code:
          error.statusCode === 404
            ? "CARD_NOT_REGISTERED"
            : error.statusCode === 403
              ? "CARD_NOT_ALLOWED"
              : "IDENTIFICATION_ERROR",
        message: error.message,
      });
    }

    next(error);
  }
};

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