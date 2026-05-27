import asyncio
from datetime import datetime
from pathlib import Path
import json
from sqlalchemy import (
    BigInteger,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    func,
    ForeignKey,
    Date,
)
from sqlalchemy.orm import DeclarativeBase, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.ext.asyncio import create_async_engine, AsyncAttrs, async_sessionmaker

# Создаем путь к базе данных
engine = create_async_engine(
    url=f"sqlite+aiosqlite:///{Path(__file__).resolve().parent / "db.sqlite3"}",
    json_serializer=lambda obj: json.dumps(
        obj,
        ensure_ascii=False,
    ),
    future=True,
    echo=False,
)
async_session = async_sessionmaker(engine)


class Base(AsyncAttrs, DeclarativeBase):
    pass


class Doctor(Base):
    __tablename__ = "doctors"

    id = mapped_column(Integer, primary_key=True, autoincrement=True)
    full_name = mapped_column(String(255))
    email = mapped_column(String(255), unique=True)
    password_hash = mapped_column(Text, nullable=True)
    specialization = mapped_column(String(255), nullable=True)
    avatar_url = mapped_column(Text, nullable=True)

    # RELATIONSHIPS

    patients = relationship(
        "Patient",
        back_populates="doctor",
        cascade="all, delete-orphan",
    )

    medical_records = relationship(
        "MedicalRecord",
        back_populates="doctor",
        cascade="all, delete-orphan",
    )


class Patient(Base):
    __tablename__ = "patients"

    id = mapped_column(Integer, primary_key=True, autoincrement=True)
    doctor_id = mapped_column(ForeignKey("doctors.id"))
    full_name = mapped_column(String(255))
    birth_date = mapped_column(Date, nullable=True)
    gender = mapped_column(String(2), nullable=True)
    blood_type = mapped_column(String(10), nullable=True)
    condition = mapped_column(Text, nullable=True)
    # RELATIONSHIPS

    doctor = relationship(
        "Doctor",
        back_populates="patients",
    )

    transcripts = relationship(
        "Transcript",
        back_populates="patient",
        cascade="all, delete-orphan",
    )

    medical_records = relationship(
        "MedicalRecord",
        back_populates="patient",
        cascade="all, delete-orphan",
    )


class Transcript(Base):
    __tablename__ = "transcripts"

    id = mapped_column(Integer, primary_key=True, autoincrement=True)
    patient_id = mapped_column(ForeignKey("patients.id"))
    text = mapped_column(Text)
    created_at = mapped_column(DateTime, server_default=func.now())

    # RELATIONSHIPS

    patient = relationship(
        "Patient",
        back_populates="transcripts",
    )


class MedicalRecord(Base):

    __tablename__ = "medical_records"

    id = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    patient_id = mapped_column(ForeignKey("patients.id"))
    doctor_id = mapped_column(ForeignKey("doctors.id"))
    complaints = mapped_column(JSON, nullable=True)
    symptoms = mapped_column(JSON, nullable=True)
    diagnosis = mapped_column(JSON, nullable=True)
    treatment = mapped_column(JSON, nullable=True)
    blood_pressure = mapped_column(JSON, nullable=True)
    temperature = mapped_column(Float, nullable=True)
    notes = mapped_column(Text, nullable=True)
    created_at = mapped_column(DateTime, default=func.datetime("now", "localtime"))
    updated_at = mapped_column(
        DateTime,
        default=func.datetime("now", "localtime"),
        onupdate=func.datetime("now", "localtime"),
    )

    # RELATIONSHIPS

    patient = relationship(
        "Patient",
        back_populates="medical_records",
    )

    doctor = relationship(
        "Doctor",
        back_populates="medical_records",
    )


async def async_main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


if __name__ == "__main__":
    asyncio.run(async_main())
