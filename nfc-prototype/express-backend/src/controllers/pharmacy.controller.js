import {
  getPharmacyPrescriptionQueue,
  getPharmacyQueueSummary,
} from "../services/pharmacy.service.js";

/*
|--------------------------------------------------------------------------
| GET PHARMACY PRESCRIPTION QUEUE
|--------------------------------------------------------------------------
|
| GET
| /api/v1/pharmacy/prescriptions
|
| Query:
| ?facilityId=...
| ?search=...
|
*/

export const getPrescriptionQueue = async (
  req,
  res,
  next
) => {
  try {
    const {
      facilityId,
      search,
    } = req.query;

    const prescriptions =
      await getPharmacyPrescriptionQueue({
        facilityId,
        search,
      });

    res.json({
      success: true,
      data: prescriptions,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET PHARMACY QUEUE SUMMARY
|--------------------------------------------------------------------------
|
| GET
| /api/v1/pharmacy/summary
|
*/

export const getQueueSummary = async (
  req,
  res,
  next
) => {
  try {
    const {
      facilityId,
    } = req.query;

    const summary =
      await getPharmacyQueueSummary({
        facilityId,
      });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};