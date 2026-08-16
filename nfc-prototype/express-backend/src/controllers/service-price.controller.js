import {
  createServicePrice,
  getServicePrices,
  getCurrentServicePrice,
  deactivateServicePrice,
} from "../services/service-price.service.js";

/*
|--------------------------------------------------------------------------
| CREATE PRICE
|--------------------------------------------------------------------------
*/

export const create = async (req, res, next) => {
  try {
    const {
      amount,
      currency,
      effectiveFrom,
      effectiveTo,
    } = req.body;

    const serviceId = req.params.serviceId;

    const price = await createServicePrice({
      serviceId,
      amount,
      currency,
      effectiveFrom,
      effectiveTo,
    });

    res.status(201).json({
      success: true,
      message: "Service price created successfully",
      data: price,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET PRICE HISTORY
|--------------------------------------------------------------------------
*/

export const getAll = async (req, res, next) => {
  try {
    const prices = await getServicePrices(
      req.params.serviceId
    );

    res.json({
      success: true,
      data: prices,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET CURRENT PRICE
|--------------------------------------------------------------------------
*/

export const getCurrent = async (req, res, next) => {
  try {
    const price = await getCurrentServicePrice(
      req.params.serviceId
    );

    res.json({
      success: true,
      data: price,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| DEACTIVATE PRICE
|--------------------------------------------------------------------------
*/

export const deactivate = async (req, res, next) => {
  try {
    const price = await deactivateServicePrice(
      req.params.priceId
    );

    res.json({
      success: true,
      message:
        "Service price deactivated successfully",
      data: price,
    });
  } catch (error) {
    next(error);
  }
};