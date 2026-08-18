import express from "express";

import {
  createProvider,
  getProviders,
  createPlan,
  getPlans,
  createPlanCoverage,
  getPlanCoverages,
  addInsuranceToPatient,
  getPatientInsurances,
  calculateChargeInsurance,
} from "../controllers/insurance.controller.js";

const router = express.Router();


/*
|--------------------------------------------------------------------------
| INSURANCE PROVIDERS
|--------------------------------------------------------------------------
*/

router.post(
  "/insurance/providers",
  createProvider
);

router.get(
  "/insurance/providers",
  getProviders
);


/*
|--------------------------------------------------------------------------
| INSURANCE PLANS
|--------------------------------------------------------------------------
*/

router.post(
  "/insurance/plans",
  createPlan
);

router.get(
  "/insurance/plans",
  getPlans
);


/*
|--------------------------------------------------------------------------
| COVERAGE RULES
|--------------------------------------------------------------------------
*/

router.post(
  "/insurance/plans/:planId/coverages",
  createPlanCoverage
);

/*
|--------------------------------------------------------------------------
| CHARGE INSURANCE CALCULATION
|--------------------------------------------------------------------------
*/

router.post(
  "/charges/:chargeId/calculate-insurance",
  calculateChargeInsurance
);

router.get(
  "/insurance/plans/:planId/coverages",
  getPlanCoverages
);


/*
|--------------------------------------------------------------------------
| PATIENT INSURANCE
|--------------------------------------------------------------------------
*/

router.post(
  "/patients/:patientId/insurance",
  addInsuranceToPatient
);

router.get(
  "/patients/:patientId/insurance",
  getPatientInsurances
);


export default router;