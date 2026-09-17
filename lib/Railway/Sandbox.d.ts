import type { ExecSandboxResponse, SandboxHeartbeatResponse, SandboxNetworkIsolation, SandboxStatus } from "@distilled.cloud/railway";
import * as railway from "@distilled.cloud/railway";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Binding from "../Binding.ts";
import * as Provider from "../Provider.ts";
import { Resource } from "../Resource.ts";
import type { RuntimeContext } from "../RuntimeContext.ts";
import type { Providers } from "./Providers.ts";
/**
 * A resource-valued prop: the resource itself, or an Effect that produces
 * it (so `yield* Project(...)` and `Project(...)` both type-check).
 */
type Ref<T> = T | Effect.Effect<T, never, Providers>;
/**
 * Environment identity a Sandbox is created in. Accepts a
 * `Railway.Project` (its primary environment), a `Railway.Environment`,
 * or an `{ environmentId }` stub.
 */
export type SandboxEnvironment = {
    readonly environmentId: string;
    readonly projectId?: string;
};
/**
 * Sandbox identity for {@link Exec} / helpers. Accepts a
 * `Railway.Sandbox` or a `{ sandboxId, environmentId }` stub.
 */
export type SandboxIdentity = {
    readonly sandboxId: string;
    readonly environmentId: string;
};
/**
 * Create-time template for a sandbox. Mutually exclusive `instructions`
 * (build a recipe) and `name` (boot from a named checkpoint).
 */
