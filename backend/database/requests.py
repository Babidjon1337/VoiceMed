from sqlalchemy import delete, select, update, and_, func
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from typing import Optional

from database.models import Doctor, Patient, Transcript, MedicalRecord, async_session
from scheme import *


async def start_db():
    async with async_session() as session:
        result = await session.execute(select(Doctor))

        doctor = result.scalars().first()

        if doctor is None:

            # Создаем врача
            doctor = Doctor(
                full_name="Александр Волков",
                email="dr.john.doe@example.com",
                password_hash="hashed_password",
                specialization="Кардиолог",
                avatar_url="https://avatars.mds.yandex.net/get-shedevrum/14745968/img_941fbc4f88bc11efa8470ef0802e3d59/orig",
            )

            session.add(doctor)

            # Сохраняем врача в БД
            await session.commit()

            # Обновляем объект и получаем его id
            await session.refresh(doctor)

            # Создаем пациента
            session.add(
                Patient(
                    doctor_id=doctor.id,
                    full_name="Иван Иванов",
                    birth_date=datetime(2005, 11, 29).date(),
                    gender="М",
                    blood_type="A+",
                    condition="Гипертония",
                )
            )
            session.add(
                Patient(
                    doctor_id=doctor.id,
                    full_name="Карина Смирнова",
                    birth_date=datetime(2003, 9, 2).date(),
                    gender="Ж",
                    blood_type="B-",
                    condition="Гиперактивность",
                )
            )
            session.add(
                Patient(
                    doctor_id=doctor.id,
                    full_name="Петр Петров",
                    birth_date=datetime(1990, 5, 15).date(),
                    gender="М",
                    blood_type="O+",
                    condition="Астма",
                )
            )
            session.add(
                Patient(
                    doctor_id=doctor.id,
                    full_name="Елена Кузнецова",
                    birth_date=datetime(1985, 3, 10).date(),
                    gender="Ж",
                    blood_type="AB+",
                    condition="Диабет",
                )
            )

            await session.commit()
            print("Таблицы и начальные данные успешно созданы!")


async def check_doctor_exists(doctorId: int) -> bool:
    async with async_session() as session:
        result = await session.execute(select(Doctor).where(Doctor.id == doctorId))
        doctor = result.scalars().first()
        return doctor is not None


async def rq_doctor_dashboard(doctorId: int) -> Optional[Dashboard]:
    async with async_session() as session:
        result = await session.execute(
            select(Doctor)
            .options(selectinload(Doctor.patients))
            .where(Doctor.id == doctorId)
        )
        doctor = result.scalars().first()

        if not doctor:
            return None

        schedule = []
        for patient in doctor.patients:
            schedule.append(
                ScheduleItemSchema(
                    id=patient.id,
                    time=f"1{patient.id}:00",
                    patientName=patient.full_name,
                    reason="Checkup",
                    status="waiting" if patient.id % 2 == 0 else "done",
                )
            )

        response = Dashboard(
            doctor=DoctorSchema(
                id=doctor.id,
                full_name=doctor.full_name,
                email=doctor.email,
                specialization=doctor.specialization,
                avatar_url=doctor.avatar_url,
            ),
            stats=DashboardStatsSchema(
                totalToday=12,
                completed=8,
                waiting=4,
                drafts=1,
            ),
            schedule=schedule,
        )
        return response


async def save_transcription_and_medical_record(
    patientId: int,
    text: str,
    llm_response: dict,
):
    async with async_session() as session:

        # Сохраняем транскрипцию
        session.add(
            Transcript(
                patient_id=patientId,
                text=text,
            )
        )

        med_record = await session.execute(
            select(MedicalRecord).where(MedicalRecord.patient_id == patientId)
        )

        med_record = med_record.scalars().first()

        # Создаем мед карту если ее нет
        if med_record is None:

            doctor_id = await session.execute(
                select(Patient.doctor_id).where(Patient.id == patientId)
            )

            session.add(
                MedicalRecord(
                    patient_id=patientId,
                    doctor_id=doctor_id.scalar_one(),
                    complaints=llm_response.get("complaints"),
                    symptoms=llm_response.get("symptoms"),
                    temperature=llm_response.get("temperature"),
                    blood_pressure=llm_response.get("blood_pressure"),
                    diagnosis=llm_response.get("diagnosis"),
                    treatment=llm_response.get("treatment"),
                    notes=llm_response.get("notes"),
                )
            )

        else:

            print(llm_response)

            def is_empty(value):

                if value is None:
                    return True

                if value == "null":
                    return True

                if value == []:
                    return True

                # blood pressure special case
                if isinstance(value, dict):

                    systolic = value.get("systolic")
                    diastolic = value.get("diastolic")

                    if systolic is None and diastolic is None:
                        return True

                return False

            def merge_lists(old_value, new_value):

                if is_empty(new_value):
                    return old_value

                if not old_value:
                    return new_value

                merged = list(old_value)

                for item in new_value:

                    if item not in merged:
                        merged.append(item)

                return merged

            await session.execute(
                update(MedicalRecord)
                .where(MedicalRecord.patient_id == patientId)
                .values(
                    # append lists
                    complaints=merge_lists(
                        med_record.complaints,
                        llm_response.get("complaints"),
                    ),
                    symptoms=merge_lists(
                        med_record.symptoms,
                        llm_response.get("symptoms"),
                    ),
                    diagnosis=merge_lists(
                        med_record.diagnosis,
                        llm_response.get("diagnosis"),
                    ),
                    treatment=merge_lists(
                        med_record.treatment,
                        llm_response.get("treatment"),
                    ),
                    # overwrite single values
                    temperature=(
                        med_record.temperature
                        if is_empty(llm_response.get("temperature"))
                        else llm_response.get("temperature")
                    ),
                    blood_pressure=(
                        med_record.blood_pressure
                        if is_empty(llm_response.get("blood_pressure"))
                        else llm_response.get("blood_pressure")
                    ),
                    notes=(
                        med_record.notes
                        if is_empty(llm_response.get("notes"))
                        else llm_response.get("notes")
                    ),
                )
            )

        await session.commit()


