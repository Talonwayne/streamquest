export type UserRole = "viewer" | "streamer" | "both";

export type RequestStatus = "open" | "live_now" | "completed";

export type RequestCategory =
  | "investigative_journalism"
  | "game_challenge"
  | "commentary"
  | "gaming"
  | "irl"
  | "sports"
  | "learning"
  | "travel"
  | "food"
  | "music"
  | "challenges"
  | "events"
  | "tech"
  | "fitness"
  | "creative"
  | "other";

export type StreamPlatform =
  | "twitch"
  | "youtube"
  | "kick"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "other";

export type NotificationChannel = "email" | "push";

export type NotificationStatus = "pending" | "sent" | "failed";

export type LocationPrecision = "city" | "precise";

export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";

export interface Profile {
  id: string;
  display_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StreamerProfile {
  user_id: string;
  bio: string | null;
  platform_links: {
    twitch?: string;
    youtube?: string;
    kick?: string;
  };
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  location_updated_at: string | null;
  location_precision?: LocationPrecision;
  twitch_user_id?: string | null;
  youtube_channel_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Request {
  id: string;
  author_id: string;
  title: string;
  description: string;
  category: RequestCategory;
  tags: string[];
  status: RequestStatus;
  upvote_count: number;
  trending_score?: number;
  active_streamer_count?: number;
  latitude?: number | null;
  longitude?: number | null;
  location_label?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SimilarRequest {
  id: string;
  title: string;
  tags: string[];
  match_reason: "same_tags" | "similar_title" | "same_title";
}

export interface Upvote {
  request_id: string;
  user_id: string;
  created_at: string;
}

/** @deprecated Claims table is deprecated; use live_sessions with request_id directly */
export interface Claim {
  id: string;
  request_id: string;
  streamer_id: string;
  claimed_at: string;
}

export interface LiveSession {
  id: string;
  request_id: string;
  streamer_id: string;
  stream_url: string;
  platform: StreamPlatform;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
  platform_title?: string | null;
  platform_game?: string | null;
  platform_viewer_count?: number | null;
  platform_thumbnail_url?: string | null;
  live_verified?: boolean;
  platform_user_id?: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface Comment {
  id: string;
  request_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface CommentWithAuthor extends Comment {
  profiles: Pick<Profile, "display_name" | "avatar_url"> | null;
}

export interface RequestFollow {
  request_id: string;
  user_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  request_id: string | null;
  comment_id: string | null;
  reason: string;
  status: ReportStatus;
  created_at: string;
}

export type MapMarkerKind = "live" | "profile" | "request";

export interface MapMarker {
  id: string;
  kind: MapMarkerKind;
  latitude: number;
  longitude: number;
  location_label: string | null;
  streamer_id?: string;
  display_name: string | null;
  request_id?: string;
  request_title?: string;
  stream_url?: string;
  platform?: StreamPlatform;
  category?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  live_session_id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface RequestWithAuthor extends Request {
  profiles: Pick<Profile, "display_name" | "avatar_url"> | null;
}

export interface TrendingRequest extends RequestWithAuthor {}

export interface LiveSessionWithStreamer extends LiveSession {
  profiles: Pick<Profile, "display_name" | "avatar_url"> | null;
  streamer_profiles?: Pick<StreamerProfile, "bio" | "platform_links"> | null;
}

export interface RequestWithDetails extends RequestWithAuthor {
  live_sessions: LiveSessionWithStreamer[] | null;
}
