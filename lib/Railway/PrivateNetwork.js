import * as railway from "@distilled.cloud/railway";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Schedule from "effect/Schedule";
import * as Stream from "effect/Stream";
import { Unowned } from "../AdoptPolicy.js";
import { isResolved } from "../Diff.js";
import * as Provider from "../Provider.js";
import { Resource } from "../Resource.js";
import { createRailwayName, matchesAlchemyPhysicalName, sanitizeRailwayName, } from "./Metadata.js";
import { ownedProjects, projectEnvironmentIds } from "./Project.js";
const ALCHEMY_TAG = "alchemy";
const resolvePrivateNetworkProps = (props) => Effect.gen(function* () {
    const resolved = Effect.isEffect(props) ? yield* props : props;
    if (globalThis.__ALCHEMY_RUNTIME__)
        return resolved;
    const environment = Effect.isEffect(resolved.environment)
        ? yield* resolved.environment
        : resolved.environment;
    return { ...resolved, environment };
});
const PrivateNetworkResource = Resource("Railway.PrivateNetwork");
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
export const PrivateNetwork = Object.assign((id, props) => PrivateNetworkResource(id, resolvePrivateNetworkProps(props)), PrivateNetworkResource);
export class PrivateNetworkNotCreated extends Data.TaggedError("Railway.PrivateNetworkNotCreated") {
}
export class PrivateNetworkEnvironmentRequired extends Data.TaggedError("Railway.PrivateNetworkEnvironmentRequired") {
}
const environmentIdOf = (value) => {
    if (value === null || typeof value !== "object")
        return undefined;
    const rec = value;
    return typeof rec.environmentId === "string" && rec.environmentId.length > 0
        ? rec.environmentId
        : undefined;
};
const projectIdOf = (value) => {
    if (value === null || typeof value !== "object")
        return undefined;
    const rec = value;
    return typeof rec.projectId === "string" && rec.projectId.length > 0
        ? rec.projectId
        : undefined;
};
const publicIdOf = (value) => {
    if (value === null || typeof value !== "object")
        return undefined;
    const rec = value;
    return typeof rec.publicId === "string" && rec.publicId.length > 0
        ? rec.publicId
        : undefined;
};
const isGoneNetwork = (network) => network === undefined || network.deletedAt != null;
const toNetworkAttrs = (network, fallback) => ({
    publicId: network.publicId,
    networkId: String(network.networkId),
    name: network.name || fallback?.name || "",
    dnsName: network.dnsName,
    projectId: network.projectId || fallback?.projectId || "",
    environmentId: network.environmentId,
    tags: network.tags ?? [],
    createdAt: network.createdAt ?? undefined,
});
const resolveNetworkName = (id, name, existing) => Effect.gen(function* () {
    if (name !== undefined)
        return sanitizeRailwayName(name);
    if (existing !== undefined)
        return existing;
    return yield* createRailwayName(id);
});
const listNetworks = (environmentId) => railway.privateNetworks({ environmentId }).pipe(Effect.map((items) => items.filter((network) => !isGoneNetwork(network))), Effect.catchTag(["RailwayNotFound", "NotFound"], () => Effect.succeed([])));
const findNetwork = (environmentId, match) => listNetworks(environmentId).pipe(Effect.map((networks) => networks.find(match)));
const listEnvironmentIds = (project) => railway.environments.items({ projectId: project.projectId, first: 50 }).pipe(Stream.filter((env) => env.deletedAt == null), Stream.map((env) => env.id), Stream.runCollect, Effect.map((ids) => {
    const set = new Set(Array.from(ids));
    if (project.environmentId.length > 0) {
        set.add(project.environmentId);
    }
    return Array.from(set);
}), Effect.catchTag(["RailwayNotFound", "NotFound"], () => Effect.succeed(project.environmentId.length > 0 ? [project.environmentId] : [])));
const observeNetwork = Effect.fn(function* (input) {
    if (input.publicId !== undefined && input.publicId.length > 0) {
        const byId = yield* findNetwork(input.environmentId, (network) => network.publicId === input.publicId);
        if (byId !== undefined)
            return byId;
    }
    if (input.name !== undefined && input.name.length > 0) {
        return yield* findNetwork(input.environmentId, (network) => network.name === input.name);
    }
    return undefined;
});
const ensureNetwork = (input) => railway
    .privateNetworkCreateOrGet({
    input: {
        environmentId: input.environmentId,
        projectId: input.projectId,
        name: input.name,
        tags: [ALCHEMY_TAG],
    },
})
    .pipe(Effect.map((network) => (isGoneNetwork(network) ? undefined : network)));
