// ──────────────────────────────────────────────
// DATA - Default template for new users
// Existing users load their data from Supabase.
// ──────────────────────────────────────────────

export const ROOT_LABEL = "Mes Priorités";

export const PROJECTS = [
  {
    id: "project-1",
    title: "Mon Projet",
    color: "#3b82f6",
    status: "not_started",
    description: "",
    blockers: "",
    notes: "",
    checklist: [],
    links: [],
    children: [
      {
        id: "task-1",
        title: "Exemple de tâche",
        status: "not_started",
        description: "Cliquez pour modifier cette tâche. Ajoutez une description, une checklist, des liens.",
        blockers: "",
        notes: "",
        checklist: [
          { text: "Première étape", done: false },
          { text: "Deuxième étape", done: false }
        ],
        links: []
      }
    ]
  }
];

// ──────────────────────────────────────────────
// STATUS LABELS
// ──────────────────────────────────────────────
export const STATUS_LABELS = {
  done: "Fait",
  in_progress: "En cours",
  blocked: "Bloqué",
  abandoned: "Abandonné",
  not_started: "Pas commencé"
};

// ──────────────────────────────────────────────
// DEFAULT POSITIONS (empty for template)
// ──────────────────────────────────────────────
export const DEFAULT_POSITIONS = {};
