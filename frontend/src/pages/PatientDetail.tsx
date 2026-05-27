import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Mic,
  Loader2,
  FileText,
  Info,
  Activity,
  AlertCircle,
  Play,
  Pause,
  X,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { cn } from "../lib/utils";
import {
  updatePatientRecord,
  getPatientFullDetails,
  uploadPatientRecording,
  PatientDetailsData,
  PatientRecord,
  API_BASE_URL,
  getApiKey,
} from "../api";

interface PatientDetailProps {
  patientId: number;
  onBack: () => void;
}

type RecordingState = "idle" | "recording" | "processing" | "done";

export default function PatientDetail({
  patientId,
  onBack,
}: PatientDetailProps) {
  const [data, setData] = useState<PatientDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recState, setRecState] = useState<RecordingState>("idle");
  const [processingStep, setProcessingStep] = useState<string | null>(null);

  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const audioChunksRef = useRef<BlobPart[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<AbortController | null>(null);
  const isSseConnectedRef = useRef<boolean>(false);

  const transcripts =
    data?.transcripts.map((t) => ({
      id: t.id?.toString() || Date.now().toString(),
      type: t.text === "" ? ("processing" as const) : ("text" as const),
      text: t.text,
      timestamp: t.timestamp,
    })) || [];
  const patient = data?.patient;
  const originalRecord = data?.record;
  const [editedRecord, setEditedRecord] = useState<PatientRecord | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [savingMsg, setSavingMsg] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (data?.record) {
      setEditedRecord(JSON.parse(JSON.stringify(data.record)));
    }
  }, [data?.record]);

  const handleArrayRemove = (field: keyof PatientRecord, index: number) => {
    if (!editedRecord) return;
    const newArray = [...(editedRecord[field] as string[])];
    newArray.splice(index, 1);
    setEditedRecord({ ...editedRecord, [field]: newArray });
    setHasChanges(true);
  };

  const handleArrayAdd = (field: keyof PatientRecord, value: string) => {
    if (!editedRecord || !value.trim()) return;
    const newArray = [
      ...((editedRecord[field] as string[]) || []),
      value.trim(),
    ];
    setEditedRecord({ ...editedRecord, [field]: newArray });
    setHasChanges(true);
  };

  const handleSaveRecord = async () => {
    // Если нет записи ИЛИ нет пациента — прерываем выполнение
    if (!editedRecord || !patient) return;

    setSavingMsg(true);
    try {
      const saved = await updatePatientRecord(
        patient.id?.toString() || patientId?.toString() || "", // <-- Теперь здесь не будет ошибки
        editedRecord,
      );
      setData((prev) => (prev ? { ...prev, record: saved } : null));
      setHasChanges(false);
    } catch (err) {
      console.error(err);
      setToastMsg(
        "Не удалось сохранить изменения. Сервер вернул ошибку, попробуйте еще раз.",
      );
      setTimeout(() => setToastMsg(null), 4000);
    }
    setSavingMsg(false);
  };

  const cancelChanges = () => {
    if (originalRecord) {
      setEditedRecord(JSON.parse(JSON.stringify(originalRecord)));
    } else {
      setEditedRecord(null);
    }
    setHasChanges(false);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const getProcessingText = (step: string | null) => {
    switch (step) {
      case "queue":
        return "Ожидает очереди...";
      case "cpu_whisper":
        return "Анализирует аудиозапись...";
      case "io_llm":
        return "Заполнение медицинских таблиц...";
      default:
        return "Анализирует аудиозапись...";
    }
  };

  useEffect(() => {
    return () => {
      if (sseRef.current) {
        sseRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (patientId == null) return;
    getPatientFullDetails(patientId?.toString() || "")
      .then((res) => {
        setData(res);
        if (res.active_analysis_task) {
          connectToSse(res.active_analysis_task);
        } else if (res.record) {
          setRecState("done");
        }
      })
      .catch((err) => {
        console.error(err);
        setToastMsg("Не удалось загрузить данные пациента");
        setTimeout(() => setToastMsg(null), 4000);
      })
      .finally(() => setLoading(false));
  }, [patientId]);

  useEffect(() => {
    if (
      recState === "recording" ||
      recState === "processing" ||
      transcripts.length > 0
    ) {
      scrollToBottom();
    }
  }, [recState, transcripts.length]);

  const toggleRecording = async () => {
    if (recState === "idle" || recState === "done") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          // Send as MP3 mimetype to satisfy the backend, even though it's likely webm container from browser
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/mp3",
          });
          audioChunksRef.current = [];

          // Stop all mic tracks
          stream.getTracks().forEach((track) => track.stop());

          sendRecording(audioBlob);
        };

        audioChunksRef.current = [];
        setRecState("recording");
        recorder.start();
        setMediaRecorder(recorder);
      } catch (err) {
        console.error("Microphone access denied or error:", err);
        setToastMsg(
          "Не удалось получить доступ к микрофону. Разрешите доступ в настройках браузера.",
        );
        setTimeout(() => setToastMsg(null), 4000);
      }
    } else if (recState === "recording") {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        setRecState("processing");
        mediaRecorder.stop();
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.onstop = () => {
        audioChunksRef.current = [];
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
        setRecState(originalRecord ? "done" : "idle");
      };
      mediaRecorder.stop();
    } else {
      setRecState(originalRecord ? "done" : "idle");
    }
  };

  const connectToSse = (taskId: string, tempTranscriptId?: string) => {
    if (isSseConnectedRef.current && processingStep !== null) return;

    setRecState("processing");
    setProcessingStep("queue");
    isSseConnectedRef.current = true;

    if (sseRef.current) {
      sseRef.current.abort();
    }
    const ctrl = new AbortController();
    sseRef.current = ctrl;

    let tId = tempTranscriptId;
    if (!tId) {
      tId = Date.now().toString();
      setData((prev) =>
        prev
          ? {
              ...prev,
              transcripts: [
                ...prev.transcripts,
                { id: parseInt(tId!), text: "", timestamp: "" },
              ],
            }
          : null,
      );
      scrollToBottom();
    }

    fetchEventSource(`${API_BASE_URL}/stream/task/${taskId}`, {
      signal: ctrl.signal,
      headers: {
        "x-api-key": getApiKey(),
        "ngrok-skip-browser-warning": "true",
        Accept: "text/event-stream",
      },
      async onopen(response) {
        console.log("[SSE] Connection opened with status:", response.status);
      },
      onmessage(ev) {
        console.log("[SSE] Message received:", ev.data);
        try {
          const data = JSON.parse(ev.data);

          if (data.status === "Error") {
            setToastMsg(data.message || "Ошибка обработки");
            setTimeout(() => setToastMsg(null), 4000);
            setRecState("idle");
            setProcessingStep(null);
            isSseConnectedRef.current = false;
            setData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                transcripts: prev.transcripts.filter(
                  (t) => t.id?.toString() !== tId,
                ),
              };
            });
            throw new Error("SSE Error stop");
          }

          if (data.step) {
            setProcessingStep(data.step);
          }

          if (data.status === "Success" && data.step === "completed") {
            setData((prev) => {
              if (!prev) return prev;
              const result = data.result || {};
              const cleanedTranscripts = prev.transcripts.filter(
                (t) => t.id?.toString() !== tId,
              );

              // If the backend returns the full array of transcripts
              const newTranscripts = Array.isArray(result.transcripts)
                ? result.transcripts
                : [
                    ...cleanedTranscripts,
                    {
                      id: result.transcripts?.id || Date.now(),
                      text: result.transcripts?.text || "Запись",
                      timestamp:
                        result.transcripts?.timestamp ||
                        new Date().toISOString(),
                    },
                  ];

              return {
                ...prev,
                transcripts: newTranscripts,
                record: result.record || prev.record,
                active_analysis_task: null,
              };
            });
            setRecState("done");
            setProcessingStep(null);
            isSseConnectedRef.current = false;
            throw new Error("SSE Done");
          }
        } catch (e: any) {
          if (e?.message === "SSE Error stop" || e?.message === "SSE Done") {
            throw e;
          }
        }
      },
      onerror(err) {
        if (err?.message === "SSE Error stop" || err?.message === "SSE Done") {
          throw err;
        }
        console.error("SSE connection error", err);
        isSseConnectedRef.current = false;
        throw err;
      },
    }).catch((err) => {
      if (
        err?.message !== "SSE Error stop" &&
        err?.message !== "SSE Done" &&
        err?.name !== "AbortError"
      ) {
        console.error("Fetch Event Source Error", err);
        setToastMsg("Ошибка подключения к серверу (SSE).");
        setTimeout(() => setToastMsg(null), 4000);
        setRecState("idle");
        setProcessingStep(null);
        isSseConnectedRef.current = false;
        setData((prev) =>
          prev
            ? {
                ...prev,
                transcripts: prev.transcripts.filter(
                  (t) => t.id?.toString() !== tId,
                ),
              }
            : null,
        );
      }
    });
  };

  const sendRecording = (audioBlob: Blob) => {
    // Create a temporary processing message
    const tempId = Date.now().toString();
    setData((prev) =>
      prev
        ? {
            ...prev,
            transcripts: [
              ...prev.transcripts,
              { id: parseInt(tempId), text: "", timestamp: "" },
            ],
          }
        : null,
    );

    scrollToBottom();
    setRecState("processing");
    setProcessingStep("queue");

    uploadPatientRecording(patientId?.toString() || "", audioBlob)
      .then((response) => {
        if (response.task_id) {
          connectToSse(response.task_id, tempId);
        } else {
          throw new Error("No task id");
        }
      })
      .catch((err) => {
        console.error("Upload failed", err);
        setToastMsg("Не удалось загрузить аудио на сервер. Попробуйте снова.");
        setTimeout(() => setToastMsg(null), 4000);
        setRecState("idle"); // Reset on failure
        setProcessingStep(null);
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            transcripts: prev.transcripts.filter(
              (t) => t.id?.toString() !== tempId,
            ), // Remove loading state
          };
        });
      });
  };

  if (loading || !patient) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // To match UI
  const processingTempIds = transcripts
    .filter((t) => t.text === "")
    .map((t) => t.id);

  return (
    <div className="flex flex-col gap-2 animate-in slide-in-from-right-4 duration-500 flex-1 min-h-0 h-full max-h-full overflow-hidden w-full max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />{" "}
          <span className="hidden sm:inline">Назад к списку</span>
          <span className="sm:hidden">Назад</span>
        </button>
        <div className="flex items-center h-10 overflow-visible relative justify-end">
          <AnimatePresence mode="popLayout" initial={false}>
            {!hasChanges ? (
              <motion.div
                key="saved-state"
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-[12px] font-medium text-[13px] border border-emerald-100/50 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Синхронизировано
              </motion.div>
            ) : (
              <motion.div
                key="actions-state"
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="flex items-center gap-3"
              >
                <button
                  onClick={cancelChanges}
                  disabled={savingMsg}
                  className="px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm bg-slate-100/80 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveRecord}
                  disabled={savingMsg}
                  className="px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-sm flex items-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md disabled:opacity-75 focus:ring-4 focus:ring-emerald-500/20 outline-none"
                >
                  {savingMsg && <Loader2 className="w-4 h-4 animate-spin" />}
                  Сохранить изменения
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,66%)_minmax(0,34%)] xl:grid-cols-[minmax(0,66%)_minmax(0,34%)] gap-3 flex-1 min-h-0">
        {/* Left Column - Main Content Workspace */}
        <div className="flex flex-col order-2 lg:order-1 h-full min-h-0">
          <div className="bg-white rounded-[20px] overflow-hidden border border-slate-200/60 shadow-sm flex-1">
            <div className="p-3 bg-white h-full flex flex-col">
              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                <Section title="Жалобы пациента" icon={AlertCircle}>
                  {editedRecord ? (
                    <EditableList
                      items={editedRecord.complaints}
                      onRemove={(i: number) =>
                        handleArrayRemove("complaints", i)
                      }
                      onAdd={(v: string) => handleArrayAdd("complaints", v)}
                      placeholder="Добавить жалобу..."
                    />
                  ) : (
                    <p className="text-slate-400 text-sm italic">
                      Поля будут заполнены автоматически...
                    </p>
                  )}
                </Section>

                <hr className="border-slate-50" />

                <Section title="Симптомы" icon={Info}>
                  {editedRecord ? (
                    <EditableList
                      items={editedRecord.symptoms}
                      onRemove={(i: number) => handleArrayRemove("symptoms", i)}
                      onAdd={(v: string) => handleArrayAdd("symptoms", v)}
                      placeholder="Добавить симптом..."
                    />
                  ) : (
                    <p className="text-slate-400 text-sm italic">
                      Поля будут заполнены автоматически...
                    </p>
                  )}
                </Section>

                <hr className="border-slate-50" />

                <div className="flex flex-col xl:flex-row gap-4">
                  <div className="flex-1 min-w-0">
                    <Section title="Показатели" icon={Activity}>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3.5 rounded-[12px] bg-slate-50 border border-slate-100/60 shadow-sm">
                          <span className="text-slate-500 text-[11px] uppercase tracking-widest font-bold">
                            Давление
                          </span>
                          {editedRecord ? (
                            <div className="flex items-center gap-1 font-bold text-slate-900">
                              <input
                                type="number"
                                value={
                                  editedRecord.blood_pressure?.systolic || ""
                                }
                                onChange={(e) => {
                                  setEditedRecord({
                                    ...editedRecord,
                                    blood_pressure: {
                                      ...editedRecord.blood_pressure,
                                      systolic:
                                        parseInt(e.target.value) || null,
                                      diastolic:
                                        editedRecord.blood_pressure
                                          ?.diastolic || null,
                                    },
                                  });
                                  setHasChanges(true);
                                }}
                                className="w-10 text-right bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none"
                              />
                              /
                              <input
                                type="number"
                                value={
                                  editedRecord.blood_pressure?.diastolic || ""
                                }
                                onChange={(e) => {
                                  setEditedRecord({
                                    ...editedRecord,
                                    blood_pressure: {
                                      ...editedRecord.blood_pressure,
                                      diastolic:
                                        parseInt(e.target.value) || null,
                                      systolic:
                                        editedRecord.blood_pressure?.systolic ||
                                        null,
                                    },
                                  });
                                  setHasChanges(true);
                                }}
                                className="w-10 text-left bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none"
                              />
                            </div>
                          ) : (
                            <span className="font-bold text-slate-300">
                              —/—
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center p-3.5 rounded-[12px] bg-slate-50 border border-slate-100/60 shadow-sm">
                          <span className="text-slate-500 text-[11px] uppercase tracking-widest font-bold">
                            Температура
                          </span>
                          {editedRecord ? (
                            <div className="flex items-center gap-1 font-bold text-slate-900">
                              <input
                                type="number"
                                step="0.1"
                                value={editedRecord.temperature || ""}
                                onChange={(e) => {
                                  setEditedRecord({
                                    ...editedRecord,
                                    temperature:
                                      parseFloat(e.target.value) || null,
                                  });
                                  setHasChanges(true);
                                }}
                                className="w-14 text-right bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none"
                              />
                              °C
                            </div>
                          ) : (
                            <span className="font-bold text-slate-300">—</span>
                          )}
                        </div>
                      </div>
                    </Section>
                  </div>

                  <div className="flex-1 min-w-0">
                    <Section title="Диагноз" icon={FileText}>
                      <div
                        className={cn(
                          "p-4 rounded-[12px] h-full shadow-sm w-full min-w-0",
                          editedRecord
                            ? "bg-blue-50/50 border border-blue-100"
                            : "flex items-center justify-start bg-slate-50 border border-slate-100/60",
                        )}
                      >
                        {editedRecord ? (
                          <EditableList
                            items={editedRecord.diagnosis}
                            onRemove={(i: number) =>
                              handleArrayRemove("diagnosis", i)
                            }
                            onAdd={(v: string) =>
                              handleArrayAdd("diagnosis", v)
                            }
                            placeholder="Добавить диагноз..."
                          />
                        ) : (
                          <p className="text-slate-400 text-sm italic w-full text-left">
                            Диагноз не поставлен...
                          </p>
                        )}
                      </div>
                    </Section>
                  </div>
                </div>

                <hr className="border-slate-50" />

                <Section title="Назначения и Медикаменты" icon={Info}>
                  {editedRecord ? (
                    <EditableList
                      items={editedRecord.treatment}
                      onRemove={(i: number) =>
                        handleArrayRemove("treatment", i)
                      }
                      onAdd={(v: string) => handleArrayAdd("treatment", v)}
                      placeholder="Добавить назначение..."
                    />
                  ) : (
                    <p className="text-slate-400 text-sm italic">
                      Поля будут заполнены автоматически...
                    </p>
                  )}
                </Section>

                <hr className="border-slate-50" />

                <Section title="Заметки" icon={FileText}>
                  {editedRecord ? (
                    <textarea
                      value={editedRecord.notes || ""}
                      onChange={(e) => {
                        setEditedRecord({
                          ...editedRecord,
                          notes: e.target.value,
                        });
                        setHasChanges(true);
                      }}
                      className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 min-h-[40px] resize-none focus:outline-none focus:border-blue-500 transition-colors"
                      rows={2}
                      placeholder="Текст заметки..."
                    />
                  ) : (
                    <p className="text-slate-400 text-sm italic">
                      Поля будут заполнены автоматически...
                    </p>
                  )}
                </Section>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Patient Info & Recording Control */}
        <div className="flex flex-col gap-3 order-1 lg:order-2 h-full min-h-0">
          {/* Patient Card */}
          <div className="bg-white rounded-[20px] p-3 border border-slate-200/60 shadow-sm shrink-0">
            <div className="flex justify-between items-start mb-1">
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">
                Активный прием
              </span>
              <span className="text-[11px] text-slate-400">
                ID: #{patient.id}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-0.5 mt-2">
              {patient.name}
            </h2>
            <p className="text-xs text-slate-500 mb-2">
              {patient.age} лет •{" "}
              {patient.gender === "Female" ? "Женщина" : "Мужчина"} • Группа{" "}
              {patient.bloodType}
            </p>
            <div className="space-y-1.5 border-t border-slate-100 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Лечащий врач:</span>
                <span className="font-medium text-slate-800">
                  Врач ID: {patient.doctor_id}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Цель визита:</span>
                <span className="font-medium text-amber-600 truncate max-w-[150px] text-right">
                  {patient.condition}
                </span>
              </div>
            </div>
          </div>

          {/* Recording Control */}
          <div className="bg-white rounded-[20px] p-3 border border-slate-200/60 shadow-xl flex flex-col flex-1 min-h-0 relative overflow-hidden">
            {/* Transcript History */}
            <div className="flex-1 overflow-y-auto mb-2 space-y-2 pr-1 flex flex-col scrollbar-thin scrollbar-thumb-slate-200">
              {transcripts.length === 0 && recState !== "recording" && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-50 m-auto">
                  <Mic className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-slate-500 text-sm">
                    История пуста.
                    <br />
                    Нажмите кнопку для начала записи.
                  </p>
                </div>
              )}

              {transcripts.map((msg) => (
                <div key={msg.id} className="flex flex-col items-end">
                  {msg.text !== "" ? (
                    <div className="flex flex-col items-end">
                      <div className="bg-blue-600 text-white p-3.5 rounded-2xl rounded-tr-sm text-[15px] shadow-sm max-w-[90%] leading-snug whitespace-pre-wrap break-words">
                        {msg.text}
                      </div>
                      {msg.timestamp && (
                        <span className="text-[10px] text-slate-400 mt-1 mr-1 font-medium">
                          {new Date(msg.timestamp).toLocaleTimeString("ru-RU", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-100 text-slate-500 p-3.5 rounded-2xl rounded-tr-sm text-sm shadow-sm max-w-[90%] flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      <span className="font-medium animate-pulse">
                        {getProcessingText(processingStep)}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {recState === "recording" && (
                <div className="flex justify-end mt-auto pt-4">
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3.5 rounded-2xl rounded-tr-sm text-sm max-w-[90%] flex items-center gap-3 shadow-[0_4px_12px_rgba(244,63,94,0.1)]">
                    <div className="flex items-center gap-1.5 h-full">
                      <span className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" />
                      <span
                        className="w-2 h-2 bg-rose-500 rounded-full animate-bounce"
                        style={{ animationDelay: "100ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-rose-500 rounded-full animate-bounce"
                        style={{ animationDelay: "200ms" }}
                      />
                    </div>
                    <span className="font-medium">Идет запись...</span>
                  </div>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </div>

            {/* Record Button Action Menu */}
            <div className="pt-4 border-t border-slate-100/60 shrink-0">
              {recState === "recording" ? (
                <div className="flex gap-3">
                  <button
                    onClick={cancelRecording}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[15px] transition-all bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={toggleRecording}
                    className="flex-[2] flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-[15px] transition-all relative overflow-hidden group bg-rose-100 text-rose-600 hover:bg-rose-200"
                  >
                    <div className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
                    </div>
                    <span>Завершить запись</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={toggleRecording}
                  disabled={recState === "processing"}
                  className={cn(
                    "flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-[15px] transition-all relative overflow-hidden group bg-blue-600 text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.4)]",
                    recState === "processing"
                      ? "opacity-60 cursor-wait"
                      : "hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_rgba(37,99,235,0.5)]",
                  )}
                >
                  <Mic className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span>
                    {transcripts.length > 0
                      ? "Сделать новую запись"
                      : "Начать запись"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 text-white rounded-[16px] shadow-xl border border-slate-700/50"
          >
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span className="font-medium text-[15px]">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helpers
function EditableList({
  items,
  onRemove,
  onAdd,
  placeholder = "Добавить...",
}: any) {
  const [newItem, setNewItem] = useState("");
  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <div className="flex flex-wrap gap-2">
        {items?.map((item: string, i: number) => (
          <Tag key={i} className="flex items-center gap-1.5 pr-2">
            {item}
            <button
              onClick={() => onRemove(i)}
              className="text-slate-400 hover:text-rose-500 rounded-full hover:bg-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </Tag>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onAdd(newItem);
              setNewItem("");
            }
          }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
          placeholder={placeholder}
        />
        <button
          onClick={() => {
            onAdd(newItem);
            setNewItem("");
          }}
          className="bg-slate-100 p-2 rounded-lg hover:bg-blue-50 flex items-center justify-center hover:text-blue-600 text-slate-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: any) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-blue-600">
        <Icon className="w-[18px] h-[18px]" strokeWidth={2.5} />
        <h4 className="font-bold text-[13px] uppercase tracking-widest">
          {title}
        </h4>
      </div>
      <div className="pl-[26px]">{children}</div>
    </div>
  );
}

function Tag({
  children,
  ...props
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cn(
        "px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium",
        props.className,
      )}
    >
      {children}
    </span>
  );
}

function CheckCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