export const PrivateNetworkProvider = () => Provider.succeed(PrivateNetwork, {
    stables: ["publicId", "networkId", "projectId", "environmentId"],
    // Railway has no per-network delete; the mesh is torn down with the
    // environment/project. Skip nuke so we don't loop on a no-op delete.
    nuke: { skip: true, dependsOn: ["Railway.Project"] },
    diff: Effect.fn(function* ({ news, output }) {
        if (news === undefined || !isResolved(news))
            return undefined;
        if (output === undefined)
            return undefined;
        const environmentId = environmentIdOf(news.environment);
        const environmentChanged = environmentId !== undefined && environmentId !== output.environmentId;
        const nameChanged = news.name !== undefined &&
            sanitizeRailwayName(news.name) !== output.name;
        if (environmentChanged || nameChanged) {
            return { action: "replace" };
        }
        return undefined;
    }),
    read: Effect.fn(function* ({ id, olds, output }) {
        const environmentId = output?.environmentId ?? environmentIdOf(olds?.environment);
        const name = yield* resolveNetworkName(id, olds?.name, output?.name);
        if (environmentId === undefined)
            return undefined;
        const found = yield* observeNetwork({
            environmentId,
            publicId: output?.publicId,
            name,
        });
        if (found === undefined)
            return undefined;
        const attrs = toNetworkAttrs(found, {
            name,
            projectId: output?.projectId ?? projectIdOf(olds?.environment),
        });
        if (output !== undefined)
            return attrs;
        return matchesAlchemyPhysicalName(found.name) ? attrs : Unowned(attrs);
    }),
    list: Effect.fn(function* () {
        const projects = yield* ownedProjects();
        const rows = yield* Effect.forEach(projects, (project) => Effect.gen(function* () {
            const envIds = yield* projectEnvironmentIds(project);
            const nested = yield* Effect.forEach(envIds, (environmentId) => listNetworks(environmentId).pipe(Effect.map((networks) => networks
                .filter((network) => matchesAlchemyPhysicalName(network.name))
                .map((network) => toNetworkAttrs(network, {
                projectId: project.projectId,
            })))));
            return nested.flat();
        }));
        const seen = new Set();
        const unique = [];
        for (const row of rows.flat()) {
            if (seen.has(row.publicId))
                continue;
            seen.add(row.publicId);
            unique.push(row);
        }
        return unique;
    }),
    reconcile: Effect.fn(function* ({ id, news, output }) {
        const props = news ?? {};
        const environmentId = environmentIdOf(props.environment) ?? output?.environmentId;
        const projectId = projectIdOf(props.environment) ?? output?.projectId;
        if (environmentId === undefined || projectId === undefined) {
            return yield* new PrivateNetworkEnvironmentRequired({
                message: "PrivateNetwork requires an environment with environmentId and projectId (pass a Railway.Project or Railway.Environment)",
            });
        }
        const name = yield* resolveNetworkName(id, props.name, output?.name);
        let current = yield* observeNetwork({
            environmentId,
            publicId: output?.publicId,
            name,
        });
        if (current === undefined) {
            current = yield* ensureNetwork({
                environmentId,
                projectId,
                name,
            });
            if (current === undefined) {
                current = yield* observeNetwork({ environmentId, name });
            }
        }
        if (current === undefined || isGoneNetwork(current)) {
            return yield* new PrivateNetworkNotCreated({
                name,
                environmentId,
            });
        }
        return toNetworkAttrs(current, { name, projectId });
    }),
    delete: Effect.fn(function* () {
        // No per-network delete. `privateNetworksForEnvironmentDelete` would
        // also tear down the default mesh. The network is removed with the
        // parent Project / Environment.
    }),
});
const resolvePrivateNetworkEndpointProps = (props) => Effect.gen(function* () {
    const resolved = Effect.isEffect(props) ? yield* props : props;
    if (globalThis.__ALCHEMY_RUNTIME__)
        return resolved;
    const network = Effect.isEffect(resolved.network)
        ? yield* resolved.network
        : resolved.network;
    const service = Effect.isEffect(resolved.service)
        ? yield* resolved.service
        : resolved.service;
    return { ...resolved, network, service };
});
const PrivateNetworkEndpointResource = Resource("Railway.PrivateNetworkEndpoint");
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
export const PrivateNetworkEndpoint = Object.assign((id, props) => PrivateNetworkEndpointResource(id, resolvePrivateNetworkEndpointProps(props)), PrivateNetworkEndpointResource);
export class PrivateNetworkEndpointNotCreated extends Data.TaggedError("Railway.PrivateNetworkEndpointNotCreated") {
}
export class PrivateNetworkEndpointTargetMissing extends Data.TaggedError("Railway.PrivateNetworkEndpointTargetMissing") {
}
const serviceIdOf = (value) => {
    if (value === null || typeof value !== "object")
        return undefined;
    const rec = value;
    return typeof rec.serviceId === "string" && rec.serviceId.length > 0
        ? rec.serviceId
        : undefined;
};
const serviceNameOf = (value) => {
    if (value === null || typeof value !== "object")
        return undefined;
    const rec = value;
    return typeof rec.name === "string" && rec.name.length > 0
        ? rec.name
        : undefined;
};
const goneEndpointStatus = (status) => status === "DELETED" || status === "DELETING";
const isGoneEndpoint = (endpoint) => endpoint == null ||
    endpoint.deletedAt != null ||
    goneEndpointStatus(endpoint.syncStatus);
