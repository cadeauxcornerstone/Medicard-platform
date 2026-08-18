import {
  createPayment,
  getPaymentsByCharge,
  getChargeBalance,
  refundPayment,
  getPaymentAuditLogs,
} from "../services/payment.service.js";


/*
|--------------------------------------------------------------------------
| CREATE PAYMENT
|--------------------------------------------------------------------------
*/

export const create = async (
  req,
  res,
  next
) => {
  try {
    const chargeId =
      req.params.chargeId;

    const {
      patientId,
      amount,
      method,
      reference,
      notes,
    } = req.body || {};


    const result =
      await createPayment({
        chargeId,
        patientId,
        amount,
        method,
        reference,
        notes,
        actorId:
          req.user?.id || null,
      });


    res.status(
      result.alreadyProcessed
        ? 200
        : 201
    ).json({
      success: true,

      message:
        result.alreadyProcessed
          ? "Payment already processed"
          : "Payment created successfully",

      data:
        result,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET PAYMENTS BY CHARGE
|--------------------------------------------------------------------------
*/

export const getByCharge = async (
  req,
  res,
  next
) => {
  try {
    const payments =
      await getPaymentsByCharge(
        req.params.chargeId
      );


    res.json({
      success: true,

      data:
        payments,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET CHARGE BALANCE
|--------------------------------------------------------------------------
*/

export const getBalance = async (
  req,
  res,
  next
) => {
  try {
    const balance =
      await getChargeBalance(
        req.params.chargeId
      );


    res.json({
      success: true,

      data:
        balance,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| REFUND PAYMENT
|--------------------------------------------------------------------------
*/

export const refund = async (
  req,
  res,
  next
) => {
  try {
    const paymentId =
      req.params.paymentId;

    const {
      reason,
      reference,
    } = req.body || {};


    const result =
      await refundPayment({
        paymentId,

        reason,

        reference,

        actorId:
          req.user?.id || null,
      });


    res.json({
      success: true,

      message:
        "Payment refunded successfully",

      data:
        result,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| GET PAYMENT AUDIT LOGS
|--------------------------------------------------------------------------
*/

export const getAuditLogs = async (
  req,
  res,
  next
) => {
  try {
    const logs =
      await getPaymentAuditLogs(
        req.params.paymentId
      );


    res.json({
      success: true,

      data:
        logs,
    });
  } catch (error) {
    next(error);
  }
};