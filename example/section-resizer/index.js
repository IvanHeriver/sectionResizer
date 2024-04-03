function createSeparators(parent, n_children, mode) {
    const anchor_size = "10px";
    if (n_children === 0)
        return [];
    const separators = Array(n_children - 1)
        .fill("")
        .map((_) => {
        const element = createSep(mode, anchor_size);
        const onHighlightCallbacks = new Set();
        let state = "idle";
        function update(loc) {
            if (mode === "horizontal") {
                element.style.left = `calc(${loc})`;
            }
            else {
                element.style.top = `calc(${loc})`;
            }
        }
        function setState(new_state) {
            state = new_state;
        }
        function setHighlight(yes = true) {
            onHighlightCallbacks.forEach((c) => c(yes));
            element.children[0].classList.toggle("sr-separator-highlight", yes);
        }
        element.addEventListener("pointerenter", () => {
            if (state === "idle")
                setHighlight(true);
        });
        element.addEventListener("pointerleave", () => {
            if (state === "idle")
                setHighlight(false);
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
                }
                else {
                    console.warn(`'${event}' is an unknown event name for a separator. Ignored.`);
                }
            },
            off(event, callback = null) {
                if (event === "highlight") {
                    if (callback === null) {
                        onHighlightCallbacks.clear();
                    }
                    else {
                        onHighlightCallbacks.delete(callback);
                    }
                }
                else {
                    console.warn(`'${event}' is an unknown event name for a separator. Ignored.`);
                }
            },
        };
    });
    separators.forEach((e) => parent.append(e.element));
    return separators;
}
function createSep(mode, anchor_size) {
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
    }
    else if (mode === "vertical") {
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
    }
    else if (mode === "vertical") {
        handle.style.width = "100%";
    }
    sep.append(handle);
    return sep;
}

function sum(array) {
    return array.reduce((a, c) => a + c, 0);
}
function updateSectionSizes(sections, new_sizes, container_size) {
    // make sure that the new sizes are larger than min sizes
    new_sizes = new_sizes.map((e, i) => e === null ? null : Math.max(sections[i].min_size, e));
    // make sure that the new sizes are smaller than max sizes
    new_sizes = new_sizes.map((e, i) => e === null ? null : Math.min(sections[i].max_size, e));
    // compute the reference space i.e. the available
    // space to place the sections
    const reference_space = Math.max(Math.min(container_size, sum(sections.map((e) => e.max_size))), sum(sections.map((e) => e.min_size)));
    // at the stage, we know:
    // sum(min_sizes)<=reference_space<=sum(max_sizes)
    // min_size[i] <= new_sizes[i] <= max_size[i]
    // ... except when new_sizes[i] === null (=0)
    // therefore:
    // sum(new_size) <= sum(max_size) but sum(new_size) can be greater than reference_space...
    // get the indices of unknown new sizes
    // and set unknwon new sizes to minimum sizes
    const unknown_indices = [];
    new_sizes = new_sizes.map((e, i) => {
        if (e === null) {
            unknown_indices.push(i);
            return sections[i].min_size;
        }
        else {
            return e;
        }
    });
    const new_sizes_numbers = new_sizes;
    if (unknown_indices.length > 0) {
        // if there is unknown new sizes
        let sum_new_sizes = sum(new_sizes_numbers);
        if (sum_new_sizes < reference_space) {
            // if the sum of the new sizes below the reference space, we try to grow the unkown sizes as much as possible
            const growth_to_distribute = reference_space - sum_new_sizes;
            const unknown_new_sizes = scaleUpSizes(new_sizes_numbers.filter((_, i) => unknown_indices.includes(i)), sections
                .map((e, i) => e.max_size - new_sizes_numbers[i])
                .filter((_, i) => unknown_indices.includes(i)), growth_to_distribute);
            let k = 0;
            new_sizes = new_sizes.map((e, i) => {
                if (unknown_indices.includes(i)) {
                    k++;
                    return unknown_new_sizes[k - 1];
                }
                return e;
            });
        }
    }
    // If needed, adjuste the new sizes by scaling down or up
    // the new_sizes while enforcing the min and max sizes specified
    let new_size_scaled = new_sizes_numbers;
    const space_to_adjust = sum(new_sizes_numbers) - reference_space;
    if (space_to_adjust > 0) {
        new_size_scaled = scaleDownSizes(new_sizes_numbers, new_sizes_numbers.map((e, i) => e - sections[i].min_size), space_to_adjust);
    }
    else if (space_to_adjust < 0) {
        new_size_scaled = scaleUpSizes(new_sizes_numbers, new_sizes_numbers.map((e, i) => sections[i].max_size - e), -space_to_adjust);
    }
    // update the sections
    return sections.map((e, i) => (Object.assign(Object.assign({}, e), { cur_size: new_size_scaled[i] })));
}
function scaleUpSizes(new_sizes, max_growth, space_to_fill) {
    // let's try and grow everything equally
    let avg_growth = space_to_fill / max_growth.length;
    let n_infinite_max = 0;
    let growth = max_growth.map((e) => {
        if (isFinite(e)) {
            return Math.min(avg_growth, e);
        }
        else {
            n_infinite_max++;
            return avg_growth;
        }
    });
    let remaining_space_to_fill = space_to_fill - sum(growth);
    // in case there are some elements with no finite maximum
    // and there is still some space to fill, distribute the
    // remaining space between these elements
    if (n_infinite_max > 0 && remaining_space_to_fill !== 0) {
        avg_growth = remaining_space_to_fill / n_infinite_max;
        growth = growth.map((e, i) => {
            if (isFinite(max_growth[i]))
                return e;
            return e + avg_growth;
        });
        remaining_space_to_fill = space_to_fill - sum(growth);
    }
    return new_sizes.map((e, i) => e + growth[i]);
}
function scaleDownSizes(new_sizes, max_shrink, space_to_gain) {
    //max_shrink can be used as weight to distribute space_to_gain
    const sum_max_shrink = sum(max_shrink);
    const spaces_to_remove = max_shrink.map((e) => space_to_gain * (e / sum_max_shrink));
    return new_sizes.map((e, i) => e - spaces_to_remove[i]);
}