const dnsPrefix = (dnsName) => dnsName
    .replace(/\.+$/, "")
    .replace(/\.railway\.internal$/i, "")
    .split(".")
    .filter((part) => part.length > 0)[0] ?? dnsName;
const toEndpointAttrs = (endpoint, fallback) => ({
    publicId: endpoint.publicId,
    dnsName: endpoint.dnsName,
    newDnsName: endpoint.newDnsName ?? undefined,
    privateIps: endpoint.privateIps ?? [],
    serviceInstanceId: endpoint.serviceInstanceId,
    serviceId: fallback.serviceId,
    privateNetworkId: fallback.privateNetworkId,
    environmentId: fallback.environmentId,
    projectId: fallback.projectId,
    syncStatus: endpoint.syncStatus,
    tags: endpoint.tags ?? [],
    createdAt: endpoint.createdAt ?? undefined,
});
const getEndpoint = (input) => railway.privateNetworkEndpoint(input).pipe(Effect.map((endpoint) => endpoint == null || isGoneEndpoint(endpoint) ? undefined : endpoint), Effect.catchTag(["RailwayNotFound", "NotFound"], () => Effect.succeed(undefined)));
const resolveServiceName = (serviceId, hint) => hint !== undefined && hint.length > 0
    ? Effect.succeed(hint)
    : railway.service({ id: serviceId }).pipe(Effect.map((service) => service.name), Effect.catchTag(["RailwayNotFound", "NotFound"], () => Effect.succeed(sanitizeRailwayName(serviceId))));
const listProjectServices = (projectId) => railway.project({ id: projectId }).pipe(Effect.map((project) => project.services.edges
    .map((edge) => edge.node)
    .filter((node) => node.deletedAt == null)), Effect.catchTag(["RailwayNotFound", "NotFound"], () => Effect.succeed([])));
