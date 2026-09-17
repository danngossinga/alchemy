import * as Effect from "effect/Effect";
import * as Schedule from "effect/Schedule";
/**
 * Railway API errors that are safe to retry: throttles plus gateway
 * disconnects (`ServiceUnavailable` "upstream connect error", 502, 504).
 */
export declare const isRailwayTransient: (e: {
    _tag: string;
}) => boolean;
/**
 * 30s plus 0–30s jitter. Railway's public API is ~10k requests/hour;
 * concurrent suite retries have to stay sparse.
 */
export declare const conservativeSpacing: Schedule.Schedule<number, unknown, never, never>;
/**
 * Railway meters project and environment creates at 1 per 30s per user.
 * Distilled tags those as `RailwayRateLimited`. Sleep the hinted delay
 * (or 31s) plus 0–30s jitter and retry until the cap opens. Unbounded.
 * The gate is held across the sleep so the next waiter does not fire
 * another create into a closed window.
 */
export declare const waitOutCreateRateLimit: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
export declare const withEnvironmentConfigLock: <A, E, R>(environmentId: string, effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
//# sourceMappingURL=transient.d.ts.map