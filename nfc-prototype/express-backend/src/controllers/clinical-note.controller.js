import {
  createClinicalNote,
  getClinicalNotesByEncounter,
  getClinicalNoteById,
} from "../services/clinical-note.service.js";

/*
|--------------------------------------------------------------------------
| CREATE CLINICAL NOTE
|--------------------------------------------------------------------------
*/

export const create = async (req, res, next) => {
  try {
    const {
      chiefComplaint,
      subjective,
      objective,
      assessment,
      plan,
    } = req.body;

    const encounterId = req.params.encounterId;

    /*
     * Development fallback.
     *
     * Later this will come from authenticated req.user.
     */
    const authorId =
      req.user?.id || req.body.authorId;

    if (!authorId) {
      return res.status(401).json({
        success: false,
        message: "Clinical note author is required",
      });
    }

    const result = await createClinicalNote({
      encounterId,
      authorId,
      chiefComplaint,
      subjective,
      objective,
      assessment,
      plan,
    });

    res.status(201).json({
      success: true,
      message: "Clinical note saved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET CLINICAL NOTES FOR ENCOUNTER
|--------------------------------------------------------------------------
*/

export const getByEncounter = async (
  req,
  res,
  next
) => {
  try {
    const notes =
      await getClinicalNotesByEncounter(
        req.params.encounterId
      );

    res.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET ONE CLINICAL NOTE
|--------------------------------------------------------------------------
*/

export const getById = async (
  req,
  res,
  next
) => {
  try {
    const note =
      await getClinicalNoteById(
        req.params.noteId
      );

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    next(error);
  }
};