export interface SandboxTemplate {
    /** Digest of the base image. */
    baseImageDigest?: string;
    /**
     * Build a template by running these shell instructions on the base
     * image. Mutually exclusive with `name`.
     */
    instructions?: readonly string[];
    /**
     * Boot from a saved checkpoint with this name. Mutually exclusive
     * with `instructions`.
     */
    name?: string;
    /**
     * Environment variables available to the template's build
     * instructions. Values may contain Railway variable references.
     */
    variables?: Record<string, string>;
}
export interface SandboxProps {
    /**
     * Environment to create the sandbox in. Accepts a `Railway.Project`
     * (primary environment), a `Railway.Environment`, or
     * `{ environmentId }`. Changing it replaces the Sandbox.
     */
    environment: Ref<SandboxEnvironment>;
    /**
     * Region to place the sandbox in (`us-west2`, `us-east4-eqdc4a`, …).
     * Defaults to US West when omitted. Changing it replaces the Sandbox.
     */
    region?: string;
    /**
     * Minutes of idle time before Railway auto-destroys the sandbox.
     * Plan-dependent default and maximum. Changing it replaces the
     * Sandbox — there is no update API.
     */
    idleTimeoutMinutes?: number;
    /**
     * Network access. `ISOLATED` (default) has outbound internet only.
     * `PRIVATE` also joins the environment's private network. Changing
     * it replaces the Sandbox.
     */
    networkIsolation?: SandboxNetworkIsolation;
    /**
     * Template to boot from: build instructions, or a named checkpoint.
     * Changing it replaces the Sandbox.
     */
    template?: SandboxTemplate;
    /**
     * Environment variables baked into the sandbox, available to every
     * command. Values may contain Railway variable references, resolved
     * at create time. Changing them replaces the Sandbox.
     */
    variables?: Record<string, string>;
}
export type Sandbox = Resource<"Railway.Sandbox", SandboxProps, {
    /** Railway sandbox id. */
    sandboxId: string;
    /** Environment the sandbox lives in. */
    environmentId: string;
    /** Parent Railway project id, if known. */
    projectId: string | undefined;
    /** Region the sandbox was placed in. */
    region: string;
    /** Observed status (`CREATING`, `RUNNING`, `FAILED`, …). */
    status: SandboxStatus;
    /** Idle timeout in minutes, or `undefined` when Railway omitted it. */
    idleTimeoutMinutes: number | undefined;
    /** Network isolation mode. */
    networkIsolation: SandboxNetworkIsolation;
    /** RFC3339 creation timestamp. */
    createdAt: string;
}, never, Providers>;
declare const SandboxResource: import("../Resource.ts").ResourceClass<Sandbox>;
/**
 * A Railway.Sandbox is an ephemeral Linux VM in an environment. Create
 * it, {@link execSandbox} commands, snapshot with checkpoints, and
 * destroy it when the task is done. Sandboxes are Priority Boarding.
 *
 * Railway has no labels and sandboxes have no names. Identity is the
 * Railway sandbox id. There is no in-place update — changing
 * `environment`, `region`, `idleTimeoutMinutes`, `networkIsolation`,
 * `template`, or `variables` replaces the Sandbox.
 *
 * @see https://docs.railway.com/sandboxes
 * @see https://docs.railway.com/guides/code-execution-sandboxes
 *
 * ### Create a Sandbox
 * Pass a Project (or Environment). Alchemy waits until the sandbox is
 * `RUNNING` and ready to exec.
 *
 * **Example:** From a Project
 * ```typescript
 * const site = yield* Railway.Project("Site");
 * const box = yield* Railway.Sandbox("Box", {
 *   environment: site,
 * });
 * ```
 *
 * :::caution[Changing `environment` or `region` replaces the Sandbox]
 * A new VM is created. The old sandbox is destroyed.
 * :::
 *
 * ### Idle timeout
 * Railway auto-destroys a sandbox after it sits idle. Exec and SSH
 * reset the timer; processes inside do not. Hobby/Pro default is 30
 * minutes (max 120). Trial/Free default and max is 5.
 *
 * **Example:** Short idle timeout
 * ```typescript
 * const box = yield* Railway.Sandbox("Box", {
 *   environment: site,
 *   idleTimeoutMinutes: 5,
 * });
 * ```
 *
 * :::caution[Changing `idleTimeoutMinutes` replaces the Sandbox]
 * There is no sandbox update API.
 * :::
 *
 * ### Variables
 * Baked into the sandbox at create time. Available to every command.
 *
 * **Example:** Create-time env
 * ```typescript
 * const box = yield* Railway.Sandbox("Box", {
 *   environment: site,
 *   variables: { NODE_ENV: "production" },
 * });
 * ```
 *
 * ### Template
 * Boot from a named checkpoint, or from build instructions.
 *
 * **Example:** Checkpoint
 * ```typescript
 * const box = yield* Railway.Sandbox("Box", {
 *   environment: site,
 *   template: { name: "after-deps" },
 * });
 * ```
 *
 * ### Exec
 * Run a command after deploy with {@link execSandbox} or {@link Exec}.
 *
 * **Example:** Echo
 * ```typescript
 * const result = yield* Railway.execSandbox({
 *   sandboxId: box.sandboxId,
 *   environmentId: box.environmentId,
 *   command: "echo hello",
 * });
 * ```
 *
 * ### Module-scope declarations
 * Resource-valued props accept the resource or an Effect producing it.
 *
 * **Example:** Module-scope Sandbox
 * ```typescript
 * // src/box.ts
 * import * as Railway from "alchemy/Railway";
 *
 * export const Site = Railway.Project("Site");
 * export const Box = Railway.Sandbox("Box", {
 *   environment: Site,
 *   idleTimeoutMinutes: 10,
 * });
 * ```
 *
 * @resource
 */
export declare const Sandbox: typeof SandboxResource;
declare const SandboxNotCreated_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "Railway.SandboxNotCreated";
} & Readonly<A>;
export declare class SandboxNotCreated extends SandboxNotCreated_base<{
    environmentId: string;
}> {
}
declare const SandboxEnvironmentRequired_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "Railway.SandboxEnvironmentRequired";
} & Readonly<A>;
export declare class SandboxEnvironmentRequired extends SandboxEnvironmentRequired_base<{
    message: string;
}> {
}
declare const SandboxFailed_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "Railway.SandboxFailed";
} & Readonly<A>;
export declare class SandboxFailed extends SandboxFailed_base<{
    sandboxId: string;
    status: string;
}> {
}
declare const SandboxCheckpointNotFound_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "Railway.SandboxCheckpointNotFound";
} & Readonly<A>;
export declare class SandboxCheckpointNotFound extends SandboxCheckpointNotFound_base<{
    environmentId: string;
    name: string;
}> {
}
/**
 * Execute a command inside a running sandbox. Does not fail on a
 * non-zero exit code — inspect `exitCode`.
 */
