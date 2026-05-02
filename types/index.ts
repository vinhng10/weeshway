import {
  BOOKING_STATUS,
  CLASS_FORMAT,
  EXPLORE_FILTER,
  LEVEL,
  PROJECT_STATUS,
  REPORT_STATUS,
  ROLE,
  STUDENT_REPORT_REASON,
  STYLE,
  TEACHER_REPORT_REASON,
  TEMPO,
  TIME,
  TRACK,
  WISH_STATUS,
  WISH_WATCH,
} from "@/constants";

type ValueOf<T> = T[keyof T];

export type FormatType = ValueOf<typeof CLASS_FORMAT>;
export type LevelType = ValueOf<typeof LEVEL>;
export type ProjectStatusType = ValueOf<typeof PROJECT_STATUS>;
export type BookingStatusType = ValueOf<typeof BOOKING_STATUS>;
export type StyleType = ValueOf<typeof STYLE>;
export type WishStatusType = ValueOf<typeof WISH_STATUS>;
export type TimeType = ValueOf<typeof TIME>;
export type TrackType = ValueOf<typeof TRACK>;
export type RoleType = ValueOf<typeof ROLE>;
export type WishWatchType = ValueOf<typeof WISH_WATCH>;
export type ExploreFilterType = ValueOf<typeof EXPLORE_FILTER>;
export type TempoType = ValueOf<typeof TEMPO>;
export type StudentReportReasonType = ValueOf<typeof STUDENT_REPORT_REASON>;
export type TeacherReportReasonType = ValueOf<typeof TEACHER_REPORT_REASON>;
export type ReportStatusType = ValueOf<typeof REPORT_STATUS>;

export type OptionItem = {
  key: string;
  value: string;
};

export type WishType = {
  id: string;
  createdAt: Date;
  userId: string;
  style?: string;
  level?: string;
  description?: string;
  songId: string;
};

export type WishTeacherType = {
  wishId: string;
  teacherId: string;
  createdAt: Date;
};

export type ProfileType = {
  id: string;
  username?: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  videoUrls?: string[];
  stripeAccountId?: string;
  onboardingCompleted?: boolean;
  location?: string;
  country?: string;
  expoPushToken?: string;
  policiesAgreedAt?: Date;
  currency?: string;
};

export type ItemType = {
  startTime: number;
  endTime: number;
  selected: boolean;
};

export type ProjectType = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  status: ProjectStatusType;
  style?: StyleType;
  level?: LevelType;
  price?: number;
  spots?: number;
  startAt?: Date;
  endAt?: Date;
  description?: string;
  songId?: string;
  locationId?: number;
  artworkUrl?: string;
  songItems: ItemType[];
  countItems: ItemType[];
  currency: string;
  format: FormatType;
  meetingUrl?: string;
};

export type SongType = {
  id: string;
  createdAt: Date;
  name: string;
  artistName: string;
  artworkUrl: string;
  genre?: string;
  previewUrl?: string;
  embedding?: number[];
};

export type LocationType = {
  id: string;
  createdAt?: Date;
  displayName?: string;
  formattedAddress?: string;
  shortFormattedAddress?: string;
  googleMapsUri?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  country?: string;
  administrativeAreaLevel1?: string;
};

export type RecommendationType = {
  id: string;
  createdAt: Date;
  wishId: string;
  projectId: string;
  score: number;
};

export type BookingType = {
  id: string;
  createdAt: Date;
  userId: string;
  projectId: string;
  stripePaymentIntentId: string;
  status: BookingStatusType;
  spots: number;
  price: number;
  currency: string;
  toStripeAccountId?: string;
  projectEndAt?: Date;
  checkedInAt?: Date;
  stripeTransferId?: string;
  secret?: BookingSecretType | null;
};

export type BookingSecretType = {
  bookingId: string;
  checkInToken: string;
};

export type StatsType = {
  userId: string;
  totalEarnings: number;
  bookingCount: number;
  currency: string;
  currentMonth: string;
};

export type BubbleType = {
  label: number;
  value: number;
};

export type WatchingType = {
  id: string;
  createdAt: Date;
  userId: string;
  projectId: string;
};

export type WishTeacherJoinType = {
  teacherId?: string;
  profile?: ProfileType;
};

// Utility type: WishType with song_id replaced by joined songs relation
export type WishEnrichedType = WishType & {
  song: SongType;
  teachers: ProfileType[];
  wishTeachers?: WishTeacherJoinType[];
};

export type WishRecommendationEnrichedType = WishEnrichedType & {
  recommendations: RecommendationEnrichedType[];
  status: WishStatusType;
};

export type Format =
  | { format: "In-Person"; place?: LocationType }
  | { format: "Live Stream"; meetingUrl?: string }
  | { format: "On Demand"; meetingUrl?: string };

export function projectToFormat(
  p: Pick<ProjectType, "format" | "meetingUrl"> & {
    location?: LocationType;
  },
): Format {
  if (p.format === "Live Stream")
    return { format: "Live Stream", meetingUrl: p.meetingUrl };
  if (p.format === "On Demand")
    return { format: "On Demand", meetingUrl: p.meetingUrl };
  return { format: "In-Person", place: p.location };
}

export type ProjectEnrichedType = ProjectType & {
  profile: ProfileType;
  song: SongType;
  location?: LocationType;
  bookings: BookingType[];
  watchings: WatchingType[];
};

export type ProfileEnrichedType = ProfileType & {
  projects?: ProjectEnrichedType[];
};

export type RecommendationEnrichedType = RecommendationType & {
  project: ProjectEnrichedType;
};

export type BookingEnrichedType = BookingType & {
  project: ProjectEnrichedType;
};

export type BookingCheckinEnrichedType = BookingType & {
  profile: ProfileType;
};

export type WatchingEnrichedType = WatchingType & {
  project: ProjectEnrichedType;
};

export type SearchResultType = {
  type: "class" | "profile" | "wish";
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  metadata?: string;
  previewUrl?: string;
  avatarUrl?: string;
  rank: number;
};

export type ReportType = {
  id: string;
  createdAt: Date;
  userId: string;
  projectId: string;
  description: string;
  photoUrls: string[];
  status: string;
  resolution?: string;
};
