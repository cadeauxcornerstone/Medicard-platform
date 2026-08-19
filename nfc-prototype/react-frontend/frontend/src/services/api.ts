import axios from "axios";

/*
|--------------------------------------------------------------------------
| MedCard API Client
|--------------------------------------------------------------------------
|
| Centralized HTTP client for the React application.
|
| Frontend:
|   http://localhost:5173
|
| Backend:
|   http://localhost:5000
|
|--------------------------------------------------------------------------
*/

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
export const SOCKET_URL   = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

/**
 * Prototype context: used when no auth session exists.
 * In production these come from the authenticated user JWT.
 */
export const DEMO_FACILITY_ID = import.meta.env.VITE_DEMO_FACILITY_ID || "9e268cfd-1e17-47cf-aadb-be42c58ad79f";
export const DEMO_USER_ID     = import.meta.env.VITE_DEMO_USER_ID     || "ac844b2b-cc1b-45a4-9404-e059fdd6df0b";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});


//Generic API response

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}


//Patient

export interface Patient {
  id: string;
  patientNumber: string;

  firstName: string;
  lastName: string;

  dateOfBirth?: string | null;
  gender?: string;

  phone?: string | null;
  nationalId?: string | null;
  address?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
}


//Patient Card

export interface PatientCard {
  id: string;
  cardUid: string;
  status: string;
  patientId: string;
  issuedAt?: string;

  patient?: Patient;
}


//card identification response

export interface CardIdentification {
  card?: PatientCard;
  patient?: Patient;
  encounter?: Encounter;

  patientId?: string;
  encounterId?: string;

  [key: string]: unknown;
}


//encounter

export interface Encounter {
  id: string;

  patientId: string;
  facilityId: string;

  type: string;
  status: string;

  startedAt?: string | null;
  endedAt?: string | null;

  patient?: Patient;
}


//clinical note

export interface ClinicalNote {
  id: string;

  encounterId: string;
  authorId: string;

  subjective?: string | null;
  objective?: string | null;
  assessment?: string | null;
  plan?: string | null;

  createdAt?: string;
  updatedAt?: string;
}


//Diagnosis

export interface Diagnosis {
  id: string;

  encounterId: string;
  patientId: string;

  code?: string | null;
  name?: string | null;
  description?: string | null;

  createdAt?: string;
}


/*
|--------------------------------------------------------------------------
| Prescription
|--------------------------------------------------------------------------
*/

export interface Prescription {
  id: string;

  patientId: string;
  encounterId: string;

  status: string;

  notes?: string | null;

  createdAt?: string;
  updatedAt?: string;

  items?: PrescriptionItem[];
  patient?: Patient;
}


//Prescription item

export interface PrescriptionItem {
  id: string;

  prescriptionId: string;

  medicationName: string;

  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
}


//Laboratory request

export interface LabTest {
  id: string;
  labRequestId: string;
  testName: string;
  testCode: string | null;
  createdAt: string;
}

export interface LabRequest {
  id: string;

  patientId: string;
  encounterId: string;
  requestedById?: string;

  status: "REQUESTED" | "SAMPLE_COLLECTED" | "PROCESSING" | "COMPLETED" | "CANCELLED";

  clinicalIndication?: string | null;
  requestedAt?: string;
  completedAt?: string | null;

  notes?: string | null;

  patient?: Patient;
  tests?: LabTest[];
  requestedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  encounter?: {
    id: string;
    patientId: string;
    facilityId: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
  };
}


//Laboratory result

export interface LabResult {
  id: string;

  labRequestId: string;

  performedById?: string | null;

  testName?: string;
  resultValue?: string;
  unit?: string | null;
  referenceRange?: string | null;
  result?: string | null;
  interpretation?: string | null;
  status?: string;

  verifiedAt?: string | null;
  resultDate?: string;

  createdAt?: string;
  updatedAt?: string;
}


//Radiology request

export interface RadiologyRequest {
  id: string;

  patientId: string;
  encounterId: string;

  status: string;

  requestedAt?: string;
  completedAt?: string | null;

  notes?: string | null;

  patient?: Patient;
}


//Radiology study

export interface RadiologyStudy {
  id: string;

