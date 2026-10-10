export function readVisitorExclusions(): Promise<{ ips: string[]; visitorKeys: string[] }>;
export function rememberOwner(ip: string, visitorKey: string): Promise<void>;
export function hasAdminSession(token: string | undefined, secret: string, prisma: unknown): Promise<boolean>;
