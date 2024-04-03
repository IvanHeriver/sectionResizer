import { TSection } from "./types";

function sum(array: Array<number>): number {
  return array.reduce((a, c) => a + c, 0);
}

function arrayLog(title: string, element: Array<number>) {
  console.log(`${title}: ${element.map((e) => `${e}`).join(", ")}`);
}

export function updateSectionSizes(
  sections: Array<TSection>,
  new_sizes: Array<number | null>,
  container_size: number
): Array<TSection> {
  // make sure that the new sizes are larger than min sizes
  new_sizes = new_sizes.map((e, i) =>
    e === null ? null : Math.max(sections[i].min_size, e)
  );
  // make sure that the new sizes are smaller than max sizes
  new_sizes = new_sizes.map((e, i) =>
    e === null ? null : Math.min(sections[i].max_size, e)
  );

  // compute the reference space i.e. the available
  // space to place the sections
  const reference_space: number = Math.max(
    Math.min(container_size, sum(sections.map((e) => e.max_size))),
    sum(sections.map((e) => e.min_size))
  );

  // at the stage, we know:
  // sum(min_sizes)<=reference_space<=sum(max_sizes)
  // min_size[i] <= new_sizes[i] <= max_size[i]
  // ... except when new_sizes[i] === null (=0)
  // therefore:
  // sum(new_size) <= sum(max_size) but sum(new_size) can be greater than reference_space...

  // get the indices of unknown new sizes
  // and set unknwon new sizes to minimum sizes
  const unknown_indices: number[] = [];
  new_sizes = new_sizes.map((e, i) => {
    if (e === null) {
      unknown_indices.push(i);
      return sections[i].min_size;
    } else {
      return e;
    }
  });
  const new_sizes_numbers = new_sizes as number[];

  if (unknown_indices.length > 0) {
    // if there is unknown new sizes
    let sum_new_sizes = sum(new_sizes_numbers);
    if (sum_new_sizes < reference_space) {
      // if the sum of the new sizes below the reference space, we try to grow the unkown sizes as much as possible
      const growth_to_distribute = reference_space - sum_new_sizes;
      const unknown_new_sizes = scaleUpSizes(
        new_sizes_numbers.filter((_, i) => unknown_indices.includes(i)),
        sections
          .map((e, i) => e.max_size - new_sizes_numbers[i])
          .filter((_, i) => unknown_indices.includes(i)),
        growth_to_distribute
      );
      let k = 0;
      new_sizes = new_sizes.map((e, i) => {
        if (unknown_indices.includes(i)) {
          k++;
          return unknown_new_sizes[k - 1];
        }
        return e;
      });
    } else {
      // if the sum of the new sizes is greater than the reference space, there is nothing to do
      // since the unknown new sizes were set to their minimal values... the scaling down must occuring
      // on the known new sizes
    }
  }

  // If needed, adjuste the new sizes by scaling down or up
  // the new_sizes while enforcing the min and max sizes specified
  let new_size_scaled: number[] = new_sizes_numbers;
  const space_to_adjust = sum(new_sizes_numbers) - reference_space;
  if (space_to_adjust > 0) {
    new_size_scaled = scaleDownSizes(
      new_sizes_numbers,
      new_sizes_numbers.map((e, i) => e - sections[i].min_size),
      space_to_adjust
    );
  } else if (space_to_adjust < 0) {
    new_size_scaled = scaleUpSizes(
      new_sizes_numbers,
      new_sizes_numbers.map((e, i) => sections[i].max_size - e),
      -space_to_adjust
    );
  }

  // update the sections
  return sections.map((e, i) => ({ ...e, cur_size: new_size_scaled[i] }));
}

function scaleUpSizes(
  new_sizes: Array<number>,
  max_growth: Array<number>,
  space_to_fill: number
): Array<number> {
  // let's try and grow everything equally
  let avg_growth = space_to_fill / max_growth.length;
  let n_infinite_max = 0;
  let growth = max_growth.map((e) => {
    if (isFinite(e)) {
      return Math.min(avg_growth, e);
    } else {
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
      if (isFinite(max_growth[i])) return e;
      return e + avg_growth;
    });
    remaining_space_to_fill = space_to_fill - sum(growth);
  }

  return new_sizes.map((e, i) => e + growth[i]);
}

function scaleDownSizes(
  new_sizes: Array<number>,
  max_shrink: Array<number>,
  space_to_gain: number
) {
  //max_shrink can be used as weight to distribute space_to_gain
  const sum_max_shrink = sum(max_shrink);
  const spaces_to_remove = max_shrink.map(
    (e) => space_to_gain * (e / sum_max_shrink)
  );
  return new_sizes.map((e, i) => e - spaces_to_remove[i]);
}