  radiologyRequestId: string;

  studyType: string;

  performedAt?: string | null;

  imageUrl?: string | null;

  createdAt?: string;
}


//Radiology report

export interface RadiologyReport {
  id: string;

  studyId: string;

  radiologistId?: string | null;

  findings?: string | null;
  impression?: string | null;

  createdAt?: string;
  updatedAt?: string;
}


//Charge

export interface Charge {
  id: string;

  patientId: string;
  encounterId: string;

  serviceId: string;
  servicePriceId?: string | null;

  quantity: number;

  unitPrice: number;
  subtotal: number;

  insuranceAmount: number;
  patientAmount: number;

  currency: string;

  status: string;

  description?: string | null;

  createdAt?: string;
  updatedAt?: string;
}


//Wallet

export interface Wallet {
  id: string;

  patientId: string;

  balance: number;
  currency: string;

  status: string;
}


//Payment

export interface Payment {
  id: string;

  chargeId: string;
  patientId: string;

  amount: number;
  currency: string;

  method: string;
  status: string;

  reference?: string | null;
  notes?: string | null;

  paidAt?: string | null;

  createdAt?: string;
}


//Dispensing record

export interface DispensingRecord {
  id: string;
  prescriptionId: string;
  dispensedById?: string | null;
  notes?: string | null;
  dispensedAt?: string;
}


//CARD API

export const identifyCard = async (
  cardUid: string
): Promise<CardIdentification> => {
  const response = await api.post<ApiResponse<CardIdentification>>(
    "/cards/identify",
    { cardUid }
  );

  return response.data.data;
};


/**
 * Get a card directly by UID.
 */
export const getCardByUid = async (
  cardUid: string
): Promise<PatientCard> => {
  const response = await api.get<ApiResponse<PatientCard>>(
    `/cards/${encodeURIComponent(cardUid)}`
  );

  return response.data.data;
};


/**
 * Register a new NFC card linked to a patient.
 */
export const createCard = async (payload: {
  patientId: string;
  cardUid: string;
}): Promise<PatientCard> => {
  const response = await api.post<ApiResponse<PatientCard>>("/cards", payload);
  return response.data.data;
};


/**
 * Block a MedCard by UID.
 */
export const blockCard = async (cardUid: string): Promise<PatientCard> => {
  const response = await api.post<ApiResponse<PatientCard>>(
    `/cards/${encodeURIComponent(cardUid)}/block`
  );
  return response.data.data;
};


/**
 * Unblock a MedCard by UID.
 */
export const unblockCard = async (cardUid: string): Promise<PatientCard> => {
  const response = await api.post<ApiResponse<PatientCard>>(
    `/cards/${encodeURIComponent(cardUid)}/unblock`
  );
  return response.data.data;
};


/*
|--------------------------------------------------------------------------
| PATIENT API
|--------------------------------------------------------------------------
*/

export interface GetPatientsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetPatientsResult {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}

export const getPatients = async (
  params: GetPatientsParams = {}
): Promise<GetPatientsResult> => {
  const { page = 1, limit = 50, search } = params;

  const response = await api.get<PaginatedResponse<Patient>>("/patients", {
    params: {
      page,
      limit,
      ...(search ? { search } : {}),
    },
  });

  return {
    patients: response.data.data ?? [],
    pagination: response.data.pagination ?? { page, limit, total: 0 },
  };
};


export const getPatient = async (
  patientId: string
): Promise<Patient> => {
  const response = await api.get<ApiResponse<Patient>>(
    `/patients/${patientId}`
  );

  return response.data.data;
};


export interface CreatePatientPayload {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  phone?: string;
  nationalId?: string;
  address?: string;
  bloodType?: string;
  allergies?: string;
}

export const createPatient = async (
  payload: CreatePatientPayload
): Promise<Patient> => {
  const response = await api.post<ApiResponse<Patient>>(
    "/patients",
    payload
  );

  return response.data.data;
};


export const updatePatient = async (
  patientId: string,
  payload: Partial<CreatePatientPayload>
): Promise<Patient> => {
  const response = await api.patch<ApiResponse<Patient>>(
    `/patients/${patientId}`,
    payload
  );

  return response.data.data;
};


