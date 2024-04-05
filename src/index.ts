import { createSeparators } from "./sep";
import {
  TSectionResizerConfig,
  TResizeConfig,
  TSection,
  TSectionConfig,
  TMultiSectionsConfig,
  TSectionSeparator,
  TSectionResizer,
} from "./types";
import { updateSectionSizes } from "./sizing";
import { updateSectionSizesOnResize } from "./resizing";

export type {
  TSectionResizer,
  TSectionConfig,
  TMultiSectionsConfig,
} from "./types";
// export type sectionsConfig

const warn: Function = console.warn;

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
export default function sectionResizer(
  container: HTMLElement,
  config: TSectionResizerConfig = {
    mode: "horizontal",
    resizeMode: "distributed",
  }
): TSectionResizer {
  const default_config: TSectionResizerConfig = {
    mode: "horizontal",
    resizeMode: "distributed",
  };
  config = { ...default_config, ...config };
  const mode = config.mode;
  const resizeMode = config.resizeMode;

  let x_y: "x" | "y" = "x";
  let w_h: "width" | "height" = "width";
  if (mode === "vertical") {
    x_y = "y";
    w_h = "height";
  } else if (mode !== "horizontal") {
    warn(`mode '${mode}' is unknwon. Defaulting to 'horizontal'`);
  }

  let container_size: number;

  let initial_container_size: number;
  let sections: Array<TSection>;

  let separators: Array<TSectionSeparator>;

  let resize_observer: ResizeObserver;
  let mutation_observer: MutationObserver;

  init();

  function init(): void {
    // store the current container size
    container_size = container.getBoundingClientRect()[w_h];
    initial_container_size = container_size;

    // set needed style attributes to the container
    const current_position_style = window
      .getComputedStyle(container)
      .getPropertyValue("position");
    if (!["absolute", "relative"].includes(current_position_style)) {
      container.style.position = "relative";
    }
    container.style.overflow = "auto";
    container.style.display = "grid";
    //FIXME: I should get rid of these conditions on padding and margin...
    container.style.padding = "0";
    container.style.margin = "0";

    // create the event listeners attached to the document element
    // that handle the resizing of the children by dragging the separators
    document.addEventListener("pointerdown", handleResizeStart);
    document.addEventListener("pointermove", handleResizeMove);
    document.addEventListener("pointerup", handleResizeEnd);

    // retrieve the children
    const children = Array.from(
      container.children as HTMLCollectionOf<HTMLElement>
    );

    // create the sections
    sections = children.map(buildDefaultSection);

    // create the separators
    separators = createSeparators(container, children.length, mode);

    // update the sections sizes
    sections = updateSectionSizes(
      sections,
      sections.map((e) => e.cur_size),
      container_size
    );
    // sections.forEach((s) => (s.ini_size = s.cur_size));
    setInitialSize();

    // update the grid template
    update();

    // create a ResizeObserver which is run whenever the container
    // changes sizes (e.g. if the window is resized)
    resize_observer = new ResizeObserver((entries) => {
      const new_container_size: number = container.getBoundingClientRect()[w_h];
      if (new_container_size !== container_size) {
        container_size = new_container_size;
        if (resizeMode !== "left" && resizeMode !== "right") {
          sections = updateSectionSizes(
            sections,
            sections.map(
              (e) => (e.ini_size / container_size) * new_container_size
            ),
            new_container_size
          );
        } else {
          const change_delta = container_size - initial_container_size;
          if (resizeMode === "left") {
            sections = updateSectionSizesOnResize(sections, -1, -change_delta);
          } else if (resizeMode === "right") {
            sections = updateSectionSizesOnResize(
              sections,
              sections.length,
              change_delta
            );
          }
        }
      }
      update();
      window.requestAnimationFrame(() => {
        update();
      });
    });
    resize_observer.observe(container);

    // create a MutationObserver which is run whenever elements are added to
    // the sectionResizer container or removed from it
    mutation_observer = new MutationObserver(() => {
      // stop listening for changes
      mutation_observer.disconnect();
      // remove the existing separators
      separators.forEach((e) => e.element.remove());
      // retrieve the children
      const children = Array.from(
        container.children as HTMLCollectionOf<HTMLElement>
      );
      // re-build sections
      const sections_size_sum =
        sections.reduce((a, c) => a + c.cur_size, 0) / sections.length;
      sections = children.map((e) => {
        const i = sections.findIndex((s) => s.element === e);
        if (i === -1) {
          const default_section = buildDefaultSection(e);
          if (!isNaN(sections_size_sum))
            default_section.cur_size = sections_size_sum;
          return default_section;
        } else {
          return {
            ...sections[i],
          };
        }
      });

      // create the separators
      separators = createSeparators(container, children.length, mode);

      // update the sections sizes
      sections = updateSectionSizes(
        sections,
        sections.map((e) => e.cur_size),
        container_size
      );

      // update the grid template
      update();

      // re-observe the container for changes
      mutation_observer.observe(container, { childList: true, subtree: false });
    });
    mutation_observer.observe(container, { childList: true, subtree: false });
  }

  function update() {
    // const container_size = container.getBoundingClientRect()[w_h];
    const gridTemplate = sections
      .map((e) => `${(e.cur_size / container_size) * 100}%`)
      .join(" ");
    if (mode === "vertical") {
      container.style.gridTemplateColumns = "auto";
      container.style.gridTemplateRows = gridTemplate;
    } else {
      container.style.gridTemplateRows = "auto";
      container.style.gridTemplateColumns = gridTemplate;
    }
    // updateSeparators();
    const position = sections
      .reduce((a, c) => [...a, a[a.length - 1] + c.cur_size], [0])
      .slice(1);
    separators.forEach((s, i) =>
      s.update(`${(position[i] / container_size) * 100}%`)
    );
  }

  function buildDefaultSection(element: HTMLElement): TSection {
    const dataset_min_size: string =
      element.dataset.min == undefined ? "" : element.dataset.min;
    const min_size =
      "min" in element.dataset
        ? Math.max(parseFloat(dataset_min_size), 50)
        : 50;
    const dataset_def_size: string =
      element.dataset.init == undefined ? "" : element.dataset.init;
    const def_size =
      "init" in element.dataset
        ? Math.max(min_size, parseFloat(dataset_def_size))
        : 0;
    const dataset_max_size: string =
      element.dataset.max == undefined ? "" : element.dataset.max;
    const max_size =
      "max" in element.dataset
        ? Math.max(min_size, parseFloat(dataset_max_size))
        : Number.POSITIVE_INFINITY;
    return {
      element: element,
      min_size: min_size,
      max_size: max_size,
      def_size: def_size,
      cur_size: def_size,
      ini_size: def_size,
    };
  }

  const styleTag = document.createElement("style");
  styleTag.media = "screen";
  styleTag.textContent = `* {cursor: ${
    mode === "vertical" ? "n-resize" : "e-resize"
  } !important}`;

  function setInitialSize() {
    sections = sections.map((e) => ({
      ...e,
      // ini_size: e.element.getBoundingClientRect()[w_h],
      ini_size: e.cur_size,
    }));
    separators = separators.map((e, i) => {
      e.initial_position = e.element.getBoundingClientRect()[x_y];
      return e;
    });
    initial_container_size = container_size;
  }

  let index: number;

  function handleResizeStart(event) {
    setInitialSize();
    index = separators.findIndex(
      (s) =>
        s.element === event.target || s.element.children[0] === event.target
    );
    separators.forEach((s) => s.setState("silent"));
    if (index >= 0) {
      event.preventDefault();
      separators[index].setState("resizing");
      separators[index].setHighlight(true);
      document.head.appendChild(styleTag);
    }
  }
  function handleResizeMove(event) {
    if (index >= 0) {
      const mouse_position = event[x_y];
      const change_delta =
        mouse_position - (separators[index].initial_position + 10);
      sections = updateSectionSizesOnResize(sections, index, change_delta);
      update();
    }
  }
  function handleResizeEnd() {
    if (index >= 0) {
      setInitialSize();
      separators[index].setHighlight(false);
      index = -1;
      styleTag.remove();
    }
    separators.forEach((s) => s.setState("idle"));
  }

  function requestAnimationFramePromise(): Promise<void> {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        resolve();
      });
    });
  }

  /**
   * Configure min and/or max sizes of all sections, or specific sections
   *
   * @param {object[]} config - configuration object
   * @returns A promise that resolve at the next animation frame.
   */
  function configure(
    config: Array<TSectionConfig> | TMultiSectionsConfig
  ): Promise<void> {
    if (!Array.isArray(config)) {
      config = sections.map((_, index) => ({
        index,
        ...config,
      }));
    }
    config.forEach((e) => {
      if (e.index !== undefined && e.index >= 0 && e.index < sections.length) {
        if (e.min) sections[e.index].min_size = Math.max(50, e.min); // I enforce 50px as a minimum size to prevent weird behavior with scrollbars and overlapping separators
        if (e.max) sections[e.index].max_size = Math.max(0, e.max);
      }
    });
    sections = updateSectionSizes(
      sections,
      sections.map((e) => e.cur_size),
      container_size
    );
    update();
    setInitialSize();
    return requestAnimationFramePromise();
  }
  function resize(config: Array<TResizeConfig>): Promise<void> {
    // requestAnimationFrame(() => {
    const new_sizes: (number | null)[] = sections.map((e) => null);
    config.forEach((e) => {
      if (
        e.index !== undefined &&
        e.index >= 0 &&
        e.index < sections.length &&
        e.size !== undefined
      ) {
        new_sizes[e.index] = e.size;
      }
    });
    sections = updateSectionSizes(sections, new_sizes, container_size);
    update();
    setInitialSize();
    // });

    return requestAnimationFramePromise();
  }
  function getSections(): Array<TSection> {
    return sections;
  }
  return {
    configure,
    resize,
    getSections,
  };
}
