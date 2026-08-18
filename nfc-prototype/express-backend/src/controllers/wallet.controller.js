import {
  createWallet,
  getWallet,
  topUpWallet,
  getWalletTransactions,
} from "../services/wallet.service.js";


export const create = async (
  req,
  res,
  next
) => {
  try {
    const wallet =
      await createWallet(
        req.params.patientId
      );

    res.status(201).json({
      success: true,
      message: "Wallet created successfully",
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};


export const get = async (
  req,
  res,
  next
) => {
  try {
    const wallet =
      await getWallet(
        req.params.patientId
      );

    res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};


export const topUp = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await topUpWallet({
        patientId:
          req.params.patientId,

        ...req.body,
      });

    res.status(201).json({
      success: true,
      message: "Wallet topped up successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


export const transactions = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await getWalletTransactions(
        req.params.patientId
      );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};