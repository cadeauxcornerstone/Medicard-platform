import {
  addVaultAllergy,
  addVaultCondition,
  createDependent,
  getVaultDashboard,
  removeVaultHealthItem,
  updateVaultProfile,
} from "../services/patient-vault.service.js";
import {
  getVaultPaymentStatus,
  initiateVaultPayment,
} from "../services/registration.service.js";

function sendError(res, error) {
  console.error("Patient vault request failed:", error);
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : "Unable to update Patient Vault data",
  });
}

export async function getDashboard(req, res) {
  try {
    const result = await getVaultDashboard(req.user.id);
    res.json({ success: true, data: result });
  } catch (error) {
    sendError(res, error);
  }
}

export async function updateProfile(req, res) {
  try {
    const profile = await updateVaultProfile(req.user.id, req.params.profileId, req.body);
    res.json({ success: true, data: profile });
  } catch (error) {
    sendError(res, error);
  }
}

export async function addDependent(req, res) {
  try {
    const dependent = await createDependent(req.user.id, req.body);
    res.status(201).json({ success: true, data: dependent });
  } catch (error) {
    sendError(res, error);
  }
}

export async function addAllergy(req, res) {
  try {
    const allergy = await addVaultAllergy(req.user.id, req.params.profileId, req.body);
    res.status(201).json({ success: true, data: allergy });
  } catch (error) {
    sendError(res, error);
  }
}

export async function addCondition(req, res) {
  try {
    const condition = await addVaultCondition(req.user.id, req.params.profileId, req.body);
    res.status(201).json({ success: true, data: condition });
  } catch (error) {
    sendError(res, error);
  }
}

export async function deleteHealthItem(req, res) {
  if (!["allergies", "conditions"].includes(req.params.kind)) {
    return res.status(400).json({ success: false, message: "Health record type is invalid" });
  }
  try {
    await removeVaultHealthItem(
      req.user.id,
      req.params.profileId,
      req.params.itemId,
      req.params.kind === "allergies" ? "allergy" : "condition",
    );
    res.json({ success: true });
  } catch (error) {
    sendError(res, error);
  }
}

export async function initiatePlanPayment(req, res) {
  try {
    const { plan, paymentMethod, phone } = req.body;
    if (!plan || !paymentMethod || !phone) {
      return res.status(400).json({
        success: false,
        message: "Plan, payment method, and phone number are required",
      });
    }
    const payment = await initiateVaultPayment(req.user.id, plan, paymentMethod, phone);
    res.status(payment.status === "PENDING" ? 200 : 201).json({ success: true, ...payment });
  } catch (error) {
    console.error("Patient vault plan payment failed:", error);
    const status = error.message.includes("XENTRIPAY_API_KEY") ? 503
      : error.message.includes("XentriPay") || error.message.includes("reach XentriPay") ? 502
        : 400;
    res.status(status).json({ success: false, message: error.message || "Unable to start payment" });
  }
}

export async function getOwnPlanPaymentStatus(req, res) {
  try {
    const result = await getVaultPaymentStatus(req.params.paymentId, req.user.id);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("Patient vault payment status check failed:", error);
    const status = error.message.includes("XENTRIPAY_API_KEY") ? 503
      : error.message.includes("XentriPay") || error.message.includes("reach XentriPay") ? 502
        : error.message.includes("not found") ? 404 : 500;
    res.status(status).json({ success: false, message: error.message || "Unable to check payment" });
  }
}
