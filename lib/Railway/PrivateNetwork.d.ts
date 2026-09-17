import type { PrivateNetworkEndpointSyncStatus } from "@distilled.cloud/railway";
import * as railway from "@distilled.cloud/railway";
import * as Effect from "effect/Effect";
import * as Provider from "../Provider.ts";
import { Resource } from "../Resource.ts";
import type { Providers } from "./Providers.ts";
/**
 * A resource-valued prop: the resource itself, or an Effect that produces
 * it (so `yield* Project(...)` and `Project(...)` both type-check).
 */
type Ref<T> = T | Effect.Effect<T, never, Providers>;
/**
 * Environment identity a private network lives in. Accepts a
 * `Railway.Project` (its primary environment), a `Railway.Environment`,
 * or an `{ environmentId, projectId? }` stub.
 */
export type PrivateNetworkEnvironment = {
    readonly environmentId: string;
    readonly projectId?: string;
};
export interface PrivateNetworkProps {
    /**
     * Environment the named network belongs to. Accepts a
     * `Railway.Project` (primary environment), a `Railway.Environment`, or
     * `{ environmentId, projectId }`. Changing it replaces the network.
     */
    environment: Ref<PrivateNetworkEnvironment>;
    /**
     * Network name. Unique per environment. If omitted, a unique name is
     * generated from the stack, stage and logical ID. Changing it replaces
     * the network — Railway has no rename mutation.
     */
    name?: string;
}
export type PrivateNetwork = Resource<"Railway.PrivateNetwork", PrivateNetworkProps, {
    /** Railway public network id (string identity used by endpoint APIs). */
    publicId: string;
    /** Numeric WireGuard network id, as a decimal string. */
    networkId: string;
    /** Physical network name (unique per environment). */
    name: string;
    /** Network DNS suffix (typically `railway.internal`). */
    dnsName: string;
    /** Parent Railway project id. */
    projectId: string;
    /** Environment the network lives in. */
    environmentId: string;
    /** Observed tags. */
    tags: string[];
    /** RFC3339 creation timestamp, if Railway reported one. */
    createdAt: string | undefined;
}, never, Providers>;
declare const PrivateNetworkResource: import("../Resource.ts").ResourceClass<PrivateNetwork>;
/**
 * A Railway.PrivateNetwork is a named private mesh in an environment.
 * Every environment already has the default `*.railway.internal` mesh —
 * this resource create-or-gets an additional named network (custom DNS)
 * and is the parent of {@link PrivateNetworkEndpoint}.
 *
 * Railway has no per-network delete. Destroy is a no-op; the network is
 * removed when its Project/Environment is deleted. `create-or-get` is
 * idempotent for a given `(environment, name)`.
 *
 * @see https://docs.railway.com/networking/private-networking
 *
 * ### Create a named network
 * Pass a Project (or Environment). Alchemy generates a unique name.
 * `dnsName` is the network suffix endpoints hang off.
 *
 * **Example:** Generated name
 * ```typescript
 * const site = yield* Railway.Project("Site");
 * const net = yield* Railway.PrivateNetwork("Mesh", {
 *   environment: site,
 * });
 * ```
 *
 * ### A stable name
 * Pass `name` when you need a stable network name. Changing it later
 * replaces the resource — Railway cannot rename a network.
 *
 * **Example:** Explicit name
 * ```typescript
 * const net = yield* Railway.PrivateNetwork("Mesh", {
 *   environment: site,
 *   name: "backend",
 * });
 * ```
 *
 * :::caution[Changing `name` or `environment` replaces the network]
 * `privateNetworkCreateOrGet` is keyed by name. A new network is
 * ensured under the new name. Railway has no per-network delete, so the
 * previous name stays until the environment is deleted.
 * :::
 *
 * ### Endpoints
 * Attach a Service with a custom DNS name via
 * {@link PrivateNetworkEndpoint}.
 *
 * **Example:** Endpoint on the network
 * ```typescript
 * const api = yield* Railway.Service("Api", {
 *   project: site,
 *   image: "hashicorp/http-echo",
 * });
 * const endpoint = yield* Railway.PrivateNetworkEndpoint("ApiDns", {
 *   network: net,
 *   service: api,
 *   name: "api",
 * });
 * ```
 *
 * ### Module-scope declarations
 * Resource-valued props accept the resource or an Effect producing it.
 *
 * **Example:** Module-scope network
 * ```typescript
 * // src/network.ts
 * import * as Railway from "alchemy/Railway";
 *
 * export const Site = Railway.Project("Site");
 * export const Mesh = Railway.PrivateNetwork("Mesh", {
 *   environment: Site,
 * });
 * ```
 *
 * @resource
 */
