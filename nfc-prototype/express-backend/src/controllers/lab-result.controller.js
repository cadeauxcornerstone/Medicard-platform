import {
  createLabResult,
  getLabResultsByRequest,
  verifyLabResult,
} from "../services/lab-result.service.js";

/*
|--------------------------------------------------------------------------
| CREATE LAB RESULT
|--------------------------------------------------------------------------
*/

export const create = async (req, res, next) => {
  try {
    const {
      testName,
      resultValue,
      unit,
      referenceRange,
      interpretation,
    } = req.body;

    const labRequestId =
      req.params.labRequestId;

    // Development fallback.
    // Later this comes from authenticated req.user.
    const performedById =
      req.user?.id ||
      req.body.performedById;

    if (!performedById) {
      return res.status(401).json({
        success: false,
        message: "Laboratory provider is required",
      });
    }

    if (!testName) {
      return res.status(400).json({
        success: false,
        message: "testName is required",
      });
    }

    const result = await createLabResult({
      labRequestId,
      performedById,
      testName,
      resultValue,
      unit,
      referenceRange,
      interpretation,
    });

    res.status(201).json({
      success: true,
      message: "Laboratory result recorded successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET RESULTS FOR LAB REQUEST
|--------------------------------------------------------------------------
*/

export const getByRequest = async (
  req,
  res,
  next
) => {
  try {
    const results =
      await getLabResultsByRequest(
        req.params.labRequestId
      );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| VERIFY LAB RESULT
|--------------------------------------------------------------------------
*/

export const verify = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await verifyLabResult(
        req.params.labResultId
      );

    res.json({
      success: true,
      message: "Laboratory result verified successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};