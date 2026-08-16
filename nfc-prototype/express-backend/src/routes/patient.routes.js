import express from "express";

import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient
} from "../controllers/patient.controller.js";

import { validate } from "../middleware/validation.middleware.js";

import {
  createPatientSchema,
  updatePatientSchema
} from "../validators/patient.validator.js";

const router = express.Router();

router.post(
  "/",
  validate(createPatientSchema),
  createPatient
);

router.get("/", getPatients);

router.get("/:id", getPatientById);

router.patch(
  "/:id",
  validate(updatePatientSchema),
  updatePatient
);

router.delete("/:id", deletePatient);

export default router;