const waitUntilEndpointGone = (input) => getEndpoint(input).pipe(Effect.map((endpoint) => endpoint === undefined), Effect.repeat({
    schedule: Schedule.spaced("1 second"),
    until: (gone) => gone,
    times: 8,
}));
const waitUntilEndpointNamed = (input) => getEndpoint(input).pipe(Effect.flatMap((endpoint) => {
    if (endpoint == null || dnsPrefix(endpoint.dnsName) !== input.prefix) {
        return Effect.fail(new PrivateNetworkEndpointNotCreated({
            privateNetworkId: input.privateNetworkId,
            serviceId: input.serviceId,
        }));
    }
    return Effect.succeed(endpoint);
}), Effect.retry({
    while: (e) => e._tag === "Railway.PrivateNetworkEndpointNotCreated",
    times: 8,
    schedule: Schedule.spaced("1 second"),
}), Effect.catchTag("Railway.PrivateNetworkEndpointNotCreated", () => getEndpoint(input)));
export const PrivateNetworkEndpointProvider = () => Provider.succeed(PrivateNetworkEndpoint, {
    stables: [
        "publicId",
        "serviceId",
        "privateNetworkId",
        "environmentId",
        "serviceInstanceId",
    ],
    nuke: {
        dependsOn: [
            "Railway.PrivateNetwork",
            "Railway.Service",
            "Railway.Project",
        ],
    },
    diff: Effect.fn(function* ({ news, output }) {
        if (news === undefined || !isResolved(news))
            return undefined;
        if (output === undefined)
            return undefined;
        const serviceId = serviceIdOf(news.service);
        const serviceChanged = serviceId !== undefined && serviceId !== output.serviceId;
        const networkId = publicIdOf(news.network);
        const networkChanged = networkId !== undefined && networkId !== output.privateNetworkId;
        if (serviceChanged || networkChanged) {
            return { action: "replace" };
        }
        return undefined;
    }),
    read: Effect.fn(function* ({ olds, output }) {
        const serviceId = output?.serviceId ?? serviceIdOf(olds?.service);
        const privateNetworkId = output?.privateNetworkId ?? publicIdOf(olds?.network);
        const environmentId = output?.environmentId ??
            environmentIdOf(olds?.network) ??
            environmentIdOf(olds);
        if (serviceId === undefined ||
            privateNetworkId === undefined ||
            environmentId === undefined) {
            return undefined;
        }
        const found = yield* getEndpoint({
            environmentId,
            privateNetworkId,
            serviceId,
        });
        if (found === undefined)
            return undefined;
        return toEndpointAttrs(found, {
            serviceId,
            privateNetworkId,
            environmentId,
            projectId: output?.projectId ?? projectIdOf(olds?.network),
        });
    }),
    list: Effect.fn(function* () {
        const projects = yield* ownedProjects();
        const rows = yield* Effect.forEach(projects, (project) => Effect.gen(function* () {
            const networks = yield* listNetworks(project.environmentId);
            const owned = networks.filter((network) => matchesAlchemyPhysicalName(network.name));
            const live = yield* railway
                .project({ id: project.projectId })
                .pipe(Effect.catchTag(["RailwayNotFound", "NotFound"], () => Effect.succeed(undefined)));
            const services = (live?.services.edges.map((edge) => edge.node) ?? []).filter((service) => service.deletedAt == null);
            const nested = yield* Effect.forEach(owned, (network) => Effect.forEach(services, (service) => getEndpoint({
                environmentId: project.environmentId,
                privateNetworkId: network.publicId,
                serviceId: service.id,
            }).pipe(Effect.map((endpoint) => endpoint === undefined
                ? undefined
                : toEndpointAttrs(endpoint, {
                    serviceId: service.id,
                    privateNetworkId: network.publicId,
                    environmentId: project.environmentId,
                    projectId: project.projectId,
                })))).pipe(Effect.map((items) => items.filter((item) => item !== undefined))));
            return nested.flat();
        }));
        return rows.flat();
    }),
    reconcile: Effect.fn(function* ({ news, output }) {
        const props = news ?? {};
        const serviceId = serviceIdOf(props.service) ?? output?.serviceId;
        const privateNetworkId = publicIdOf(props.network) ?? output?.privateNetworkId;
        const environmentId = environmentIdOf(props.network) ?? output?.environmentId;
        const projectId = projectIdOf(props.network) ?? output?.projectId;
        if (serviceId === undefined ||
            privateNetworkId === undefined ||
            environmentId === undefined) {
            return yield* new PrivateNetworkEndpointTargetMissing({
                message: "PrivateNetworkEndpoint requires a network (publicId + environmentId) and a service",
            });
        }
        const serviceName = yield* resolveServiceName(serviceId, serviceNameOf(props.service));
        const desiredPrefix = props.name !== undefined
            ? sanitizeRailwayName(props.name)
            : sanitizeRailwayName(serviceName);
        let current = yield* getEndpoint({
            environmentId,
            privateNetworkId,
            serviceId,
        });
        if (current === undefined) {
            const created = yield* railway
                .privateNetworkEndpointCreateOrGet({
                input: {
                    environmentId,
                    privateNetworkId,
                    serviceId,
                    serviceName: desiredPrefix,
                    tags: [ALCHEMY_TAG],
                },
            })
                .pipe(Effect.map((endpoint) => isGoneEndpoint(endpoint) ? undefined : endpoint));
            current =
                created ??
                    (yield* getEndpoint({
                        environmentId,
                        privateNetworkId,
                        serviceId,
                    }));
        }
        if (current === undefined || isGoneEndpoint(current)) {
            return yield* new PrivateNetworkEndpointNotCreated({
                privateNetworkId,
                serviceId,
            });
        }
        if (current != null && dnsPrefix(current.dnsName) !== desiredPrefix) {
            const available = yield* railway.privateNetworkEndpointNameAvailable({
                environmentId,
                privateNetworkId,
                prefix: desiredPrefix,
            });
            if (available) {
                yield* railway.renamePrivateNetworkEndpoint({
                    dnsName: desiredPrefix,
                    id: current.publicId,
                    privateNetworkId,
                });
                current =
                    (yield* waitUntilEndpointNamed({
                        environmentId,
                        privateNetworkId,
                        serviceId,
                        prefix: desiredPrefix,
                    })) ?? current;
            }
        }
        return toEndpointAttrs(current, {
            serviceId,
            privateNetworkId,
            environmentId,
            projectId,
        });
    }),
    delete: Effect.fn(function* ({ output }) {
        const id = output.publicId;
        if (id.length === 0)
            return;
        yield* railway
            .deletePrivateNetworkEndpoint({ id })
            .pipe(Effect.catchTag(["RailwayNotFound", "NotFound"], () => Effect.void));
        if (output.environmentId.length > 0 &&
            output.privateNetworkId.length > 0 &&
            output.serviceId.length > 0) {
            yield* waitUntilEndpointGone({
                environmentId: output.environmentId,
                privateNetworkId: output.privateNetworkId,
                serviceId: output.serviceId,
            });
        }
    }),
});
//# sourceMappingURL=PrivateNetwork.js.map