function propagateSectionSizeChange(sections, change, backward) {
    if (sections.length === 0)
        return { remaining: 0, sections };
    // when change > 0, we try to grow the sections
    // when chnage < 0, we try to shrink the sections
    let i = backward ? sections.length - 1 : 0;
    while (change != 0 && (backward ? i >= 0 : i < sections.length)) {
        // const max_growth = Number.POSITIVE_INFINITY; // how much it can grow
        const max_growth = sections[i].max_size - sections[i].ini_size; // how much it can grow
        const max_shrink = sections[i].ini_size - sections[i].min_size; // how much it can shrink
        if (change > 0) {
            // growing scenario
            if (change < max_growth) {
                // in case the current element i can absorbe all the growth
                sections[i].cur_size = sections[i].ini_size + change;
                change = 0;
            }
            else {
                sections[i].cur_size = sections[i].ini_size + max_growth;
                change -= max_growth;
            }
        }
        else {
            // skrinking scenario
            if (-change < max_shrink) {
                // in case the current element can absorve all the shrinking
                sections[i].cur_size = sections[i].ini_size + change;
                change = 0;
            }
            else {
                sections[i].cur_size = sections[i].ini_size - max_shrink;
                change += max_shrink;
            }
        }
        i += backward ? -1 : 1;
    }
    return { remaining: change, sections };
}
function updateSectionSizesOnResize(sections, index, delta) {
    let old_sections = sections.map((e) => (Object.assign(Object.assign({}, e), { cur_size: e.ini_size })));
    let new_sections = old_sections;
    let remaining = delta;
    let k = 0;
    const max_iteration = 3;
    // console.log("-----------------------------------------------");
    // console.log("sections", sections);
    // console.log("old_sections", old_sections);
    while (remaining !== 0 && k < max_iteration) {
        // console.log("remaining", remaining);
        // console.log("delta", delta);
        k++;
        // handle the resizing of the elements placed before the separator
        const result_before = propagateSectionSizeChange(
        // old_sections.slice(0, index + 1).reverse(),
        old_sections.slice(0, index + 1), delta, true);
        // console.log("result_before", result_before);
        // handle the resizing of the elements placed after the separator
        const result_after = propagateSectionSizeChange(old_sections.slice(index + 1), -delta, false);
        // console.log("result_after", result_after);
        // compute the new sections
        new_sections = [...result_before.sections, ...result_after.sections].map((e) => (Object.assign({}, e)));
        // check that the change was propagated completly
        remaining =
            Math.abs(result_before.remaining) >= Math.abs(result_after.remaining)
                ? result_before.remaining
                : -result_after.remaining;
        // update delta
        delta -= remaining;
        // reset old_sections in case the loop restart
        old_sections = sections.map((e) => (Object.assign(Object.assign({}, e), { cur_size: e.ini_size })));
    }
    return new_sections;
}

