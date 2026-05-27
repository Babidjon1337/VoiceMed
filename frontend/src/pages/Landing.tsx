import React, { useState } from "react";
import {
  Mic,
  ArrowRight,
  ShieldCheck,
  Clock,
  Zap,
  FileJson,
  User,
  ClipboardList,
  Stethoscope,
  PlusCircle,
  Pill,
  CheckSquare,
  Building2,
  Users,
  Building,
  FileText,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const faqs = [
  {
    question: "Как обеспечивается безопасность данных пациентов?",
    answer:
      "Мы используем локальный (On-Premise) ИИ-инструмент, который работает без интернета. Все данные пациентов остаются и хранятся исключительно во внутреннем контуре вашей больницы или клиники, что обеспечивает 100% юридическую безопасность и соблюдение местного законодательства.",
  },
  {
    question: "Насколько точно ИИ распознает сложные медицинские термины?",
    answer:
      "Точность распознавания превышает 95%. Наша языковая модель специально дообучена на огромном корпусе реальной медицинской документации (истории болезней, клинические протоколы, МКБ-10). Она уверенно понимает узкоспециализированные термины, названия препаратов и специфическую лексику.",
  },
  {
    question: "Как система интегрируется с нашей текущей МИС?",
    answer:
      "ГолосМед легко встраивается в любую существующую медицинскую информационную систему (МИС) через современный и безопасный REST API. Врачу нужно всего лишь нажать кнопку «Запись» прямо в привычном интерфейсе МИС.",
  },
  {
    question: "Может ли врач внести правки перед сохранением данных?",
    answer:
      "Безусловно. Перед окончательным сохранением в электронную карту, врач видит полностью структурированный текст. Он может внести любые правки, голосом отдать команду «Отмена» или подтвердить действие командой «Сохранить».",
  },
];

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200 overflow-x-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-[600px] overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full bg-blue-100/40 blur-3xl opacity-80" />
        <div className="absolute top-20 -left-20 w-[600px] h-[600px] rounded-full bg-blue-50/40 blur-3xl opacity-80" />
      </div>

      <header className="px-4 sm:px-6 lg:px-12 min-h-24 py-4 flex items-center justify-between mx-auto max-w-7xl relative z-50">
        <div className="flex items-center gap-2 relative h-[60px] sm:h-[80px] z-10">
          <img
            src="/Logo.png"
            alt="ГолосМед Logo"
            className="w-[180px] sm:w-[278px] h-auto object-contain absolute top-1/2 -translate-y-1/2 left-0 pointer-events-none mt-2 sm:mt-[15px]"
          />
          <div className="w-[150px] sm:w-[240px]" />{" "}
          {/* Spacer for absolute logo */}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 bg-white/40 backdrop-blur-md px-8 py-4 rounded-[2rem] border border-white/60 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)]">
          <a
            href="#features"
            onClick={(e) => scrollToSection(e, "features")}
            className="text-[15px] font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            Возможности
          </a>
          <a
            href="#doctors"
            onClick={(e) => scrollToSection(e, "doctors")}
            className="text-[15px] font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            Для врачей
          </a>
          <a
            href="#pricing"
            onClick={(e) => scrollToSection(e, "pricing")}
            className="text-[15px] font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            Тарифы
          </a>
          <a
            href="#faq"
            onClick={(e) => scrollToSection(e, "faq")}
            className="text-[15px] font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-xl p-2.5 rounded-[2.5rem] border border-white shadow-[0_8px_24px_-10px_rgba(0,0,0,0.08)] z-10">
          <button className="text-[17px] font-bold text-slate-700 hover:text-blue-700 px-6 h-[56px] rounded-full hover:bg-white hover:shadow-sm transition-all hidden sm:block">
            Войти
          </button>
          <button
            onClick={onStart}
            className="text-[17px] font-bold bg-slate-900 text-white rounded-full shadow-[0_4px_12px_-4px_rgba(0,0,0,0.3)] hover:bg-blue-600 hover:shadow-[0_8px_20px_-6px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 transition-all duration-300 px-8 h-[56px]"
          >
            Демо
          </button>
        </div>
      </header>

      <main className="pb-20 relative">
        {/* Hero Section */}
        <div className="relative pt-4 sm:pt-8 lg:pt-16 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Hero Wrapper */}
          <div className="relative w-full overflow-visible flex flex-col">
            <div className="relative z-10 w-full max-w-7xl mx-auto lg:px-6 pt-6 pb-12 lg:py-0">
              {/* Doctor Background Card */}
              <div className="absolute inset-y-0 left-0 right-0 z-0 rounded-[2.5rem] lg:rounded-[3.5rem] border-[1.5px] border-blue-200/50 shadow-[0_0_40px_-5px_rgba(0,0,0,0.05)] overflow-hidden bg-white/40 backdrop-blur-md pointer-events-none">
                <img
                  src="/Hero.png"
                  alt="Doctor"
                  className="w-full h-full object-cover object-[65%_top] lg:object-[20%_10%] opacity-100 hero-mask"
                />
              </div>

              <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-16 items-center min-h-[500px] lg:min-h-[600px] relative z-10">
                {/* Left Column */}
                <div className="flex flex-col items-start z-10 pt-10 pb-10 px-4 sm:px-8 lg:px-12">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[13px] font-semibold mb-6">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    AI Healthcare Preview
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-[4.5rem] font-bold tracking-tight text-slate-900 leading-[1.05] mb-6">
                    Говорите. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">
                      Мы запишем.
                    </span>
                  </h1>

                  <p className="text-[17px] text-slate-600 mb-10 max-w-[420px] leading-relaxed font-medium">
                    Автоматическое преобразование речи врача в структурированную
                    медицинскую запись пациента. Быстро. Приватно. Точно.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button
                      onClick={onStart}
                      className="bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 px-8 py-4 rounded-full shadow-[0_8px_20px_-6px_rgba(37,99,235,0.6)] hover:bg-blue-700 hover:shadow-[0_12px_24px_-6px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 transition-all w-full sm:w-auto text-[15px]"
                    >
                      Попробовать демо <ArrowRight className="w-5 h-5" />
                    </button>
                    <button className="bg-white/80 backdrop-blur-md text-slate-800 font-semibold flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-slate-200 hover:bg-white transition-all shadow-sm w-full sm:w-auto text-[15px]">
                      Смотреть интерфейс
                    </button>
                  </div>
                </div>

                {/* Right Column / Visual */}
                <div className="flex justify-center items-center w-full relative h-[450px] lg:h-[550px] z-20">
                  {/* Floating Glass Component */}
                  <div
                    className="relative w-full max-w-[320px] sm:max-w-[340px] translate-y-8 sm:translate-y-16 lg:translate-x-20 z-20 xl:ml-16 px-4 sm:px-0"
                    style={{ perspective: "1200px" }}
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 6,
                        ease: "easeInOut",
                      }}
                      className="w-full bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/70 shadow-[0_32px_80px_-12px_rgba(14,165,233,0.3),inset_0_1px_1px_rgba(255,255,255,1)] p-4 flex flex-col gap-3.5"
                      style={{
                        rotateY: -12,
                        rotateX: 6,
                        transformStyle: "preserve-3d",
                      }}
                    >
                      <div className="flex items-center justify-between px-2 pt-1 pb-1">
                        <div className="text-[#1e293b] font-bold text-[17px] tracking-tight drop-shadow-sm">
                          Запись из речи
                        </div>
                        <div className="bg-blue-100/90 text-blue-600 px-4 py-1.5 rounded-full text-[13px] font-bold tracking-wide shadow-sm">
                          Готово
                        </div>
                      </div>

                      <div className="bg-white/85 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-4 shadow-[#0000000a_0_4px_16px,inset_#ffffff_0_1px_1px] border border-white/80">
                        <div className="flex items-start gap-3">
                          <User
                            className="w-[16px] h-[16px] mt-0.5 text-blue-500 shrink-0"
                            strokeWidth={2.5}
                          />
                          <div>
                            <h4 className="font-bold text-slate-800 text-[12px] mb-0.5">
                              Жалобы
                            </h4>
                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                              Кашель, температура 38.2°C, слабость
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <ClipboardList
                            className="w-[16px] h-[16px] mt-0.5 text-blue-500 shrink-0"
                            strokeWidth={2.5}
                          />
                          <div>
                            <h4 className="font-bold text-slate-800 text-[12px] mb-0.5">
                              Анамнез
                            </h4>
                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                              Болеет 3 дня. Контактов с инфекционными больными
                              нет.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Stethoscope
                            className="w-[16px] h-[16px] mt-0.5 text-blue-500 shrink-0"
                            strokeWidth={2.5}
                          />
                          <div>
                            <h4 className="font-bold text-slate-800 text-[12px] mb-0.5">
                              Объективно
                            </h4>
                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                              АД 130/90 мм рт. ст., ЧСС 88 уд/мин, SpO₂ 98%
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <PlusCircle
                            className="w-[16px] h-[16px] mt-0.5 text-blue-500 shrink-0"
                            strokeWidth={2.5}
                          />
                          <div>
                            <h4 className="font-bold text-slate-800 text-[12px] mb-0.5">
                              Диагноз
                            </h4>
                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                              ОРВИ
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Pill
                            className="w-[16px] h-[16px] mt-0.5 text-blue-500 shrink-0"
                            strokeWidth={2.5}
                          />
                          <div>
                            <h4 className="font-bold text-slate-800 text-[12px] mb-0.5">
                              Назначения
                            </h4>
                            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                              Ингаляции 2 раза в день, обильное питье, отдых
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          id="features"
          className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 mt-12 lg:mt-16"
        >
          {/* Benefits Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {[
              {
                icon: Clock,
                title: "Экономия времени",
                desc: "Автоматическое заполнение карт экономит до 2 часов в день.",
              },
              {
                icon: Zap,
                title: "95% точность",
                desc: "Медицинская AI модель понимает сложную терминологию.",
              },
              {
                icon: ShieldCheck,
                title: "Безопасность",
                desc: "Запись только по нажатию кнопки. Данные полностью анонимизированы.",
              },
              {
                icon: FileJson,
                title: "Структуризация",
                desc: "Генерация чистого JSON-формата для мгновенного экспорта в МИС.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-sm p-6 transition-all hover:-translate-y-1 hover:shadow-lg group z-10 relative"
              >
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Doctors Convenience */}
        <div
          id="doctors"
          className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 mt-20 lg:mt-24"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Создано для удобства врачей
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              Автоматизация рутины, которая адаптируется под ваши привычки и
              экономит время на пациентах.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: "Понимает термины",
                desc: "Не нужно учить систему — она знает МКБ, названия лекарств, жалобы и клинические протоколы.",
              },
              {
                icon: Mic,
                title: "Управляется голосом",
                desc: "«Сохранить», «Отмена», «К назначениям» — управляйте интерфейсом без мыши и клавиатуры.",
              },
              {
                icon: CheckSquare,
                title: "Контролирует полноту",
                desc: "Умный помощник напомнит, если вы забыли указать важный симптом, точный диагноз или дату.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div
          id="pricing"
          className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 mt-20 lg:mt-28 mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Гибкие тарифы
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              Доступно для всех: от частных специалистов до государственных
              клиник с особыми требованиями.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch pt-4 lg:pt-8 w-full max-w-5xl mx-auto lg:max-w-none">
            {/* 1. Solo */}
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col relative overflow-hidden">
              <div className="mb-6">
                <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  Для частных врачей
                </h3>
                <div className="text-sm text-emerald-600 font-bold mb-4">
                  B2B Solo
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2 whitespace-nowrap">
                  1 500 – 4 000 ₽{" "}
                  <span className="text-lg text-slate-500 font-medium">
                    / мес
                  </span>
                </div>
                <p className="text-slate-600 text-sm font-medium">
                  Идеально для индивидуальной практики и самозанятых врачей.
                </p>
              </div>
              <div className="mt-auto pt-6 border-t border-slate-100">
                <button className="w-full py-3 px-4 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors">
                  Выбрать тариф
                </button>
              </div>
            </div>

            {/* 2. Clinics */}
            <div className="bg-blue-600 rounded-[2rem] border border-blue-500 p-8 shadow-xl shadow-blue-900/10 flex flex-col relative overflow-hidden transform lg:-translate-y-4">
              <div className="mb-6 relative z-10">
                <div className="h-12 w-12 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                  <Building className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Для сетей клиник
                </h3>
                <div className="text-sm text-blue-200 font-bold mb-4">
                  B2B Сети
                </div>
                <div className="text-3xl font-bold text-white mb-2 whitespace-nowrap">
                  30 – 80 тыс. ₽{" "}
                  <span className="text-lg text-blue-200 font-medium">
                    / мес
                  </span>
                </div>
                <p className="text-blue-100 text-sm font-medium">
                  Оптимально для средних и крупных медицинских сетей.
                </p>
              </div>
              <div className="mt-auto pt-6 border-t border-blue-500 relative z-10">
                <button className="w-full py-3 px-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                  Оставить заявку
                </button>
              </div>
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            </div>

            {/* 3. Hospitals */}
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm flex flex-col relative overflow-hidden">
              <div className="mb-6">
                <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  Для гос. больниц
                </h3>
                <div className="text-sm text-indigo-600 font-bold mb-4">
                  B2G
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-2 whitespace-nowrap">
                  50 – 150 тыс. ₽{" "}
                  <span className="text-lg text-slate-500 font-medium">
                    / мес
                  </span>
                </div>
                <p className="text-slate-600 text-sm font-medium">
                  Фиксированная плата за больницу, зависит от числа врачей.
                </p>
              </div>
              <div className="mt-auto pt-6 border-t border-slate-100">
                <button className="w-full py-3 px-4 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors">
                  Связаться с нами
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div
          id="faq"
          className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 mt-20 lg:mt-24 mb-24"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Частые вопросы
            </h2>
            <p className="text-slate-600 text-lg">
              Ответы на самые популярные вопросы о работе ГолосМед.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 items-start">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? "border-blue-200 shadow-[0_8px_30px_-12px_rgba(59,130,246,0.15)] bg-gradient-to-b from-white to-blue-50/30"
                      : "border-slate-200 shadow-sm hover:border-blue-100 hover:shadow-md hover:bg-slate-50/50"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full flex items-center justify-between p-6 sm:p-8 text-left focus:outline-none"
                  >
                    <span
                      className={`text-lg sm:text-xl font-bold transition-colors duration-300 ${isOpen ? "text-blue-900" : "text-slate-900"}`}
                    >
                      {faq.question}
                    </span>
                    <div
                      className={`flex-shrink-0 ml-6 flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                        isOpen
                          ? "rotate-180 bg-blue-600 text-white shadow-md"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      <ChevronDown className="w-6 h-6" />
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 sm:px-8 pb-8 pt-0 text-slate-600 font-medium text-base sm:text-[17px] leading-relaxed">
                          <p>{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-bold text-2xl tracking-tight text-blue-600">
                  ГолосМед
                </span>
              </div>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed font-medium">
                Инновационная система голосового заполнения медицинских карт.
                Быстро, точно и безопасно.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Продукт</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors"
                  >
                    Возможности
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors"
                  >
                    Интеграция
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors"
                  >
                    Безопасность
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors"
                  >
                    Тарифы
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Компания</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors"
                  >
                    О нас
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors"
                  >
                    Блог
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors"
                  >
                    Контакты
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-slate-500 hover:text-blue-600 text-sm font-medium transition-colors"
                  >
                    Партнерам
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-4">Реквизиты</h4>
              <ul className="space-y-3">
                <li className="text-slate-500 text-sm font-medium">
                  Организация: ДГТУ, Т.МО31
                </li>
                <li className="text-slate-500 text-sm font-medium mt-2">
                  <span className="block mb-1 text-slate-600">Команда:</span>
                  Буланов Родион
                  <br />
                  Потапов Глеб
                  <br />
                  Кавалеристова София
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm font-medium">
              © {new Date().getFullYear()} ГолосМед. Все права защищены.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
              >
                Политика конфиденциальности
              </a>
              <a
                href="#"
                className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
              >
                Условия использования
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
