export const DUCKING_VOLUME = 0.1;
export const PIXELS_PER_SECOND = 30;
export const TICK_INTERVAL = 5;
export const DEBOUNCE_TIME = 500;
export const SCAN_DELAY_MS = 1000;
export const WEBSITE_URL = process.env.EXPO_PUBLIC_WEBSITE_URL!;
export const RETURN_URL = process.env.EXPO_PUBLIC_RETURN_URL!;
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
export const GOOGLE_PLACES_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY!;

export const STYLE = {
  BACHATA: "Bachata",
  BALLET: "Ballet",
  BALLROOM: "Ballroom",
  BOLLYWOOD: "Bollywood",
  BREAKING: "Breaking",
  BROADWAY: "Broadway",
  COMMERCIAL: "Commercial",
  CONTEMPORARY: "Contemporary",
  HEELS: "Heels",
  HIPHOP: "Hip Hop",
  HOUSE: "House",
  JAZZ: "Jazz",
  KPOP: "K-Pop",
  KRUMP: "Krump",
  POPPING: "Popping",
  REGGAETON: "Reggaeton",
  SALSA: "Salsa",
  SHUFFLE: "Shuffle",
  TUTTING: "Tutting",
  WAACKING: "Waacking",
  ZUMBA: "Zumba",
} as const;

export const LEVEL = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
  OPENLEVEL: "Open Level",
} as const;

export const PROJECT_STATUS = {
  DRAFT: "Draft",
  RELEASED: "Released",
  CANCELED: "Canceled",
} as const;

// Maps each passive DB status to the active verb shown to teachers in action chips.
// Pass as ChipBar `options` — Object.values gives ["Draft", "Release", "Cancel"].
// Pass PROJECT_STATUS_TO_ACTION[status] as ChipBar `value` for correct highlighting.
export const PROJECT_STATUS_TO_ACTION: Record<string, string> = {
  [PROJECT_STATUS.DRAFT]: "Draft",
  [PROJECT_STATUS.RELEASED]: "Release",
  [PROJECT_STATUS.CANCELED]: "Cancel",
};

// Reverse of PROJECT_STATUS_TO_ACTION — maps action verb back to DB value.
// Use in ChipBar onValueChange to convert the selected verb to a DB status.
export const PROJECT_ACTION_TO_STATUS: Record<string, string> = {
  Draft: PROJECT_STATUS.DRAFT,
  Release: PROJECT_STATUS.RELEASED,
  Cancel: PROJECT_STATUS.CANCELED,
};

// Allowed forward transitions per status (can never move backwards).
export const PROJECT_STATUS_TRANSITIONS: Record<string, string[]> = {
  [PROJECT_STATUS.DRAFT]: [
    PROJECT_STATUS.DRAFT,
    PROJECT_STATUS.RELEASED,
    PROJECT_STATUS.CANCELED,
  ],
  [PROJECT_STATUS.RELEASED]: [PROJECT_STATUS.RELEASED, PROJECT_STATUS.CANCELED],
  [PROJECT_STATUS.CANCELED]: [PROJECT_STATUS.CANCELED],
};

export const STRIPE_PAYMENT_STATUS = {
  SUCCEEDED: "Succeeded",
  PROCESSING: "Processing",
  FAILED: "Failed",
  CANCELED: "Canceled",
  REFUNDED: "Refunded",
  REFUNDING: "Refunding",
} as const;

export const WISH_STATUS = {
  CLASS_AVAILABLE: "Class available",
  GRANTED: "Granted",
  WAITING: "Waiting",
} as const;

export const ROLE = {
  STUDENT: "Student",
  TEACHER: "Teacher",
} as const;

export const DAY = {
  Sunday: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
} as const;

export const MONTH = {
  January: "January",
  FEBRUARY: "February",
  MARCH: "March",
  APRIL: "April",
  MAY: "May",
  JUNE: "June",
  JULY: "July",
  AUGUST: "August",
  SEPTEMBER: "September",
  OCTOBER: "October",
  NOVEMBER: "November",
  DECEMBER: "December",
} as const;

export const TRACK = {
  SONG: "song",
  COUNT: "count",
} as const;

export const TIME = {
  TODAY: "Today",
  UPCOMING: "Upcoming",
  PAST: "Past",
} as const;

export const WISH_WATCH = {
  WISH: "Wish",
  WATCHING: "Watching",
} as const;

export const TEMPO = {
  "0.5": "0.5x",
  "0.75": "0.75x",
  "1.0": "1x",
} as const;
