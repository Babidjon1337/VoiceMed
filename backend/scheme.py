from pydantic import BaseModel, ConfigDict
from typing import Any, Optional


class DashboardStatsSchema(BaseModel):
    totalToday: int
    completed: int
    waiting: int
    drafts: int


class ScheduleItemSchema(BaseModel):
    id: int
    time: str
    patientName: str
    reason: str
    status: str  # 'waiting' | 'done' | 'draft'


class DoctorSchema(BaseModel):
    id: int
    full_name: str
    email: str
    specialization: str
    avatar_url: str


class Dashboard(BaseModel):
    doctor: DoctorSchema
    stats: DashboardStatsSchema
    schedule: list[ScheduleItemSchema]


# ------------------------------


class PatientSchema(BaseModel):
    id: int
    name: str
    age: int
    gender: str  # 'Male' | 'Female' | 'Other'
    bloodType: str
    doctor_id: int
    condition: str


class TranscriptionSchema(BaseModel):
    id: int
    text: str
    timestamp: str


class BloodPressureSchema(BaseModel):
    systolic: Optional[int] = None
    diastolic: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class MedicalRecordSchema(BaseModel):
    complaints: list[str]
    symptoms: list[str]
    temperature: Optional[float] = None
    blood_pressure: BloodPressureSchema
    diagnosis: list[str]
    treatment: list[str]
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PatientFullDetailsSchema(BaseModel):
    patient: PatientSchema
    transcripts: list[TranscriptionSchema] = None
    record: Optional[MedicalRecordSchema] = None

    active_analysis_task: Optional[str] = None  # ID активной задачи в Celery, если есть


# ----------------------------------------------


class UploadPatientFullDetailsSchema(BaseModel):
    transcripts: TranscriptionSchema
    record: Optional[MedicalRecordSchema] = None


# ----------------------------------------------


class StreamResponseSchema(BaseModel):
    status: str
    step: str
    result: Optional[UploadPatientFullDetailsSchema] = None


class StreamErrorSchema(BaseModel):
    status: str
    message: str
