export type Language = "en" | "es";

export const translations = {
  en: {
    // App name
    appName: "LIFTTRACK",

    // Navigation
    nav: {
      today: "Today",
      history: "History",
      progress: "Progress",
      plans: "Plans",
      back: "← Back",
    },

    // Home page
    home: {
      letsGo: "Let's go",
      week: "Week",
      session: "SESSION",
      startSession: "START SESSION",
      todaysLifts: "Today's Lifts",
    },

    // No plan view
    noPlan: {
      welcome: "Welcome",
      noPlanSelected: "NO PLAN SELECTED",
      choosePlanDesc: "Choose a training plan to start tracking your lifts",
      choosePlan: "CHOOSE PLAN",
    },

    // Week complete view
    weekComplete: {
      weekComplete: "Week Complete",
      restUp: "REST UP",
      thisWeek: "This Week",
      sessionsCompleted: "sessions completed",
      restMessage: "You crushed it. Recovery is part of the process. Come back Monday ready to lift.",
    },

    // Trained today view
    trainedToday: {
      crushedIt: "Crushed It",
      todaysSession: "Today's Session",
      sets: "Sets",
      duration: "Duration",
      viewDetails: "View full session details →",
      restMessage: "Great work today. Rest up and recover. Your muscles grow while you sleep.",
    },

    // Recovery day view
    recoveryDay: {
      recoveryDay: "Recovery Day",
      activeRest: "ACTIVE REST",
      interferenceEffect: "The Interference Effect",
      interferenceDesc: "Training heavy lifts on consecutive days can interfere with muscle recovery and strength gains. Your nervous system and muscles need time to rebuild.",
      suggestedActivities: "Suggested Activities",
      walk: "Walk",
      walkDesc: "20-45 min low intensity",
      jog: "Light Jog or Run",
      jogDesc: "Keep heart rate moderate",
      sports: "Play Sports",
      sportsDesc: "Basketball, soccer, tennis",
      cardioMessage: "Light cardio promotes blood flow and recovery without taxing your muscles. Come back tomorrow ready to lift.",
    },

    // History page
    history: {
      title: "HISTORY",
      inProgress: "IN PROGRESS",
      continue: "CONTINUE →",
      noSessions: "No completed sessions yet.",
      startFirst: "Complete your first workout to see it here.",
      totalSets: "sets",
      duration: "Duration",
      volume: "Volume",
      bestSet: "Best set",
      notes: "Notes",
      noNotes: "No notes",
      deleteSession: "Delete this session",
      confirmDelete: "Are you sure you want to delete this session? This cannot be undone.",
      yesDelete: "Yes, Delete",
      cancel: "Cancel",
      deleting: "Deleting...",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      add: "Add",
      saving: "Saving...",
    },

    // Progress page
    progress: {
      title: "PROGRESS",
      subtitle: "Track your gains over time",
      selectExercise: "Select Exercise",
      maxWeight: "Max Weight",
      max: "Max",
      bestVolume: "Best Volume",
      totalSets: "Total Sets",
      weightProgression: "Weight Progression",
      sessionVolume: "Session Volume",
      recentSets: "Recent Sets",
      noData: "No data yet.",
      noDataDesc: "Complete some sessions to see your progress.",
      goTrain: "GO TRAIN",
      weight: "Weight",
      volume: "Volume",
      noSetsFor: "No sets logged for",
      yet: "yet.",
    },

    // Plans page
    plans: {
      title: "TRAINING PLANS",
      selectPlanDesc: "Select a plan to start your journey",
      noPlans: "No plans available yet.",
      runSeed: "Run the seed script to add training plans.",
      sessionsPerWeek: "sessions/week",
      exercises: "exercises",
      active: "Active",
      activePlan: "Active Plan",
      select: "SELECT",
      selectThisPlan: "SELECT THIS PLAN",
      selecting: "SELECTING...",
      totalExercises: "total exercises",
    },

    // Session page
    session: {
      endSession: "END SESSION",
      ending: "ENDING...",
      addNotes: "Add notes (optional)...",
      warmup: "Warmup",
      working: "Working",
      logSet: "LOG SET",
      logging: "...",
      reps: "Reps",
      weight: "Weight",
      target: "Target",
      complete: "COMPLETE",
      moveToNext: "Move to the next exercise",
      setOf: "of",
    },

    // Onboarding
    onboarding: {
      selectLanguage: "Select Your Language",
      languageDesc: "Choose your preferred language for the app",
      english: "English",
      spanish: "Español",
      continue: "CONTINUE",
    },

    // Common
    common: {
      loading: "Loading...",
      error: "An error occurred",
      set: "Set",
    },
  },

  es: {
    // App name
    appName: "LIFTTRACK",

    // Navigation
    nav: {
      today: "Hoy",
      history: "Historial",
      progress: "Progreso",
      plans: "Planes",
      back: "← Volver",
    },

    // Home page
    home: {
      letsGo: "Vamos",
      week: "Semana",
      session: "SESIÓN",
      startSession: "INICIAR SESIÓN",
      todaysLifts: "Ejercicios de Hoy",
    },

    // No plan view
    noPlan: {
      welcome: "Bienvenido",
      noPlanSelected: "SIN PLAN SELECCIONADO",
      choosePlanDesc: "Elige un plan de entrenamiento para comenzar a registrar tus levantamientos",
      choosePlan: "ELEGIR PLAN",
    },

    // Week complete view
    weekComplete: {
      weekComplete: "Semana Completa",
      restUp: "DESCANSA",
      thisWeek: "Esta Semana",
      sessionsCompleted: "sesiones completadas",
      restMessage: "Lo lograste. La recuperación es parte del proceso. Vuelve el lunes listo para entrenar.",
    },

    // Trained today view
    trainedToday: {
      crushedIt: "Lo Lograste",
      todaysSession: "Sesión de Hoy",
      sets: "Series",
      duration: "Duración",
      viewDetails: "Ver detalles completos →",
      restMessage: "Buen trabajo hoy. Descansa y recupérate. Tus músculos crecen mientras duermes.",
    },

    // Recovery day view
    recoveryDay: {
      recoveryDay: "Día de Recuperación",
      activeRest: "DESCANSO ACTIVO",
      interferenceEffect: "El Efecto de Interferencia",
      interferenceDesc: "Entrenar levantamientos pesados en días consecutivos puede interferir con la recuperación muscular y las ganancias de fuerza. Tu sistema nervioso y músculos necesitan tiempo para reconstruirse.",
      suggestedActivities: "Actividades Sugeridas",
      walk: "Caminar",
      walkDesc: "20-45 min baja intensidad",
      jog: "Trote Ligero",
      jogDesc: "Mantén el ritmo cardíaco moderado",
      sports: "Practicar Deportes",
      sportsDesc: "Baloncesto, fútbol, tenis",
      cardioMessage: "El cardio ligero promueve el flujo sanguíneo y la recuperación sin sobrecargar tus músculos. Vuelve mañana listo para entrenar.",
    },

    // History page
    history: {
      title: "HISTORIAL",
      inProgress: "EN PROGRESO",
      continue: "CONTINUAR →",
      noSessions: "Aún no hay sesiones completadas.",
      startFirst: "Completa tu primer entrenamiento para verlo aquí.",
      totalSets: "series",
      duration: "Duración",
      volume: "Volumen",
      bestSet: "Mejor serie",
      notes: "Notas",
      noNotes: "Sin notas",
      deleteSession: "Eliminar esta sesión",
      confirmDelete: "¿Estás seguro de que quieres eliminar esta sesión? Esto no se puede deshacer.",
      yesDelete: "Sí, Eliminar",
      cancel: "Cancelar",
      deleting: "Eliminando...",
      edit: "Editar",
      delete: "Eliminar",
      save: "Guardar",
      add: "Agregar",
      saving: "Guardando...",
    },

    // Progress page
    progress: {
      title: "PROGRESO",
      subtitle: "Sigue tus ganancias a lo largo del tiempo",
      selectExercise: "Seleccionar Ejercicio",
      maxWeight: "Peso Máximo",
      max: "Máx",
      bestVolume: "Mejor Volumen",
      totalSets: "Series Totales",
      weightProgression: "Progresión de Peso",
      sessionVolume: "Volumen por Sesión",
      recentSets: "Series Recientes",
      noData: "Aún no hay datos.",
      noDataDesc: "Completa algunas sesiones para ver tu progreso.",
      goTrain: "IR A ENTRENAR",
      weight: "Peso",
      volume: "Volumen",
      noSetsFor: "No hay series registradas para",
      yet: "aún.",
    },

    // Plans page
    plans: {
      title: "PLANES DE ENTRENAMIENTO",
      selectPlanDesc: "Selecciona un plan para comenzar tu camino",
      noPlans: "Aún no hay planes disponibles.",
      runSeed: "Ejecuta el script de semillas para agregar planes.",
      sessionsPerWeek: "sesiones/semana",
      exercises: "ejercicios",
      active: "Activo",
      activePlan: "Plan Activo",
      select: "SELECCIONAR",
      selectThisPlan: "SELECCIONAR ESTE PLAN",
      selecting: "SELECCIONANDO...",
      totalExercises: "ejercicios totales",
    },

    // Session page
    session: {
      endSession: "TERMINAR SESIÓN",
      ending: "TERMINANDO...",
      addNotes: "Agregar notas (opcional)...",
      warmup: "Calentamiento",
      working: "Trabajo",
      logSet: "REGISTRAR",
      logging: "...",
      reps: "Reps",
      weight: "Peso",
      target: "Objetivo",
      complete: "COMPLETADO",
      moveToNext: "Pasa al siguiente ejercicio",
      setOf: "de",
    },

    // Onboarding
    onboarding: {
      selectLanguage: "Selecciona Tu Idioma",
      languageDesc: "Elige tu idioma preferido para la aplicación",
      english: "English",
      spanish: "Español",
      continue: "CONTINUAR",
    },

    // Common
    common: {
      loading: "Cargando...",
      error: "Ocurrió un error",
      set: "Serie",
    },
  },
} as const;

// Use a mapped type to get the structure without literal string types
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends object
    ? DeepStringify<T[K]>
    : T[K];
};

export type Translations = DeepStringify<typeof translations.en>;

export function getTranslations(language: Language): Translations {
  return translations[language] || translations.en;
}
