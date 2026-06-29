export type UserRole = "viewer" | "streamer" | "both";

export type RequestStatus = "open" | "claimed" | "fulfilled";

export type StreamPlatform = "twitch" | "youtube" | "kick" | "other";

export type NotificationChannel = "email" | "push";

export type NotificationStatus = "pending" | "sent" | "failed";

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
  created_at: string;
  updated_at: string;
}

export interface Request {
  id: string;
  author_id: string;
  title: string;
  description: string;
  status: RequestStatus;
  upvote_count: number;
  created_at: string;
  updated_at: string;
}

export interface Upvote {
  request_id: string;
  user_id: string;
  created_at: string;
}

export interface Claim {
  id: string;
  request_id: string;
  streamer_id: string;
  claimed_at: string;
}

export interface LiveSession {
  id: string;
  claim_id: string;
  stream_url: string;
  platform: StreamPlatform;
  started_at: string;
  ended_at: string | null;
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

export interface RequestWithDetails extends RequestWithAuthor {
  claims: (Claim & {
    profiles: Pick<Profile, "display_name" | "avatar_url"> | null;
    streamer_profiles: Pick<StreamerProfile, "bio" | "platform_links"> | null;
  })[] | null;
  live_sessions: (LiveSession & { claims: Claim | null })[] | null;
}