export declare const PrivateNetwork: typeof PrivateNetworkResource;
declare const PrivateNetworkNotCreated_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "Railway.PrivateNetworkNotCreated";
} & Readonly<A>;
export declare class PrivateNetworkNotCreated extends PrivateNetworkNotCreated_base<{
    name: string;
    environmentId: string;
}> {
}
declare const PrivateNetworkEnvironmentRequired_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "Railway.PrivateNetworkEnvironmentRequired";
} & Readonly<A>;
export declare class PrivateNetworkEnvironmentRequired extends PrivateNetworkEnvironmentRequired_base<{
    message: string;
}> {
}
export declare const PrivateNetworkProvider: () => import("effect/Layer").Layer<Provider.Provider<PrivateNetwork>, never, import("./Environment.ts").RailwayEnvironment | import("../Stack.ts").Stack | import("../Stage.ts").Stage | railway.RailwayOpContext>;
/**
 * Network identity an endpoint attaches to. Accepts a
 * `Railway.PrivateNetwork` or a `{ publicId, environmentId? }` stub.
 */
export type PrivateNetworkEndpointNetwork = {
    readonly publicId: string;
    readonly environmentId?: string;
    readonly projectId?: string;
    readonly dnsName?: string;
};
/**
 * Service identity an endpoint attaches to. Accepts a `Railway.Service`
 * or a `{ serviceId, name? }` stub.
 */
export type PrivateNetworkEndpointService = {
    readonly serviceId: string;
    readonly name?: string;
};
export interface PrivateNetworkEndpointProps {
    /**
     * Parent named network. Accepts a `Railway.PrivateNetwork` or
     * `{ publicId }`. Changing it replaces the endpoint.
     */
    network: Ref<PrivateNetworkEndpointNetwork>;
    /**
     * Service the endpoint advertises. Accepts a `Railway.Service` or
     * `{ serviceId }`. Changing it replaces the endpoint.
     */
    service: Ref<PrivateNetworkEndpointService>;
    /**
     * DNS prefix for this endpoint (the label before the network
     * `dnsName`). Defaults to the Service name. Updates in place via
     * `privateNetworkEndpointRename`.
     */
    name?: string;
}
export type PrivateNetworkEndpoint = Resource<"Railway.PrivateNetworkEndpoint", PrivateNetworkEndpointProps, {
    /** Railway public endpoint id. */
    publicId: string;
    /** Observed DNS name (`{prefix}.{networkDns}`). */
    dnsName: string;
    /** Pending DNS name while a rename is in flight, if any. */
    newDnsName: string | undefined;
    /** Internal IPs advertised on the mesh. */
    privateIps: string[];
    /** Service instance the endpoint is bound to. */
    serviceInstanceId: string;
    /** Parent service id. */
    serviceId: string;
    /** Parent network public id. */
    privateNetworkId: string;
    /** Environment the endpoint lives in. */
    environmentId: string;
    /** Parent Railway project id, if known. */
    projectId: string | undefined;
    /** Observed Railway sync status (`ACTIVE`, `CREATING`, …). */
    syncStatus: PrivateNetworkEndpointSyncStatus;
    /** Observed tags. */
    tags: string[];
    /** RFC3339 creation timestamp, if Railway reported one. */
    createdAt: string | undefined;
}, never, Providers>;
declare const PrivateNetworkEndpointResource: import("../Resource.ts").ResourceClass<PrivateNetworkEndpoint>;
/**
 * A Railway.PrivateNetworkEndpoint is a per-service DNS name on a
 * {@link PrivateNetwork}. Create-or-get is idempotent for a given
 * `(network, service)`. `name` is the DNS prefix and updates in place.
 *
 * @see https://docs.railway.com/networking/private-networking
 *
 * ### Attach a service
 * Pass the network and the Service. Omit `name` to use the Service name
 * as the DNS prefix.
 *
 * **Example:** Default prefix
 * ```typescript
 * const endpoint = yield* Railway.PrivateNetworkEndpoint("ApiDns", {
 *   network: net,
 *   service: api,
 * });
 * ```
 *
 * ### Custom DNS name
 * `name` is the label other services use (`name.{network.dnsName}`).
 * Updating it renames in place.
 *
 * **Example:** Custom prefix
 * ```typescript
 * const endpoint = yield* Railway.PrivateNetworkEndpoint("ApiDns", {
 *   network: net,
 *   service: api,
 *   name: "api",
 * });
 * ```
 *
 * :::caution[Changing `network` or `service` replaces the endpoint]
 * The old endpoint is deleted. The new pair is create-or-got.
 * :::
 *
 * @resource
 */
export declare const PrivateNetworkEndpoint: typeof PrivateNetworkEndpointResource;
declare const PrivateNetworkEndpointNotCreated_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "Railway.PrivateNetworkEndpointNotCreated";
} & Readonly<A>;
export declare class PrivateNetworkEndpointNotCreated extends PrivateNetworkEndpointNotCreated_base<{
    privateNetworkId: string;
    serviceId: string;
}> {
}
declare const PrivateNetworkEndpointTargetMissing_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "Railway.PrivateNetworkEndpointTargetMissing";
} & Readonly<A>;
export declare class PrivateNetworkEndpointTargetMissing extends PrivateNetworkEndpointTargetMissing_base<{
    message: string;
}> {
}
export declare const PrivateNetworkEndpointProvider: () => import("effect/Layer").Layer<Provider.Provider<PrivateNetworkEndpoint>, never, import("./Environment.ts").RailwayEnvironment | railway.RailwayOpContext>;
export {};
//# sourceMappingURL=PrivateNetwork.d.ts.map