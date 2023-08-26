export interface ContainerOptions {
  orientation: 'vertical' | 'horizontal';
}

export interface ContainerSetting {
  id: string | number;
  container: HTMLElement;
  items?: HTMLCollection;
  options: ContainerOptions;
}

export interface GlobalOptions {
  mirrorContainer: HTMLElement;
  isContainer?: (element: Element) => boolean;
}

/**
 * The context is the grabbed item and the container it is grabbed from.
 */
export interface GrabbedContext {
  item: Element;
  source: HTMLElement;
}

export type OperationType = 'remove' | 'add';
export type MouseTypes = 'mousedown' | 'mouseup' | 'mousemove';
export type TouchTypes = 'touchstart' | 'touchend' | 'touchmove';

export type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property];
};
