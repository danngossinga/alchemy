import * as Config from "effect/Config";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { type CloudflareResolvedCredentials } from "./Auth/AuthConfig.ts";
declare const CloudflareEnvironment_base: Context.ServiceClass<CloudflareEnvironment, "Cloudflare::CloudflareEnvironment", Effect.Effect<CloudflareResolvedCredentials, never, never>>;
export declare class CloudflareEnvironment extends CloudflareEnvironment_base {
    readonly kind: "Environment";
}
export declare const fromEnv: () => Layer.Layer<CloudflareEnvironment, Config.ConfigError, never>;
export declare const fromProfile: () => Layer.Layer<CloudflareEnvironment, import("../Auth/AuthProvider.ts").AuthError | Config.ConfigError | import("../Auth/Profile.ts").MissingProviderConfig | import("effect/PlatformError").PlatformError | import("../Auth/Profile.ts").ProfileError, import("../index.ts").AuthProviders | import("../Auth/Profile.ts").ProfileStore>;
export {};
//# sourceMappingURL=CloudflareEnvironment.d.ts.map