import {
  getEncounterById,
  completeEncounter,
} from "../services/encounter.service.js";

/*
|--------------------------------------------------------------------------
| GET ENCOUNTER
|--------------------------------------------------------------------------
*/

export const getById = async (
  req,
  res,
  next
) => {
  try {
    const encounter =
      await getEncounterById(
        req.params.encounterId
      );

    res.json({
      success: true,
      data: encounter,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| COMPLETE ENCOUNTER
|--------------------------------------------------------------------------
*/

export const complete = async (
  req,
  res,
  next
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Development fallback
    |--------------------------------------------------------------------------
    |
    | Later this will come from authenticated req.user.
    |
    */

    const completedById =
      req.user?.id ||
      req.body.completedById;

    if (!completedById) {
      return res.status(401).json({
        success: false,
        message:
          "Encounter completion provider is required",
      });
    }

    const encounter =
      await completeEncounter({
        encounterId:
          req.params.encounterId,

        completedById,
      });

    res.json({
      success: true,
      message:
        "Encounter completed successfully",
      data: encounter,
    });
  } catch (error) {
    next(error);
  }
};