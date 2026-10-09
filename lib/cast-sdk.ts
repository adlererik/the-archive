// Erik Adler: narrow types for the official Google Cast sender SDK loaded at runtime.
export type CastInfo = { contentId: string; contentType: string; customData?: { archiveMediaId: string; archiveMode: "single" | "presentation" }; duration?: number };
export type CastQueueItem = { media: CastInfo; autoplay: boolean; preloadTime: number; itemId?: number };
export type CastMediaSession = { media?: CastInfo; playerState: string; idleReason?: string; items?: CastQueueItem[]; currentItemId?: number; loadingItemId?: number | null; addUpdateListener: (callback: (alive: boolean) => void) => void; removeUpdateListener: (callback: (alive: boolean) => void) => void; queueJumpToItem: (id: number, success: () => void, error: (error: unknown) => void) => void };
export type CastSession = { loadMedia: (request: CastLoadRequest) => Promise<unknown>; getMediaSession: () => CastMediaSession | null; getCastDevice: () => { friendlyName?: string }; endSession: (stop: boolean) => void };
export type CastLoadRequest = { media: CastInfo; autoplay: boolean; queueData?: { items: CastQueueItem[]; repeatMode: string; startIndex: number } };
export type CastContext = { setOptions: (options: { receiverApplicationId: string; autoJoinPolicy: string }) => void; getCastState: () => string; getCurrentSession: () => CastSession | null; requestSession: () => Promise<unknown>; addEventListener: (type: string, callback: () => void) => void; removeEventListener: (type: string, callback: () => void) => void };
export type RemotePlayer = { isPaused: boolean; isConnected: boolean; playerState: string };
export type RemoteController = { playOrPause: () => void; stop: () => void; addEventListener: (type: string, callback: () => void) => void; removeEventListener: (type: string, callback: () => void) => void };
export type CastWindow = Window & {
  __onGCastApiAvailable?: (available: boolean) => void;
  chrome?: { cast?: { AutoJoinPolicy: { ORIGIN_SCOPED: string }; media: { DEFAULT_MEDIA_RECEIVER_APP_ID: string; RepeatMode: { SINGLE: string; ALL: string; OFF: string }; MediaInfo: new (url: string, type: string) => CastInfo; QueueItem: new (media: CastInfo) => CastQueueItem; QueueData: new () => NonNullable<CastLoadRequest["queueData"]>; LoadRequest: new (media: CastInfo) => CastLoadRequest } } };
  cast?: { framework: { CastContext: { getInstance: () => CastContext }; CastContextEventType: { CAST_STATE_CHANGED: string; SESSION_STATE_CHANGED: string }; RemotePlayer: new () => RemotePlayer; RemotePlayerController: new (player: RemotePlayer) => RemoteController; RemotePlayerEventType: { ANY_CHANGE: string } } };
};
export function castWindow() { return window as CastWindow; }
