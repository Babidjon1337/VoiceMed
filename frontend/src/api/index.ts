/// <reference types="vite/client" />
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://7a6d-94-131-15-2.ngrok-free.app/api";

export interface DashboardStats {
  totalToday: number;
  completed: number;
  waiting: number;
  drafts: number;
}

export type AppointmentStatus = "waiting" | "done" | "draft";

export interface Appointment {
  id: number;
  time: string;
  patientName: string;
  reason: string;
  status: AppointmentStatus;
}

export interface Doctor {
  id: number;
  full_name: string;
  email: string;
  specialization: string;
  avatar_url: string;
}

export interface DashboardData {
  doctor: Doctor;
  stats: DashboardStats;
  schedule: Appointment[];
}

export interface Patient {
  id: number;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  bloodType: string;
  doctor_id: number;
  condition: string;
}

export interface Transcript {
  id: number;
  text: string;
  timestamp: string;
}

export interface PatientRecord {
  complaints: string[];
  symptoms: string[];
  temperature: number | null;
  blood_pressure: {
    systolic: number | null;
    diastolic: number | null;
  };
  diagnosis: string[];
  treatment: string[];
  notes: string | null;
}

export interface PatientDetailsData {
  patient: Patient;
  transcripts: Transcript[];
  record: PatientRecord | null;
  active_analysis_task?: string | null;
}

export interface RecordingStartResponse {
  status: string;
  task_id: string;
}

const API_KEY =
  import.meta.env.VITE_API_KEY || "super_secret_voice_med_7237403998";
export const getApiKey = () => API_KEY;

let dashboardCachePromise: Promise<DashboardData> | null = null;

/**
 * 1. Получение данных для главной страницы ЛК врача (дашборда)
 * @param doctorId Идентификатор врача
 * Получает статистику приемов и расписание (список пациентов) для конкретного врача.
 */
export async function getDoctorDashboard(
  doctorId: string,
  force = false,
): Promise<DashboardData> {
  if (!force && dashboardCachePromise) {
    return dashboardCachePromise;
  }

  dashboardCachePromise = fetch(
    `${API_BASE_URL}/doctors/${doctorId}/dashboard`,
    {
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    },
  )
    .then(async (response) => {
      if (!response.ok) {
        dashboardCachePromise = null;
        throw new Error("Failed to fetch doctor dashboard");
      }
      return await response.json();
    })
    .catch((err) => {
      dashboardCachePromise = null;
      throw err;
    });

  return dashboardCachePromise;
}

/**
 * 2. Получение данных конкретного пациента при открытии его карты
 * @param patientId Идентификатор пациента
 * Получает описание пациента, список записей транскриптов и текущие заполненные данные приема.
 */
export async function getPatientFullDetails(
  patientId: string,
): Promise<PatientDetailsData> {
  const response = await fetch(
    `${API_BASE_URL}/patients/${patientId}/details`,
    {
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
    },
  );
  if (!response.ok) {
    throw new Error("Failed to fetch patient details");
  }
  return await response.json();
}

/**
 * 3. Отправка аудиофайла записи приема на сервер
 * @param patientId Идентификатор пациента
 * @param audioBlob Записанный аудиофайл
 * Отправляет голосовую запись, сервер проводит анализ и возвращает расшифровку (транскрипт)
 * вместе с заполненной структурой медицинской карты (диагнозы, жалобы и т.д.).
 */
export async function updatePatientRecord(
  patientId: string,
  recordData: PatientRecord,
): Promise<PatientRecord> {
  const response = await fetch(`${API_BASE_URL}/patients/${patientId}/record`, {
    method: "PUT",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(recordData),
  });
  if (!response.ok) {
    throw new Error("Failed to update patient record");
  }
  return await response.json();
}

export async function uploadPatientRecording(
  patientId: string,
  audioBlob: Blob,
): Promise<RecordingStartResponse> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");

  const response = await fetch(
    `${API_BASE_URL}/patients/${patientId}/recordings`,
    {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "ngrok-skip-browser-warning": "true",
        // NOTE: Do not set Content-Type here, browser sets it automatically with the correct boundary for FormData
      },
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error("Failed to upload recording");
  }

  return await response.json();
}
