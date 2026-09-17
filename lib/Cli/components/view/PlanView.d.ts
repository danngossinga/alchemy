/** @jsxImportSource react */
/**
 * THE plan renderer. Every surface that shows a plan tree — `alchemy plan`
 * output, the approval prompt, and the live apply/dev/destroy progress —
 * renders through this one state-driven component, so a plan always looks
 * the same wherever it appears.
 *
 * - One {@link PlanTree} holds the flattened tree (namespaces,
 *   resources, bindings, actions) plus per-row runtime state (apply status
 *   and the row's latest log message), updated from engine
 *   {@link ApplyEvent}s.
 * - Two presentation `mode`s: `review` renders action glyphs (`+ ~ - ±`),
 *   `apply` renders live statuses with spinners and per-row messages.
 * - `virtual` viewports follow the active row and support keyboard scrolling;
 *   `full` viewports produce static terminal scrollback. This choice is
 *   independent of whether the tree will receive more events.
 * - Property diffs (`detailed`) render in every mode, and the window is
 *   line-budget aware so multi-line rows never overflow the terminal.
 */
import { type JSX, type ReactNode } from "react";
import { PlanTree } from "./PlanTree.ts";
export { PlanTree } from "./PlanTree.ts";
export type { PlanOutcome, PlanProgress, PlanRow, PlanTreeOptions, PlanTreeState, PlanView, PlanViewport, RowState, } from "./PlanTree.ts";
export type { PlanSummaryCounts } from "../../NamespaceTree.ts";
export interface PlanProps {
    /** Reactive tree containing rows, statuses, label, and presentation state. */
    tree: PlanTree;
    /** Allow the tree to collapse behind `p`. */
    collapsible?: boolean;
    /** Widget rendered before the summary block. */
    before?: ReactNode;
    /** Widget rendered on the summary row before the summary. */
    summaryBefore?: ReactNode;
    /** Widget rendered on the summary row after the summary. */
    summaryAfter?: ReactNode;
    /** Widget rendered below the virtualized rows. */
    footer?: ReactNode;
    /** Widget rendered after the complete Plan. */
    after?: ReactNode;
}
export declare function Plan(props: PlanProps): JSX.Element;
//# sourceMappingURL=PlanView.d.ts.map