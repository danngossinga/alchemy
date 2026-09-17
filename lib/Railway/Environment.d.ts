import type { Config } from "@distilled.cloud/railway";
import { Credentials } from "@distilled.cloud/railway";
import * as railway from "@distilled.cloud/railway";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as HttpClient from "effect/unstable/http/HttpClient";
declare const RailwayWorkspaceNotFound_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "Railway.WorkspaceNotFound";
} & Readonly<A>;
export declare class RailwayWorkspaceNotFound extends RailwayWorkspaceNotFound_base<{
    message: string;
}> {
}
/**
 * Default Railway workspace for the current token
 * (`me.workspace ?? me.workspaces[0]`). Not a resource — the Environment
 * *resource* is a project-scoped deploy environment.
 */
export type RailwayWorkspace = {
    readonly id: string;
    readonly name: string;
};
/**
 * Fully-resolved Railway environment for a stack.
 *
 * `{ token, tokenKind, apiBaseUrl }` comes from distilled `Credentials`.
 * `workspaceId` is the current token's default workspace
 * (`me.workspace ?? me.workspaces[0]`), cached for the process. Resolve
 * it inside lifecycle operations with `RailwayEnvironment.current`.
 */
export type RailwayEnvironmentShape = Config & {
    readonly workspaceId: string;
};
declare const RailwayEnvironment_base: Context.ServiceClass<RailwayEnvironment, "Railway::Environment", Effect.Effect<RailwayEnvironmentShape, never, never>>;
export declare class RailwayEnvironment extends RailwayEnvironment_base {
    static current: Effect.Effect<RailwayEnvironmentShape, never, RailwayEnvironment>;
    readonly kind: "Environment";
}
/**
 * Discover the current token's default workspace.
 *
 * Personal account tokens answer `me.workspace ?? me.workspaces[0]`.
 * Workspace/team tokens reject `me` with {@link RailwayForbidden}
 * (`Not Authorized`); fall back to `apiToken.workspaces[0]`.
 */
export declare const resolveWorkspace: () => Effect.Effect<{
    id: string;
    name: string;
}, railway.BadGateway | railway.BadRequest | railway.Conflict | railway.Forbidden | railway.GatewayTimeout | import("effect/unstable/http/HttpClientError").HttpClientError | railway.InternalServerError | railway.Locked | railway.NotFound | railway.RailwayForbidden | railway.RailwayInternalError | railway.RailwayNotFound | railway.RailwayParseError | railway.RailwayPlanLimitExceeded | railway.RailwayRateLimited | railway.RailwayServiceDomainCreateFailed | railway.RailwayUnauthenticated | railway.RailwayValidationError | RailwayWorkspaceNotFound | railway.ServiceUnavailable | railway.TooManyRequests | railway.Unauthorized | railway.UnknownRailwayError | railway.UnprocessableEntity, railway.RailwayOpContext>;
/**
 * Current token workspace id (`me.workspace ?? me.workspaces[0]`).
 */
export declare const resolveWorkspaceId: () => Effect.Effect<string, railway.BadGateway | railway.BadRequest | railway.Conflict | railway.Forbidden | railway.GatewayTimeout | import("effect/unstable/http/HttpClientError").HttpClientError | railway.InternalServerError | railway.Locked | railway.NotFound | railway.RailwayForbidden | railway.RailwayInternalError | railway.RailwayNotFound | railway.RailwayParseError | railway.RailwayPlanLimitExceeded | railway.RailwayRateLimited | railway.RailwayServiceDomainCreateFailed | railway.RailwayUnauthenticated | railway.RailwayValidationError | RailwayWorkspaceNotFound | railway.ServiceUnavailable | railway.TooManyRequests | railway.Unauthorized | railway.UnknownRailwayError | railway.UnprocessableEntity, railway.RailwayOpContext>;
/**
 * Build a `RailwayEnvironment` layer from the distilled `Credentials`
 * service. Provide this after `Credentials.fromAuthProvider()`.
 *
 * `workspaceId` is resolved from `me` and cached so Project.list /
 * Catalog do not re-hit `me` on every call.
 */
export declare const fromCredentials: () => Layer.Layer<RailwayEnvironment, never, Credentials | HttpClient.HttpClient>;
export {};
//# sourceMappingURL=Environment.d.ts.map