/**
 * Alchemy's public Cloudflare OAuth client registration. The client is
 * public (PKCE, no secret); rotating it invalidates previously stored
 * credentials, which {@link usesCurrentClient} detects for a clean
 * re-login.
 */
export declare const OAUTH_CLIENT_ID = "e7e25ec474419def6ba38d2d2638b122";
export declare const OAUTH_REDIRECT_URI = "https://alchemy.run/auth/callback";
export declare const OAUTH_LOCAL_CALLBACK_URI = "http://localhost:9976/auth/callback";
export declare const OAUTH_ENDPOINTS: {
    authorize: string;
    token: string;
    revoke: string;
};
export { OAuthCredentials, OAuthError, type Authorization, } from "../../Auth/OAuthFlow.ts";
export declare const { authorize, callback, exchange, exchangeCallbackInput, refresh, revoke, usesCurrentClient, }: import("../../Auth/OAuthFlow.ts").OAuthClient;
//# sourceMappingURL=OAuthClient.d.ts.map