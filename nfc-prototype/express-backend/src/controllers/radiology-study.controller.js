import {
  createRadiologyStudy,
  getStudiesByRequest,
  getRadiologyStudyById,
} from "../services/radiology-study.service.js";

/*
|--------------------------------------------------------------------------
| CREATE RADIOLOGY STUDY
|--------------------------------------------------------------------------
*/

export const create = async (req, res, next) => {
  try {
    const {
      studyType,
      imageUrl,
    } = req.body;

    const radiologyRequestId =
      req.params.radiologyRequestId;

    if (!studyType) {
      return res.status(400).json({
        success: false,
        message: "studyType is required",
      });
    }

    const study =
      await createRadiologyStudy({
        radiologyRequestId,
        studyType,
        imageUrl,
      });

    res.status(201).json({
      success: true,
      message:
        "Radiology study created successfully",
      data: study,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET STUDIES FOR REQUEST
|--------------------------------------------------------------------------
*/

export const getByRequest = async (
  req,
  res,
  next
) => {
  try {
    const studies =
      await getStudiesByRequest(
        req.params.radiologyRequestId
      );

    res.json({
      success: true,
      data: studies,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET ONE STUDY
|--------------------------------------------------------------------------
*/

export const getById = async (
  req,
  res,
  next
) => {
  try {
    const study =
      await getRadiologyStudyById(
        req.params.studyId
      );

    res.json({
      success: true,
      data: study,
    });
  } catch (error) {
    next(error);
  }
};