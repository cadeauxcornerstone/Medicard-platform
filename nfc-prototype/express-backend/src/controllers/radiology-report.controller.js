import {
  createRadiologyReport,
  getRadiologyReportByStudy,
} from "../services/radiology-report.service.js";

/*
|--------------------------------------------------------------------------
| CREATE RADIOLOGY REPORT
|--------------------------------------------------------------------------
*/

export const create = async (req, res, next) => {
  try {
    const {
      radiologistId,
      findings,
      impression,
      recommendations,
    } = req.body;

    const studyId =
      req.params.studyId;

    /*
    |--------------------------------------------------------------------------
    | Development fallback
    |--------------------------------------------------------------------------
    |
    | Later this will come from authenticated req.user.
    |
    */

    const actualRadiologistId =
      req.user?.id ||
      radiologistId;

    if (!actualRadiologistId) {
      return res.status(401).json({
        success: false,
        message: "Radiologist is required",
      });
    }

    if (!findings && !impression) {
      return res.status(400).json({
        success: false,
        message:
          "At least findings or impression is required",
      });
    }

    const report =
      await createRadiologyReport({
        studyId,
        radiologistId:
          actualRadiologistId,
        findings,
        impression,
        recommendations,
      });

    res.status(201).json({
      success: true,
      message:
        "Radiology report created successfully",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET REPORT BY STUDY
|--------------------------------------------------------------------------
*/

export const getByStudy = async (
  req,
  res,
  next
) => {
  try {
    const report =
      await getRadiologyReportByStudy(
        req.params.studyId
      );

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};