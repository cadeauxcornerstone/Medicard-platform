import {
  createInsuranceProvider,
  getInsuranceProviders,
  createInsurancePlan,
  getInsurancePlans,
  createCoverage,
  getCoveragesByPlan,
  addPatientInsurance,
  getPatientInsurance,
} from "../services/insurance.service.js";


/*
|--------------------------------------------------------------------------
| PROVIDERS
|--------------------------------------------------------------------------
*/

export const createProvider = async (
  req,
  res,
  next
) => {
  try {
    const provider =
      await createInsuranceProvider(
        req.body
      );

    res.status(201).json({
      success: true,
      message:
        "Insurance provider created successfully",
      data: provider,
    });
  } catch (error) {
    next(error);
  }
};


export const getProviders = async (
  req,
  res,
  next
) => {
  try {
    const providers =
      await getInsuranceProviders();

    res.json({
      success: true,
      data: providers,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| PLANS
|--------------------------------------------------------------------------
*/

export const createPlan = async (
  req,
  res,
  next
) => {
  try {
    const plan =
      await createInsurancePlan(
        req.body
      );

    res.status(201).json({
      success: true,
      message:
        "Insurance plan created successfully",
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};


export const getPlans = async (
  req,
  res,
  next
) => {
  try {
    const plans =
      await getInsurancePlans();

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    next(error);
  }
};


/*
|--------------------------------------------------------------------------
| COVERAGE
|--------------------------------------------------------------------------
*/

export const createPlanCoverage =
  async (
    req,
    res,
    next
  ) => {
    try {
      const coverage =
        await createCoverage({
          planId:
            req.params.planId,

          ...req.body,
        });

      res.status(201).json({
        success: true,
        message:
          "Insurance coverage created successfully",
        data: coverage,
      });
    } catch (error) {
      next(error);
    }
  };


export const getPlanCoverages =
  async (
    req,
    res,
    next
  ) => {
    try {
      const coverages =
        await getCoveragesByPlan(
          req.params.planId
        );

      res.json({
        success: true,
        data: coverages,
      });
    } catch (error) {
      next(error);
    }
  };


/*
|--------------------------------------------------------------------------
| PATIENT INSURANCE
|--------------------------------------------------------------------------
*/

export const addInsuranceToPatient =
  async (
    req,
    res,
    next
  ) => {
    try {
      const insurance =
        await addPatientInsurance({
          patientId:
            req.params.patientId,

          ...req.body,
        });

      res.status(201).json({
        success: true,
        message:
          "Patient insurance added successfully",
        data: insurance,
      });
    } catch (error) {
      next(error);
    }
  };


export const getPatientInsurances =
  async (
    req,
    res,
    next
  ) => {
    try {
      const insurance =
        await getPatientInsurance(
          req.params.patientId
        );

      res.json({
        success: true,
        data: insurance,
      });
    } catch (error) {
      next(error);
    }
  };