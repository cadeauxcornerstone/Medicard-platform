import * as patientService from "../services/patient.service.js";

export const createPatient = async (req, res, next) => {
  try {
    const patient = await patientService.createPatient(req.body);

    res.status(201).json({
      success: true,
      message: "Patient created successfully",
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

export const getPatients = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const search = req.query.search?.trim();

    const result = await patientService.getPatients({
      page,
      limit,
      search
    });

    res.status(200).json({
      success: true,
      data: result.patients,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientById = async (req, res, next) => {
  try {
    const patient = await patientService.getPatientById(
      req.params.id
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req, res, next) => {
  try {
    const patient = await patientService.updatePatient(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

export const deletePatient = async (req, res, next) => {
  try {
    await patientService.deletePatient(req.params.id);

    res.status(200).json({
      success: true,
      message: "Patient deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};