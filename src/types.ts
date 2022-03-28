export interface section {
  element: HTMLElement;
  min_size: number;
  max_size: number;
  def_size: number;
  cur_size: number;
  ini_size: number;
}

export interface separator {
  element: HTMLElement;
  position: number;
  initial_position: number;
  update: Function;
  setState: Function;
  setHighlight: Function;
  on: Function;
  off: Function;
}

export interface configuration {
  mode: "horizontal" | "vertical";
  resizeMode: "distributed" | "left" | "right";
}

export type sectionConfig = {
  /**
   * Index of the section to configure
   */
  index: number;
  /**
   * Minimum size of the section
   */
  min?: number;
  /**
   * Maximum size of the section
   */
  max?: number;
};
export type sectionsConfig = {
  /**
   * Minimum sizes of all sections
   */
  min?: number;
  /**
   * Maximum sizes of all sections
   */
  max?: number;
};

export interface configureItem {
  index: number;
  min?: number;
  max?: number;
}

export interface resizeItem {
  index: number;
  size: number;
}
