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

export const API_BASE_URL = "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});


/*
|--------------------------------------------------------------------------
| Generic API response
|--------------------------------------------------------------------------
*/

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}


/*
|--------------------------------------------------------------------------
| Patient
|--------------------------------------------------------------------------
*/

export interface Patient {
  id: string;
  patientNumber: string;

  firstName: string;
  lastName: string;

  dateOfBirth?: string | null;
  gender?: string;

  phone?: string | null;
}


/*
|--------------------------------------------------------------------------
| Patient Card
|--------------------------------------------------------------------------
*/

export interface PatientCard {
  id: string;
  cardUid: string;
  status: string;
  patientId: string;
  issuedAt?: string;

  patient?: Patient;
}


/*
|--------------------------------------------------------------------------
| Card identification response
|--------------------------------------------------------------------------
*/

export interface CardIdentification {
  card?: PatientCard;
  patient?: Patient;

  [key: string]: unknown;
}


/*
|--------------------------------------------------------------------------
| Encounter
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| Clinical note
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| Diagnosis
|--------------------------------------------------------------------------
*/

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
}


/*
|--------------------------------------------------------------------------
| Prescription item
|--------------------------------------------------------------------------
*/

export interface PrescriptionItem {
  id: string;

  prescriptionId: string;

  medicationName: string;

  dosage?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
}


/*
|--------------------------------------------------------------------------
| Laboratory request
|--------------------------------------------------------------------------
*/

export interface LabRequest {
  id: string;

  patientId: string;
  encounterId: string;

  status: string;

  requestedAt?: string;
  completedAt?: string | null;

  notes?: string | null;

  patient?: Patient;
}


/*
|--------------------------------------------------------------------------
| Laboratory result
|--------------------------------------------------------------------------
*/

export interface LabResult {
  id: string;

  labRequestId: string;

  performedById?: string | null;

  result?: string | null;
  interpretation?: string | null;

  verifiedAt?: string | null;

  createdAt?: string;
  updatedAt?: string;
}


/*
|--------------------------------------------------------------------------
| Radiology request
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| Radiology study
|--------------------------------------------------------------------------
*/

export interface RadiologyStudy {
  id: string;

  radiologyRequestId: string;

  studyType: string;

  performedAt?: string | null;

  imageUrl?: string | null;

  createdAt?: string;
}


/*
|--------------------------------------------------------------------------
| Radiology report
|--------------------------------------------------------------------------
*/

export interface RadiologyReport {
  id: string;

  studyId: string;

  radiologistId?: string | null;

  findings?: string | null;
  impression?: string | null;

  createdAt?: string;
  updatedAt?: string;
}


/*
|--------------------------------------------------------------------------
| Charge
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| Wallet
|--------------------------------------------------------------------------
*/

export interface Wallet {
  id: string;

  patientId: string;

  balance: number;
  currency: string;

  status: string;
}


/*
|--------------------------------------------------------------------------
| Payment
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| CARD API
|--------------------------------------------------------------------------
*/

/**
 * Identify a MedCard using its NFC UID.
 */
export const identifyCard = async (
  cardUid: string
): Promise<CardIdentification> => {
  const response = await api.post<ApiResponse<CardIdentification>>(
    "/cards/identify",
    {
      cardUid,
    }
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


/*
|--------------------------------------------------------------------------
| PATIENT API
|--------------------------------------------------------------------------
*/

export const getPatients = async (): Promise<Patient[]> => {
  const response = await api.get<ApiResponse<Patient[]>>(
    "/patients"
  );

  return response.data.data;
};


export const getPatient = async (
  patientId: string
): Promise<Patient> => {
  const response = await api.get<ApiResponse<Patient>>(
    `/patients/${patientId}`
  );

  return response.data.data;
};


/*
|--------------------------------------------------------------------------
| ENCOUNTER DATA
|--------------------------------------------------------------------------
|
| There is currently no dedicated encounter.routes.js in the backend.
| Therefore we do not invent encounter endpoints here.
|
| Encounter-related resources are accessed through their existing
| encounter-scoped routes below.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| CLINICAL NOTES
|--------------------------------------------------------------------------
*/

export const getClinicalNotes = async (
  encounterId: string
): Promise<ClinicalNote[]> => {
  const response = await api.get<ApiResponse<ClinicalNote[]>>(
    `/encounters/${encounterId}/clinical-notes`
  );

  return response.data.data;
};


/*
|--------------------------------------------------------------------------
| DIAGNOSES
|--------------------------------------------------------------------------
*/

export const getDiagnoses = async (
  encounterId: string
): Promise<Diagnosis[]> => {
  const response = await api.get<ApiResponse<Diagnosis[]>>(
    `/encounters/${encounterId}/diagnoses`
  );

  return response.data.data;
};


/*
|--------------------------------------------------------------------------
| PRESCRIPTIONS
|--------------------------------------------------------------------------
*/

export const getPrescriptions = async (
  encounterId: string
): Promise<Prescription[]> => {
  const response = await api.get<ApiResponse<Prescription[]>>(
    `/encounters/${encounterId}/prescriptions`
  );

  return response.data.data;
};


/*
|--------------------------------------------------------------------------
| LABORATORY
|--------------------------------------------------------------------------
*/

export const getLabRequests = async (
  encounterId: string
): Promise<LabRequest[]> => {
  const response = await api.get<ApiResponse<LabRequest[]>>(
    `/encounters/${encounterId}/lab-requests`
  );

  return response.data.data;
};


export const getLabResults = async (
  labRequestId: string
): Promise<LabResult[]> => {
  const response = await api.get<ApiResponse<LabResult[]>>(
    `/lab-requests/${labRequestId}/results`
  );

  return response.data.data;
};


/*
|--------------------------------------------------------------------------
| RADIOLOGY
|--------------------------------------------------------------------------
*/

export const getRadiologyRequests = async (
  encounterId: string
): Promise<RadiologyRequest[]> => {
  const response = await api.get<ApiResponse<RadiologyRequest[]>>(
    `/encounters/${encounterId}/radiology-requests`
  );

  return response.data.data;
};


export const getRadiologyStudies = async (
  radiologyRequestId: string
): Promise<RadiologyStudy[]> => {
  const response = await api.get<ApiResponse<RadiologyStudy[]>>(
    `/radiology-requests/${radiologyRequestId}/studies`
  );

  return response.data.data;
};


export const getRadiologyReport = async (
  studyId: string
): Promise<RadiologyReport> => {
  const response = await api.get<ApiResponse<RadiologyReport>>(
    `/radiology-studies/${studyId}/report`
  );

  return response.data.data;
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

  return response.data.data;
};


export const getCharge = async (
  chargeId: string
): Promise<Charge> => {
  const response = await api.get<ApiResponse<Charge>>(
    `/charges/${chargeId}`
  );

  return response.data.data;
};


/*
|--------------------------------------------------------------------------
| WALLET
|--------------------------------------------------------------------------
*/

export const getWallet = async (
  patientId: string
): Promise<Wallet> => {
  const response = await api.get<ApiResponse<Wallet>>(
    `/patients/${patientId}/wallet`
  );

  return response.data.data;
};


/*
|--------------------------------------------------------------------------
| PAYMENTS
|--------------------------------------------------------------------------
*/

export const getPayments = async (
  chargeId: string
): Promise<Payment[]> => {
  const response = await api.get<ApiResponse<Payment[]>>(
    `/charges/${chargeId}/payments`
  );

  return response.data.data;
};


/*
|--------------------------------------------------------------------------
| ERROR HELPER
|--------------------------------------------------------------------------
*/

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