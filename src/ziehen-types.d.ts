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

export type EmitterEvents = 'drag' | 'drop' | 'cloned';

export type EmitterDragListener = (element: Element, source: HTMLElement) => void;
export type EmitterDropListener = (element: Element, target: HTMLElement, source: HTMLElement, sibling: Element) => void;
export type EmitterClonedListener = (clone: Element, original: Element, type: 'mirror' | 'copy') => void;

export type EmitterListeners = (EmitterDragListener | EmitterDropListener | EmitterClonedListener) & { _once?: boolean };

/**
 * This is the public interface that will be exported outside the library.
 */
export interface Geschleppt {
  containers?: Array<HTMLElement>;
  on: (type: EmitterEvents, listener: EmitterListeners) => Geschleppt;
  once: (type: EmitterEvents, listener: EmitterListeners) => Geschleppt;
  off: (type: EmitterEvents, listener?: EmitterListeners) => Geschleppt;
}

export interface GeschlepptPrivate {
  emit: (type: EmitterEvents, ...args: Array<Element | HTMLElement | string>) => void;
}

export type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property];
};
