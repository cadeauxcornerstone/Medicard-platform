import {
  createRadiologyRequest,
  getRadiologyRequestsByEncounter,
  getRadiologyRequestById,
  updateRadiologyRequestStatus,
} from "../services/radiology-request.service.js";

/*
|--------------------------------------------------------------------------
| CREATE RADIOLOGY REQUEST
|--------------------------------------------------------------------------
*/

export const create = async (req, res, next) => {
  try {
    const {
      patientId,
      examinationType,
      clinicalIndication,
      notes,
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

    if (!examinationType) {
      return res.status(400).json({
        success: false,
        message:
          "examinationType is required",
      });
    }

    const request =
      await createRadiologyRequest({
        encounterId,
        patientId,
        requestedById,
        examinationType,
        clinicalIndication,
        notes,
      });

    res.status(201).json({
      success: true,
      message:
        "Radiology request created successfully",
      data: request,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET REQUESTS FOR ENCOUNTER
|--------------------------------------------------------------------------
*/

export const getByEncounter = async (
  req,
  res,
  next
) => {
  try {
    const requests =
      await getRadiologyRequestsByEncounter(
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
| GET ONE REQUEST
|--------------------------------------------------------------------------
*/

export const getById = async (
  req,
  res,
  next
) => {
  try {
    const request =
      await getRadiologyRequestById(
        req.params.radiologyRequestId
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
| UPDATE REQUEST STATUS
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
      await updateRadiologyRequestStatus(
        req.params.radiologyRequestId,
        status
      );

    res.json({
      success: true,
      message:
        "Radiology request status updated successfully",
      data: request,
    });
  } catch (error) {
    next(error);
  }
};