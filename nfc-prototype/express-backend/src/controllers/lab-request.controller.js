import {
  createLabRequest,
  getLabRequestsByEncounter,
  getLabRequestById,
  updateLabRequestStatus,
} from "../services/lab-request.service.js";

/*
|--------------------------------------------------------------------------
| CREATE LAB REQUEST
|--------------------------------------------------------------------------
*/

export const create = async (req, res, next) => {
  try {
    const {
      patientId,
      clinicalIndication,
      notes,
      tests,
    } = req.body;

    const encounterId =
      req.params.encounterId;

    // Development fallback.
    // Later this comes from authenticated req.user.
    const requestedById =
      req.user?.id ||
      req.body.requestedById;

    if (!requestedById) {
      return res.status(401).json({
        success: false,
        message:
          "Requesting provider is required",
      });
    }

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "patientId is required",
      });
    }

    if (!Array.isArray(tests) || tests.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "At least one laboratory test is required",
      });
    }

    const labRequest =
      await createLabRequest({
        encounterId,
        patientId,
        requestedById,
        clinicalIndication,
        notes,
        tests,
      });

    res.status(201).json({
      success: true,
      message:
        "Laboratory request created successfully",
      data: labRequest,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET LAB REQUESTS FOR ENCOUNTER
|--------------------------------------------------------------------------
*/

export const getByEncounter = async (
  req,
  res,
  next
) => {
  try {
    const requests =
      await getLabRequestsByEncounter(
        req.params.encounterId
      );

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET ONE LAB REQUEST
|--------------------------------------------------------------------------
*/

export const getById = async (
  req,
  res,
  next
) => {
  try {
    const request =
      await getLabRequestById(
        req.params.labRequestId
      );

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE LAB REQUEST STATUS
|--------------------------------------------------------------------------
*/

export const updateStatus = async (
  req,
  res,
  next
) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const request =
      await updateLabRequestStatus(
        req.params.labRequestId,
        status
      );

    res.json({
      success: true,
      message:
        "Laboratory request status updated successfully",
      data: request,
    });
  } catch (error) {
    next(error);
  }
};