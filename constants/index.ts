export const DUCKING_VOLUME = 0.1;
export const PIXELS_PER_SECOND = 30;
export const TICK_INTERVAL = 5;
export const DEBOUNCE_TIME = 500;
export const PAGE_SIZE = 10;
export const SCAN_DELAY_MS = 2000;
export const MAX_TEACHERS = 3;
export const WEBSITE_URL = process.env.EXPO_PUBLIC_WEBSITE_URL!;
export const RETURN_URL = `${WEBSITE_URL}/profile/wallet`;
export const MERCHANT_COUNTRY_CODE = "FI";
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;
export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID!;

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

export const CLASS_FORMAT = {
  IN_PERSON: "In-Person",
  LIVE_STREAM: "Live Stream",
  // ON_DEMAND: "On Demand",
} as const;

export const PROJECT_STATUS = {
  DRAFT: "Draft",
  RELEASED: "Released",
  CANCELED: "Canceled",
  DELETED: "Deleted",
} as const;

// Maps each passive DB status to the active verb shown to teachers in action chips.
// Pass as ChipBar `options` — Object.values gives ["Draft", "Release", "Cancel"].
// Pass PROJECT_STATUS_TO_ACTION[status] as ChipBar `value` for correct highlighting.
export const PROJECT_STATUS_TO_ACTION: Record<string, string> = {
  [PROJECT_STATUS.DRAFT]: "Draft",
  [PROJECT_STATUS.RELEASED]: "Release",
  [PROJECT_STATUS.CANCELED]: "Cancel",
  [PROJECT_STATUS.DELETED]: "Delete",
};

// Reverse of PROJECT_STATUS_TO_ACTION — maps action verb back to DB value.
// Use in ChipBar onValueChange to convert the selected verb to a DB status.
export const PROJECT_ACTION_TO_STATUS: Record<string, string> = {
  Draft: PROJECT_STATUS.DRAFT,
  Release: PROJECT_STATUS.RELEASED,
  Cancel: PROJECT_STATUS.CANCELED,
  Delete: PROJECT_STATUS.DELETED,
};

// Allowed forward transitions per status (can never move backwards).
export const PROJECT_STATUS_TRANSITIONS: Record<string, string[]> = {
  [PROJECT_STATUS.DRAFT]: [
    PROJECT_STATUS.DRAFT,
    PROJECT_STATUS.RELEASED,
    PROJECT_STATUS.DELETED,
  ],
  [PROJECT_STATUS.RELEASED]: [PROJECT_STATUS.RELEASED, PROJECT_STATUS.CANCELED],
  [PROJECT_STATUS.CANCELED]: [PROJECT_STATUS.CANCELED, PROJECT_STATUS.DELETED],
  [PROJECT_STATUS.DELETED]: [PROJECT_STATUS.DELETED],
};

export const BOOKING_STATUS = {
  SUCCEEDED: "Succeeded",
  CREATED: "Created",
  FAILED: "Failed",
  CANCELED: "Canceled",
  REFUNDED: "Refunded",
  REFUNDING: "Refunding",
  CHECKED_IN: "CheckedIn",
  TRANSFERRED: "Transferred",
} as const;

export const BOOKING_ACTIVE_STATUSES: string[] = [
  BOOKING_STATUS.SUCCEEDED,
  BOOKING_STATUS.CHECKED_IN,
  BOOKING_STATUS.TRANSFERRED,
];

export const BOOKING_ONGOING_STATUSES: string[] = [
  ...BOOKING_ACTIVE_STATUSES,
  BOOKING_STATUS.REFUNDING,
];

export const WISH_STATUS = {
  CLASS_RECOMMENDED: "Class recommended",
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

export const TEACHER_PROFILE_VIEW = {
  CLASSES: "Classes",
  PASSES: "Passes",
} as const;

export const EXPLORE_FILTER = {
  ALL: "All",
  FOR_ME: "For Me",
} as const;

export const TEMPO = {
  "0.5": "0.5x",
  "0.75": "0.75x",
  "1.0": "1x",
} as const;

export const STUDENT_REPORT_REASON = {
  TEACHER_NO_SHOW: "Teacher didn't show up",
  WRONG_LOCATION: "Wrong location",
  CLASS_ENDED_EARLY: "Class ended early",
  INAPPROPRIATE_BEHAVIOR: "Inappropriate behavior",
  OTHER: "Other",
} as const;

export const TEACHER_REPORT_REASON = {
  STUDENT_NO_SHOW: "Student didn't show up",
  INAPPROPRIATE_BEHAVIOR: "Inappropriate behavior",
  PROPERTY_DAMAGE: "Property damage",
  OTHER: "Other",
} as const;

export const REPORT_STATUS = {
  PENDING: "Pending",
  REVIEWING: "Reviewing",
  RESOLVED: "Resolved",
  DISMISSED: "Dismissed",
} as const;

export const PassPurchaseStatuses = {
  Created: "Created",
  Succeeded: "Succeeded",
  Used: "Used",
  Expired: "Expired",
  Refunding: "Refunding",
  Refunded: "Refunded",
  Failed: "Failed",
  Canceled: "Canceled",
} as const;

export const PASS_EXPIRY_DAYS_OPTIONS = [30, 60, 90, 180, 365] as const;
export const PASS_COOLING_OFF_DAYS = 7;
export const PASS_TEACHER_CANCEL_GRACE_DAYS = 30;
