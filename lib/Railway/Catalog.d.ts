import type { RegionsResultItem } from "@distilled.cloud/railway";
import * as railway from "@distilled.cloud/railway";
import * as Effect from "effect/Effect";
export type CatalogKind = "region" | "workspace";
declare const CatalogNotFound_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "Railway.CatalogNotFound";
} & Readonly<A>;
export declare class CatalogNotFound extends CatalogNotFound_base<{
    kind: CatalogKind;
    ref: string;
}> {
}
/**
 * Current token workspace (`me.workspace ?? me.workspaces[0]`).
 * Feeds `projectCreate({ input: { workspaceId } })`. Not a resource.
 */
export declare const currentWorkspace: () => Effect.Effect<{
    id: string;
    name: string;
}, railway.BadGateway | railway.BadRequest | railway.Conflict | railway.Forbidden | railway.GatewayTimeout | import("effect/unstable/http/HttpClientError").HttpClientError | railway.InternalServerError | railway.Locked | railway.NotFound | railway.RailwayForbidden | railway.RailwayInternalError | railway.RailwayNotFound | railway.RailwayParseError | railway.RailwayPlanLimitExceeded | railway.RailwayRateLimited | railway.RailwayServiceDomainCreateFailed | railway.RailwayUnauthenticated | railway.RailwayValidationError | import("./Environment.ts").RailwayWorkspaceNotFound | railway.ServiceUnavailable | railway.TooManyRequests | railway.Unauthorized | railway.UnknownRailwayError | railway.UnprocessableEntity, railway.RailwayOpContext>;
/**
 * List Railway regions via `regions`. Pass `projectId` to scope the
 * catalog to a project; omit it for the workspace default set.
 */
export declare const listRegions: (projectId?: string | undefined) => Effect.Effect<railway.RegionsResultList, railway.RailwayOpError, railway.RailwayOpContext>;
/**
 * Resolve a Railway region by code (`us-west2`, `us-east4`, …), display
 * name, or id.
 */
export declare const findRegion: (ref: string) => Effect.Effect<RegionsResultItem, CatalogNotFound | railway.RailwayOpError, railway.RailwayOpContext>;
export type RailwayRegion = RegionsResultItem;
/**
 * Workspace audit logs. Query-only — Railway has no audit-log
 * create/update/delete, so this is not a resource.
 */
export { AuditLog, getAuditLog, listAuditLogEventTypes, listAuditLogs, type AuditLogEntry, type AuditLogEnvironment, type AuditLogEventType, type AuditLogProject, type ListAuditLogsOptions, } from "./AuditLog.ts";
//# sourceMappingURL=Catalog.d.ts.map