async def get_transcriptions(patientId: int) -> list[TranscriptionSchema]:
    async with async_session() as session:
        result = await session.execute(
            select(Transcript).where(Transcript.patient_id == patientId)
        )
        transcriptions = result.scalars().all()

        return [
            TranscriptionSchema(
                id=t.id,
                text=t.text,
                timestamp=t.created_at.isoformat() if t.created_at else None,
            )
            for t in transcriptions
        ]


async def get_last_transcription(patientId: int) -> TranscriptionSchema | None:
    transcriptions = await get_transcriptions(patientId)
    return transcriptions[-1] if transcriptions else None


async def get_medical_record(patientId: int) -> Optional[MedicalRecordSchema]:
    async with async_session() as session:
        result = await session.execute(
            select(MedicalRecord).where(MedicalRecord.patient_id == patientId)
        )
        medical_record = result.scalars().first()

        if not medical_record:
            return None

        return MedicalRecordSchema(
            complaints=medical_record.complaints or [],
            symptoms=medical_record.symptoms or [],
            blood_pressure=BloodPressureSchema(
                systolic=(
                    medical_record.blood_pressure.get("systolic")
                    if medical_record.blood_pressure
                    else None
                ),
                diastolic=(
                    medical_record.blood_pressure.get("diastolic")
                    if medical_record.blood_pressure
                    else None
                ),
            ),
            temperature=medical_record.temperature,
            diagnosis=medical_record.diagnosis or [],
            treatment=medical_record.treatment or [],
            notes=medical_record.notes,
        )


async def get_patient(patientId: int) -> Optional[PatientSchema]:
    async with async_session() as session:
        result = await session.execute(select(Patient).where(Patient.id == patientId))
        patient = result.scalars().first()

        if not patient:
            return None
        return PatientSchema(
            id=patient.id,
            name=patient.full_name,
            age=(datetime.now().date() - patient.birth_date).days // 365,
            gender="Female" if patient.gender == "Ж" else "Male",
            bloodType=patient.blood_type,
            doctor_id=patient.doctor_id,
            condition=patient.condition,
        )


async def get_patient_full_details(
    patientId: int,
) -> Optional[PatientFullDetailsSchema]:
    patient = await get_patient(patientId)

    transcriptions = await get_transcriptions(patientId)
    medical_record = await get_medical_record(patientId)

    return PatientFullDetailsSchema(
        patient=patient,
        transcripts=transcriptions,
        record=medical_record,
    )


async def put_medical_record(
    patientId: int, response: MedicalRecordSchema
) -> tuple[int, str | MedicalRecordSchema]:
    async with async_session() as session:
        try:
            # UPDATE
            await session.execute(
                update(MedicalRecord)
                .where(MedicalRecord.patient_id == patientId)
                .values(
                    complaints=response.complaints,
                    symptoms=response.symptoms,
                    temperature=response.temperature,
                    blood_pressure={
                        "systolic": response.blood_pressure.systolic,
                        "diastolic": response.blood_pressure.diastolic,
                    },
                    diagnosis=response.diagnosis,
                    treatment=response.treatment,
                    notes=response.notes,
                )
            )

            await session.commit()

            # SELECT обновленной записи
            result = await session.execute(
                select(MedicalRecord).where(MedicalRecord.patient_id == patientId)
            )

            medical_record = result.scalar_one_or_none()

            if not medical_record:
                return 404, "Medical record not found"

            # ORM -> Pydantic schema
            return 200, MedicalRecordSchema.model_validate(medical_record)

        except Exception as e:
            return 404, f"Error updating medical record: {e}"
