export const getPatientAccessView = (patient, role) => {
  const basicIdentity = {
    id: patient.id,
    patientNumber: patient.patientNumber,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
  };

  /*
   * Reception gets identity-level information only.
   */
  if (role === "RECEPTIONIST") {
    return {
      ...basicIdentity,
      phone: patient.phone,
      nationalId: patient.nationalId,
      accessLevel: "IDENTITY_ONLY",
    };
  }

  /*
   * Clinical roles can receive the clinical patient context.
   *
   * We will expand this in Phase 3 as clinical APIs are added.
   */
  if (
    [
      "DOCTOR",
      "NURSE",
      "DENTIST",
      "PHARMACIST",
      "LABORATORY",
      "RADIOLOGY",
    ].includes(role)
  ) {
    return {
      ...basicIdentity,
      phone: patient.phone,
      email: patient.email,
      accessLevel: "CLINICAL",
    };
  }

  /*
   * Administrative roles don't automatically
   * receive clinical information.
   */
  return {
    ...basicIdentity,
    accessLevel: "RESTRICTED",
  };
};