//encounter API

export const getEncounter = async (encounterId: string): Promise<Encounter> => {
  const response = await api.get<ApiResponse<Encounter>>(
    `/encounters/${encounterId}`
  );
  return response.data.data;
};


//Clinical notes

export const getClinicalNotes = async (
  encounterId: string
): Promise<ClinicalNote[]> => {
  const response = await api.get<ApiResponse<ClinicalNote[]>>(
    `/encounters/${encounterId}/clinical-notes`
  );

  return response.data.data ?? [];
};


export const createClinicalNote = async (
  encounterId: string,
  payload: {
    authorId: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
  }
): Promise<ClinicalNote> => {
  const response = await api.post<ApiResponse<ClinicalNote>>(
    `/encounters/${encounterId}/clinical-notes`,
    payload
  );
  return response.data.data;
};


// Diagnostics

export const getDiagnoses = async (
  encounterId: string
): Promise<Diagnosis[]> => {
  const response = await api.get<ApiResponse<Diagnosis[]>>(
    `/encounters/${encounterId}/diagnoses`
  );

  return response.data.data ?? [];
};


export const createDiagnosis = async (
  encounterId: string,
  payload: { code?: string; name: string; description?: string }
): Promise<Diagnosis> => {
  const response = await api.post<ApiResponse<Diagnosis>>(
    `/encounters/${encounterId}/diagnoses`,
    payload
  );
  return response.data.data;
};


// Prescriptions

export const getPrescriptions = async (
  encounterId: string
): Promise<Prescription[]> => {
  const response = await api.get<ApiResponse<Prescription[]>>(
    `/encounters/${encounterId}/prescriptions`
  );

  return response.data.data ?? [];
};


export const createPrescription = async (
  encounterId: string,
  payload: {
    notes?: string;
    items: {
      medicationName: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      instructions?: string;
    }[];
  }
): Promise<Prescription> => {
  const response = await api.post<ApiResponse<Prescription>>(
    `/encounters/${encounterId}/prescriptions`,
    payload
  );
  return response.data.data;
};


export const updatePrescriptionStatus = async (
  prescriptionId: string,
  status: string
): Promise<Prescription> => {
  const response = await api.patch<ApiResponse<Prescription>>(
    `/prescriptions/${prescriptionId}/status`,
    { status }
  );
  return response.data.data;
};


// Laboratory

export const getLabRequests = async (
  encounterId: string
): Promise<LabRequest[]> => {
  const response = await api.get<ApiResponse<LabRequest[]>>(
    `/encounters/${encounterId}/lab-requests`
  );

  return response.data.data ?? [];
};


/**
 * Get all lab requests (work queue) — filtered by facility and/or status.
 */
export interface GetLabQueueParams {
  facilityId?: string;
  status?: string;
}

export const getLabQueue = async (
  params: GetLabQueueParams = {}
): Promise<LabRequest[]> => {
  const response = await api.get<ApiResponse<LabRequest[]>>("/lab-requests", {
    params,
  });

  return response.data.data ?? [];
};


/**
 * Get a single lab request by ID.
 */
export const getLabRequest = async (
  labRequestId: string
): Promise<LabRequest> => {
  const response = await api.get<ApiResponse<LabRequest>>(
    `/lab-requests/${labRequestId}`
  );
  return response.data.data;
};


/**
 * Update a lab request status.
 */
export const updateLabRequestStatus = async (
  labRequestId: string,
  status: string
): Promise<LabRequest> => {
  const response = await api.patch<ApiResponse<LabRequest>>(
    `/lab-requests/${labRequestId}/status`,
    { status }
  );
  return response.data.data;
};


export const getLabResults = async (
  labRequestId: string
): Promise<LabResult[]> => {
  const response = await api.get<ApiResponse<LabResult[]>>(
    `/lab-requests/${labRequestId}/results`
  );

  return response.data.data ?? [];
};


export const createLabResult = async (
  labRequestId: string,
  payload: {
    testName: string;
    resultValue: string;
    unit?: string;
    referenceRange?: string;
    interpretation?: string;
    performedById: string;
  }
): Promise<LabResult> => {
  const response = await api.post<ApiResponse<LabResult>>(
    `/lab-requests/${labRequestId}/results`,
    payload
  );
  return response.data.data;
};


