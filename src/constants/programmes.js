export const PROGRAMMES = [
  {
    value: "kazakhstan_history_department",
    labels: {
      kk: "Қазақстан тарихы кафедрасы (7)",
      ru: "Кафедра истории Казахстана (7)",
      en: "Department of History of Kazakhstan (7)",
    },
  },
  {
    value: "computer_sciences_department",
    labels: {
      kk: "Компьютерлік ғылымдар кафедрасы (5)",
      ru: "Кафедра компьютерных наук (5)",
      en: "Department of Computer Sciences (5)",
    },
  },
  {
    value: "information_systems_department",
    labels: {
      kk: "Ақпараттық жүйелер кафедрасы (4)",
      ru: "Кафедра информационных систем (4)",
      en: "Department of Information Systems (4)",
    },
  },
  {
    value: "physics_chemistry_department",
    labels: {
      kk: "Физика және химия кафедрасы (3)",
      ru: "Кафедра физики и химии (3)",
      en: "Department of Physics and Chemistry (3)",
    },
  },
  {
    value: "humanitarian_pedagogical_institute",
    labels: {
      kk: "Гуманитарлық және педагогикалық ғылымдар институты (6)",
      ru: "Институт гуманитарных и педагогических наук (6)",
      en: "Institute of Humanities and Pedagogical Sciences (6)",
    },
  },
];

export const getProgrammeLabel = (programme, language = "ru") =>
  programme.labels[language] || programme.labels.ru || programme.labels.en;

export const getCanonicalProgrammeName = (programme) =>
  (programme.labels.ru || programme.labels.en || "").replace(/\s*\([^)]*\)\s*$/, "");