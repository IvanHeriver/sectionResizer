import { TSectionResizerConfig, TSectionResizer } from "./types";
export type { TSectionResizer, TSectionConfig, TMultiSectionsConfig, } from "./types";
/**
 * This function makes an HTMLElement a sectionResizer where all its children
 * can be resized by dragging separators. Each child can have
 * two attributes [data-min] and [data-init] which expect pixels values (with no unit)
 * that are used to define its minimum and initial size respectively.
 *
 * @param container  Container where the children to be resized are
 * @param config Main configuration options for the section resizer.
 * @returns A sectionResizer object.
 */
export default function sectionResizer(container: HTMLElement, config?: TSectionResizerConfig): TSectionResizer;