// export type sectionsConfig
const warn = console.warn;
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
function sectionResizer(container, config = {
    mode: "horizontal",
    resizeMode: "distributed",
}) {
    const default_config = {
        mode: "horizontal",
        resizeMode: "distributed",
    };
    config = Object.assign(Object.assign({}, default_config), config);
    const mode = config.mode;
    const resizeMode = config.resizeMode;
    let x_y = "x";
    let w_h = "width";
    if (mode === "vertical") {
        x_y = "y";
        w_h = "height";
    }
    else if (mode !== "horizontal") {
        warn(`mode '${mode}' is unknwon. Defaulting to 'horizontal'`);
    }
    let container_size;
    let initial_container_size;
    let sections;
    let separators;
    let resize_observer;
    let mutation_observer;
    init();
    function init() {
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
        const children = Array.from(container.children);
        // create the sections
        sections = children.map(buildDefaultSection);
        // create the separators
        separators = createSeparators(container, children.length, mode);
        // update the sections sizes
        sections = updateSectionSizes(sections, sections.map((e) => e.cur_size), container_size);
        // sections.forEach((s) => (s.ini_size = s.cur_size));
        setInitialSize();
        // update the grid template
        update();
        // create a ResizeObserver which is run whenever the container
        // changes sizes (e.g. if the window is resized)
        resize_observer = new ResizeObserver((entries) => {
            const new_container_size = container.getBoundingClientRect()[w_h];
            if (new_container_size !== container_size) {
                container_size = new_container_size;
                if (resizeMode !== "left" && resizeMode !== "right") {
                    sections = updateSectionSizes(sections, sections.map((e) => (e.ini_size / container_size) * new_container_size), new_container_size);
                }
                else {
                    const change_delta = container_size - initial_container_size;
                    if (resizeMode === "left") {
                        sections = updateSectionSizesOnResize(sections, -1, -change_delta);
                    }
                    else if (resizeMode === "right") {
                        sections = updateSectionSizesOnResize(sections, sections.length, change_delta);
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
            const children = Array.from(container.children);
            // re-build sections
            const sections_size_sum = sections.reduce((a, c) => a + c.cur_size, 0) / sections.length;
            sections = children.map((e) => {
                const i = sections.findIndex((s) => s.element === e);
                if (i === -1) {
                    const default_section = buildDefaultSection(e);
                    if (!isNaN(sections_size_sum))
                        default_section.cur_size = sections_size_sum;
                    return default_section;
                }
                else {
                    return Object.assign({}, sections[i]);
                }
            });
            // create the separators
            separators = createSeparators(container, children.length, mode);
            // update the sections sizes
            sections = updateSectionSizes(sections, sections.map((e) => e.cur_size), container_size);
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
        }
        else {
            container.style.gridTemplateRows = "auto";
            container.style.gridTemplateColumns = gridTemplate;
        }
        // updateSeparators();
        const position = sections
            .reduce((a, c) => [...a, a[a.length - 1] + c.cur_size], [0])
            .slice(1);
        separators.forEach((s, i) => s.update(`${(position[i] / container_size) * 100}%`));
    }
    function buildDefaultSection(element) {
        const dataset_min_size = element.dataset.min == undefined ? "" : element.dataset.min;
        const min_size = "min" in element.dataset
            ? Math.max(parseFloat(dataset_min_size), 50)
            : 50;
        const dataset_def_size = element.dataset.init == undefined ? "" : element.dataset.init;
        const def_size = "init" in element.dataset
            ? Math.max(min_size, parseFloat(dataset_def_size))
            : 0;
        const dataset_max_size = element.dataset.max == undefined ? "" : element.dataset.max;
        const max_size = "max" in element.dataset
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
    styleTag.textContent = `* {cursor: ${mode === "vertical" ? "n-resize" : "e-resize"} !important}`;
    function setInitialSize() {
        sections = sections.map((e) => (Object.assign(Object.assign({}, e), { 
            // ini_size: e.element.getBoundingClientRect()[w_h],
            ini_size: e.cur_size })));
        separators = separators.map((e, i) => {
            e.initial_position = e.element.getBoundingClientRect()[x_y];
            return e;
        });
        initial_container_size = container_size;
    }
    let index;
    function handleResizeStart(event) {
        setInitialSize();
        index = separators.findIndex((s) => s.element === event.target || s.element.children[0] === event.target);
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
            const change_delta = mouse_position - (separators[index].initial_position + 10);
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
    function requestAnimationFramePromise() {
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
    function configure(config) {
        if (!Array.isArray(config)) {
            config = sections.map((_, index) => (Object.assign({ index }, config)));
        }
        config.forEach((e) => {
            if (e.index !== undefined && e.index >= 0 && e.index < sections.length) {
                if (e.min)
                    sections[e.index].min_size = Math.max(50, e.min); // I enforce 50px as a minimum size to prevent weird behavior with scrollbars and overlapping separators
                if (e.max)
                    sections[e.index].max_size = Math.max(0, e.max);
            }
        });
        sections = updateSectionSizes(sections, sections.map((e) => e.cur_size), container_size);
        update();
        setInitialSize();
        return requestAnimationFramePromise();
    }
    function resize(config) {
        // requestAnimationFrame(() => {
        const new_sizes = sections.map((e) => null);
        config.forEach((e) => {
            if (e.index !== undefined &&
                e.index >= 0 &&
                e.index < sections.length &&
                e.size !== undefined) {
                new_sizes[e.index] = e.size;
            }
        });
        console.log("new_sizes", new_sizes);
        sections = updateSectionSizes(sections, new_sizes, container_size);
        update();
        setInitialSize();
        // });
        return requestAnimationFramePromise();
    }
    function getSections() {
        return sections;
    }
    return {
        configure,
        resize,
        getSections,
    };
}

export { sectionResizer as default };