//radiology

export const getRadiologyRequests = async (
  encounterId: string
): Promise<RadiologyRequest[]> => {
  const response = await api.get<ApiResponse<RadiologyRequest[]>>(
    `/encounters/${encounterId}/radiology-requests`
  );

  return response.data.data ?? [];
};


export const getRadiologyStudies = async (
  radiologyRequestId: string
): Promise<RadiologyStudy[]> => {
  const response = await api.get<ApiResponse<RadiologyStudy[]>>(
    `/radiology-requests/${radiologyRequestId}/studies`
  );

  return response.data.data ?? [];
};


export const getRadiologyReport = async (
  studyId: string
): Promise<RadiologyReport> => {
  const response = await api.get<ApiResponse<RadiologyReport>>(
    `/radiology-studies/${studyId}/report`
  );

  return response.data.data;
};


//pharmacy

export interface GetPharmacyQueueParams {
  facilityId?: string;
  search?: string;
  status?: string;
}

export const getPharmacyQueue = async (
  params: GetPharmacyQueueParams = {}
): Promise<Prescription[]> => {
  const response = await api.get<ApiResponse<Prescription[]>>(
    "/pharmacy/prescriptions",
    { params }
  );
  return response.data.data ?? [];
};


export const getPharmacySummary = async (params: { facilityId?: string } = {}) => {
  const response = await api.get<ApiResponse<{
    pending: number;
    dispensed: number;
    total: number;
  }>>(
    "/pharmacy/summary",
    { params }
  );
  return response.data.data;
};


/**
 * Dispense a prescription at the pharmacy.
 */
export const dispensePrescription = async (
  prescriptionId: string,
  payload: { dispensedById: string; notes?: string }
): Promise<DispensingRecord> => {
  const response = await api.post<ApiResponse<DispensingRecord>>(
    `/prescriptions/${prescriptionId}/dispense`,
    payload
  );
  return response.data.data;
};


export const getDispensingHistory = async (
  prescriptionId: string
): Promise<DispensingRecord[]> => {
  const response = await api.get<ApiResponse<DispensingRecord[]>>(
    `/prescriptions/${prescriptionId}/dispensing`
  );
  return response.data.data ?? [];
};


/*
|--------------------------------------------------------------------------
| CHARGES
|--------------------------------------------------------------------------
*/

export const getCharges = async (
  encounterId: string
): Promise<Charge[]> => {
  const response = await api.get<ApiResponse<Charge[]>>(
    `/encounters/${encounterId}/charges`
  );

  return response.data.data ?? [];
};


export const getCharge = async (
  chargeId: string
): Promise<Charge> => {
  const response = await api.get<ApiResponse<Charge>>(
    `/charges/${chargeId}`
  );

  return response.data.data;
};


export const createCharge = async (
  encounterId: string,
  payload: {
    serviceId: string;
    quantity?: number;
    description?: string;
  }
): Promise<Charge> => {
  const response = await api.post<ApiResponse<Charge>>(
    `/encounters/${encounterId}/charges`,
    payload
  );
  return response.data.data;
};


//wallet

export const getWallet = async (
  patientId: string
): Promise<Wallet> => {
  const response = await api.get<ApiResponse<Wallet>>(
    `/patients/${patientId}/wallet`
  );

  return response.data.data;
};


// Payments

export const getPayments = async (
  chargeId: string
): Promise<Payment[]> => {
  const response = await api.get<ApiResponse<Payment[]>>(
    `/charges/${chargeId}/payments`
  );

  return response.data.data ?? [];
};


export const createPayment = async (
  chargeId: string,
  payload: {
    amount: number;
    method: string;
    reference?: string;
    notes?: string;
  }
): Promise<Payment> => {
  const response = await api.post<ApiResponse<Payment>>(
    `/charges/${chargeId}/payments`,
    payload
  );
  return response.data.data;
};


// Error Helper

export const getApiErrorMessage = (
  error: unknown
): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Unable to communicate with MedCard backend."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
};
