import * as Effect from "effect/Effect";
import { recordCli } from "../../Telemetry/Metrics.js";
export const instrumentCommand = (command, attrs) => (handler) => (args) => handler(args).pipe(Effect.withSpan(`cli.${command}`, {
    attributes: attrs ? attrs(args) : {},
}), recordCli(command));
//# sourceMappingURL=instrument.js.map