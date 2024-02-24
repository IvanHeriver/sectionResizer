import { separator } from "./types";

export function createSeparators(
  parent: HTMLElement,
  n_children: number,
  mode: "vertical" | "horizontal"
): Array<separator> {
  const anchor_size = "10px";

  if (n_children === 0) return [];
  const separators: Array<separator> = Array(n_children - 1)
    .fill("")
    .map((_) => {
      const element = createSep(mode, anchor_size);
      const onHighlightCallbacks: Set<Function> = new Set();
      let state: "idle" | "resizing" | "silent" = "idle";
      function update(loc: string) {
        if (mode === "horizontal") {
          element.style.left = `calc(${loc})`;
        } else {
          element.style.top = `calc(${loc})`;
        }
      }
      function setState(new_state: "idle" | "resizing" | "silent") {
        state = new_state;
      }
      function setHighlight(yes: boolean = true) {
        onHighlightCallbacks.forEach((c) => c(yes));
        element.children[0].classList.toggle("sr-separator-highlight", yes);
      }
      element.addEventListener("pointerenter", () => {
        if (state === "idle") setHighlight(true);
      });
      element.addEventListener("pointerleave", () => {
        if (state === "idle") setHighlight(false);
      });
      return {
        element,
        position: 0,
        initial_position: 0,
        update,
        setState,
        setHighlight,
        on(event, callback) {
          if (event === "highlight") {
            onHighlightCallbacks.add(callback);
          } else {
            console.warn(
              `'${event}' is an unknown event name for a separator. Ignored.`
            );
          }
        },
        off(event, callback = null) {
          if (event === "highlight") {
            if (callback === null) {
              onHighlightCallbacks.clear();
            } else {
              onHighlightCallbacks.delete(callback);
            }
          } else {
            console.warn(
              `'${event}' is an unknown event name for a separator. Ignored.`
            );
          }
        },
      };
    });
  separators.forEach((e) => parent.append(e.element));
  return separators;
}

function createSep(
  mode: "vertical" | "horizontal",
  anchor_size: string
): HTMLElement {
  const sep = document.createElement("div");
  sep.classList.add("sr-separator-anchor");
  sep.style.position = "absolute";
  sep.style.display = "flex";
  sep.style.justifyContent = "center";
  sep.style.top = "0px";
  sep.style.left = "0px";

  // sep.style.backgroundColor = "rgb(255, 0, 0, 0.1)";
  if (mode === "horizontal") {
    sep.style.height = "100%";
    sep.style.width = anchor_size;
    sep.style.flexDirection = "row";
    sep.style.transform = `translateX(calc(-${anchor_size} / 2))`;
    sep.style.cursor = "e-resize";
  } else if (mode === "vertical") {
    sep.style.width = "100%";
    sep.style.height = anchor_size;
    sep.style.flexDirection = "column";
    sep.style.transform = `translateY(calc(-${anchor_size} / 2))`;
    sep.style.cursor = "n-resize";
  }

  const handle = document.createElement("div");
  handle.classList.add("sr-separator");
  if (mode === "horizontal") {
    handle.style.height = "100%";
  } else if (mode === "vertical") {
    handle.style.width = "100%";
  }
  sep.append(handle);
  return sep;
}
