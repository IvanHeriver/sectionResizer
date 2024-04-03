export type TSection = {
  element: HTMLElement;
  min_size: number;
  max_size: number;
  def_size: number;
  cur_size: number;
  ini_size: number;
};

export type TSectionSeparator = {
  element: HTMLElement;
  position: number;
  initial_position: number;
  update: Function;
  setState: Function;
  setHighlight: Function;
  on: Function;
  off: Function;
};

export type TSectionResizerConfig = {
  mode: "horizontal" | "vertical";
  resizeMode: "distributed" | "left" | "right";
};

export type TSectionConfig = {
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
export type TMultiSectionsConfig = {
  /**
   * Minimum sizes of all sections
   */
  min?: number;
  /**
   * Maximum sizes of all sections
   */
  max?: number;
};

export type TResizeConfig = {
  index: number;
  size: number;
};

export type TSectionResizer = {
  configure: (
    config: Array<TSectionConfig> | TMultiSectionsConfig
  ) => Promise<void>;
  resize: (config: Array<TResizeConfig>) => Promise<void>;
  getSections: () => Array<TSection>;
};