export declare const execSandbox: (input: {
    sandboxId: string;
    environmentId: string;
    command: string;
    timeoutSec?: number;
}) => Effect.Effect<ExecSandboxResponse, railway.RailwayOpError, railway.RailwayOpContext>;
/**
 * Extend a sandbox's idle timeout from the last interaction.
 */
export declare const heartbeatSandbox: (input: {
    sandboxId: string;
    environmentId: string;
}) => Effect.Effect<SandboxHeartbeatResponse, railway.RailwayOpError, railway.RailwayOpContext>;
/**
 * Capture a running sandbox's disk as a named checkpoint. Synchronous:
 * the checkpoint is ready when this returns. Reusing a name replaces
 * the previous checkpoint.
 */
export declare const createSandboxCheckpoint: (input: {
    sandboxId: string;
    environmentId: string;
    name: string;
}) => Effect.Effect<railway.CreateSandboxCheckpointResponse, railway.RailwayOpError, railway.RailwayOpContext>;
/**
 * List named sandbox checkpoints in an environment (newest first).
 */
export declare const listSandboxCheckpoints: (input: {
    environmentId: string;
}) => Effect.Effect<railway.SandboxCheckpointsResultList, railway.RailwayOpError, railway.RailwayOpContext>;
/**
 * Rename a sandbox checkpoint by its current name (`key`).
 */
export declare const renameSandboxCheckpoint: (input: {
    environmentId: string;
    name: string;
    newName: string;
}) => Effect.Effect<railway.RenameSandboxCheckpointResponse, SandboxCheckpointNotFound | railway.RailwayOpError, railway.RailwayOpContext>;
/**
 * Delete a sandbox checkpoint by name (`key`). Idempotent if missing.
 */
export declare const deleteSandboxCheckpoint: (input: {
    environmentId: string;
    name: string;
}) => Effect.Effect<void, railway.BadGateway | railway.BadRequest | railway.Conflict | railway.Forbidden | railway.GatewayTimeout | import("effect/unstable/http/HttpClientError").HttpClientError | railway.InternalServerError | railway.Locked | railway.NotFound | railway.RailwayForbidden | railway.RailwayInternalError | railway.RailwayNotFound | railway.RailwayParseError | railway.RailwayPlanLimitExceeded | railway.RailwayRateLimited | railway.RailwayServiceDomainCreateFailed | railway.RailwayUnauthenticated | railway.RailwayValidationError | railway.ServiceUnavailable | railway.TooManyRequests | railway.Unauthorized | railway.UnknownRailwayError | railway.UnprocessableEntity, railway.RailwayOpContext>;
export type ExecRequest = {
    command: string;
    timeoutSec?: number;
};
export type ExecResult = ExecSandboxResponse;
/**
 * Run a command inside a {@link Sandbox}. Control-plane GraphQL —
 * provide {@link ExecHttp}. The inner Effect requires
 * {@link RuntimeContext} so it is typed as runtime-only; from tests
 * prefer {@link execSandbox}.
 *
 *
 * ### Exec
 * **Example:** Echo
 * ```typescript
 * const run = yield* Railway.Exec(box);
 * const result = yield* run({ command: "echo hello" });
 * ```
 *
 * @binding
 * @product Railway
 */
export interface Exec extends Binding.Service<Exec, "Railway.Sandbox.Exec", (sandbox: SandboxIdentity) => Effect.Effect<ExecClient>> {
}
export declare const Exec: Exec;
export interface ExecClient {
    (request: ExecRequest): Effect.Effect<ExecResult, railway.ExecSandboxError, RuntimeContext>;
}
/**
 * HTTP / GraphQL implementation of {@link Exec}.
 *
 * @layer
 * @provides Railway.Sandbox.Exec
 */
export declare const ExecHttp: Layer.Layer<Exec, never, never>;
export declare const SandboxProvider: () => Layer.Layer<Provider.Provider<Sandbox>, never, import("./Environment.ts").RailwayEnvironment | railway.RailwayOpContext>;
export {};
//# sourceMappingURL=Sandbox.d.ts.map