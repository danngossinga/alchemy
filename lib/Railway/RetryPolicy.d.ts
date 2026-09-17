import * as railway from "@distilled.cloud/railway";
import * as Layer from "effect/Layer";
/**
 * Railway-wide retry policy for every SDK call made by the providers.
 *
 * Railway's GraphQL gateway rate-limits aggressively under concurrency
 * (many resources reconciling at once) and usually omits `Retry-After`,
 * so the SDK's default policy — 8 attempts, ~20s of patience — gives up
 * while the throttling window is still open and a bare `TooManyRequests`
 * escapes the provider. Keep the default transient classification (which
 * includes throttling, server, network, and locked errors) but:
 *
 * - throttling errors poll SLOWLY (25s floor) so the rate window refills
 *   instead of being re-drained by the retries themselves, with ~30
 *   attempts (~12 minutes of patience for a suite-wide window);
 * - every other transient error keeps fast exponential backoff capped at
 *   15s per delay.
 */
export declare const factory: railway.Retry.Factory;
/** Provide the Railway retry policy to every operation below. */
export declare const RailwayRetryPolicy: Layer.Layer<railway.Retry.Retry>;
//# sourceMappingURL=RetryPolicy.d.ts.map