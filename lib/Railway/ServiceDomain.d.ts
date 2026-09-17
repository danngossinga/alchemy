import type { DomainsResponseServiceDomainsItem } from "@distilled.cloud/railway";
import * as railway from "@distilled.cloud/railway";
import * as Effect from "effect/Effect";
/**
 * A Railway-generated `*.up.railway.app` hostname on a Service. Created
 * with `serviceDomainCreate`. Distinct from {@link CustomDomain} (a user
 * hostname).
 */
export type ServiceDomainRecord = {
    id: string;
    domain: string;
    serviceId: string;
    environmentId: string;
    projectId: string | undefined;
    targetPort: number | undefined;
    syncStatus: string;
    url: string;
};
declare const ServiceDomainNotCreated_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "Railway.ServiceDomainNotCreated";
} & Readonly<A>;
export declare class ServiceDomainNotCreated extends ServiceDomainNotCreated_base<{
    serviceId: string;
    environmentId: string;
}> {
}
export declare const listServiceDomains: (projectId: string, environmentId: string, serviceId: string) => Effect.Effect<DomainsResponseServiceDomainsItem[], railway.BadRequest | railway.Conflict | railway.Forbidden | import("effect/unstable/http/HttpClientError").HttpClientError | railway.Locked | railway.RailwayForbidden | railway.RailwayInternalError | railway.RailwayParseError | railway.RailwayPlanLimitExceeded | railway.RailwayRateLimited | railway.RailwayServiceDomainCreateFailed | railway.RailwayUnauthenticated | railway.RailwayValidationError | railway.UnknownRailwayError | railway.UnprocessableEntity | import("@distilled.cloud/planetscale").DefaultErrors, railway.RailwayOpContext>;
export declare const findServiceDomainById: (input: {
    projectId: string;
    environmentId: string;
    serviceId: string;
    domainId: string;
}) => Effect.Effect<ServiceDomainRecord | undefined, railway.BadRequest | railway.Conflict | railway.Forbidden | import("effect/unstable/http/HttpClientError").HttpClientError | railway.Locked | railway.RailwayForbidden | railway.RailwayInternalError | railway.RailwayParseError | railway.RailwayPlanLimitExceeded | railway.RailwayRateLimited | railway.RailwayServiceDomainCreateFailed | railway.RailwayUnauthenticated | railway.RailwayValidationError | railway.UnknownRailwayError | railway.UnprocessableEntity | import("@distilled.cloud/planetscale").DefaultErrors, railway.RailwayOpContext>;
export declare const deleteServiceDomainById: (input: {
    projectId: string;
    environmentId: string;
    serviceId: string;
    domainId: string;
}) => Effect.Effect<void, railway.BadRequest | railway.Conflict | railway.Forbidden | import("effect/unstable/http/HttpClientError").HttpClientError | railway.Locked | railway.RailwayForbidden | railway.RailwayInternalError | railway.RailwayParseError | railway.RailwayPlanLimitExceeded | railway.RailwayRateLimited | railway.RailwayServiceDomainCreateFailed | railway.RailwayUnauthenticated | railway.RailwayValidationError | ServiceDomainNotCreated | railway.UnknownRailwayError | railway.UnprocessableEntity | import("@distilled.cloud/planetscale").DefaultErrors, railway.RailwayOpContext>;
/**
 * Remove the owned generated domain. Environment config is the source of
 * truth (`serviceDomains[id]: null`); GraphQL delete is the fallback.
 * Matches the recorded id and, if that id is missing from the live list,
 * the recorded hostname — never every generated domain.
 */
export declare const deleteOwnedServiceDomain: (input: {
    projectId: string;
    environmentId: string;
    serviceId: string;
    domainId?: string;
    domain?: string;
}) => Effect.Effect<undefined, railway.BadRequest | railway.Conflict | railway.Forbidden | import("effect/unstable/http/HttpClientError").HttpClientError | railway.Locked | railway.RailwayForbidden | railway.RailwayInternalError | railway.RailwayParseError | railway.RailwayPlanLimitExceeded | railway.RailwayRateLimited | railway.RailwayServiceDomainCreateFailed | railway.RailwayUnauthenticated | railway.RailwayValidationError | ServiceDomainNotCreated | railway.UnknownRailwayError | railway.UnprocessableEntity | import("@distilled.cloud/planetscale").DefaultErrors, railway.RailwayOpContext>;
/**
 * Observe-ensure-sync a generated `*.up.railway.app` domain. Creates one
 * when missing (environment-config patch, then the public mutation),
 * claims a stable `{subdomain}.{suffix}` like Terraform, updates
 * `targetPort` in place, and returns the live record.
 *
 * Create itself cannot take a subdomain — Railway assigns
 * `{serviceName}-{environmentName}.up.railway.app`. That first DNS label
 * must be ≤ 63 characters or the API returns "please try again". Extra
 * environments are capped at 24 chars so a 32-char service still fits.
 */
export declare const ensureServiceDomain: (input: {
    projectId: string;
    environmentId: string;
    serviceId: string;
    domainId?: string | null;
    /** DNS label claimed via `serviceDomainUpdate`, Terraform-style. */
    subdomain?: string;
    targetPort?: number;
}) => Effect.Effect<ServiceDomainRecord, railway.BadRequest | railway.Conflict | railway.Forbidden | import("effect/unstable/http/HttpClientError").HttpClientError | railway.Locked | railway.NotFound | railway.RailwayForbidden | railway.RailwayInternalError | railway.RailwayNotFound | railway.RailwayParseError | railway.RailwayPlanLimitExceeded | railway.RailwayRateLimited | railway.RailwayServiceDomainCreateFailed | railway.RailwayUnauthenticated | railway.RailwayValidationError | ServiceDomainNotCreated | railway.UnknownRailwayError | railway.UnprocessableEntity | import("@distilled.cloud/planetscale").DefaultErrors, railway.RailwayOpContext>;
export {};
//# sourceMappingURL=ServiceDomain.d.ts.map