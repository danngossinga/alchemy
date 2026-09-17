import * as Effect from "effect/Effect";
export declare const instrumentCommand: <AttrsArgs = unknown>(command: string, attrs?: (args: AttrsArgs) => Record<string, unknown>) => <Args extends AttrsArgs, A, E, R>(handler: (args: Args) => Effect.Effect<A, E, R>) => ((args: Args) => Effect.Effect<A, E, R>);
//# sourceMappingURL=instrument.d.ts.map