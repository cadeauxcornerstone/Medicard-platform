import {
  createDiagnosis,
  getDiagnosesByEncounter,
} from "../services/diagnosis.service.js";

/*
|--------------------------------------------------------------------------
| CREATE DIAGNOSIS
|--------------------------------------------------------------------------
*/

export const create = async (req, res, next) => {
  try {
    const {
      patientId,
      diagnosisType,
      code,
      description,
      notes,
    } = req.body;

    const encounterId = req.params.encounterId;

    // Development fallback.
    // Later this will come from authenticated req.user.
    const recordedById =
      req.user?.id || req.body.recordedById;

    if (!recordedById) {
      return res.status(401).json({
        success: false,
        message: "Diagnosis provider is required",
      });
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "patientId is required",
      });
    }

    if (!diagnosisType) {
      return res.status(400).json({
        success: false,
        message: "Diagnosis type is required",
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: "Diagnosis description is required",
      });
    }

    const diagnosis = await createDiagnosis({
      encounterId,
      patientId,
      recordedById,
      diagnosisType,
      code,
      description,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Diagnosis recorded successfully",
      data: diagnosis,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET DIAGNOSES FOR ENCOUNTER
|--------------------------------------------------------------------------
*/

export const getByEncounter = async (
  req,
  res,
  next
) => {
  try {
    const diagnoses =
      await getDiagnosesByEncounter(
        req.params.encounterId
      );

    res.json({
      success: true,
      data: diagnoses,
    });
  } catch (error) {
    next(error);
  }
};