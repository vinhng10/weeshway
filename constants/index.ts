export const DUCKING_VOLUME = 0.1;
export const PIXELS_PER_SECOND = 30;
export const TICK_INTERVAL = 5;
export const DEBOUNCE_TIME = 500;
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
  RELEASE: "Release",
  CANCEL: "Cancel",
} as const;

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
