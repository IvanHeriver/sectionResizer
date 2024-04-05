import { TSection } from "./types";

function propagateSectionSizeChange(
  sections: Array<TSection>,
  change: number,
  backward: boolean
): { remaining: number; sections: Array<TSection> } {
  if (sections.length === 0) return { remaining: 0, sections };
  // when change > 0, we try to grow the sections
  // when chnage < 0, we try to shrink the sections
  let i: number = backward ? sections.length - 1 : 0;
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
      } else {
        sections[i].cur_size = sections[i].ini_size + max_growth;
        change -= max_growth;
      }
    } else {
      // skrinking scenario
      if (-change < max_shrink) {
        // in case the current element can absorve all the shrinking
        sections[i].cur_size = sections[i].ini_size + change;
        change = 0;
      } else {
        sections[i].cur_size = sections[i].ini_size - max_shrink;
        change += max_shrink;
      }
    }
    i += backward ? -1 : 1;
  }
  return { remaining: change, sections };
}

export function updateSectionSizesOnResize(
  sections: Array<TSection>,
  index: number,
  delta: number
): Array<TSection> {
  let old_sections = sections.map((e) => ({ ...e, cur_size: e.ini_size }));
  let new_sections = old_sections;
  let remaining = delta;
  let k = 0;
  const max_iteration = 3;
  while (remaining !== 0 && k < max_iteration) {
    k++;
    // handle the resizing of the elements placed before the separator
    const result_before = propagateSectionSizeChange(
      // old_sections.slice(0, index + 1).reverse(),
      old_sections.slice(0, index + 1),
      delta,
      true
    );
    // handle the resizing of the elements placed after the separator
    const result_after = propagateSectionSizeChange(
      old_sections.slice(index + 1),
      -delta,
      false
    );
    // compute the new sections
    new_sections = [...result_before.sections, ...result_after.sections].map(
      (e) => ({ ...e })
    );
    // check that the change was propagated completly
    remaining =
      Math.abs(result_before.remaining) >= Math.abs(result_after.remaining)
        ? result_before.remaining
        : -result_after.remaining;

    // update delta
    delta -= remaining;

    // reset old_sections in case the loop restart
    old_sections = sections.map((e) => ({
      ...e,
      cur_size: e.ini_size,
    }));
  }
  return new_sections;
}
