export interface ContainerOptions {
  orientation: 'vertical' | 'horizontal' | 'freeform';
  isCopy?: boolean;
}

export interface ContainerSetting {
  id: string | number;
  container: HTMLElement;
  options: ContainerOptions;
}

export interface GlobalOptions {
  mirrorContainer: HTMLElement;
  isContainer?: (element: Element) => boolean;
  isInvalid?: (item: Element, handle: Element) => boolean;
  isMovable?: (item: Element, source: ContainerSetting, handle: Element, sibling?: Element) => boolean;
  slideFactorX?: number;
  slideFactorY?: number;
  ignoreInputTextSelection?: boolean;
}

/**
 * The context is the grabbed item and the container it is grabbed from.
 */
export interface GrabbedContext {
  item: Element;
  source: ContainerSetting;
}

export type OperationType = 'remove' | 'add';
export type MouseTypes = 'mousedown' | 'mouseup' | 'mousemove';
export type TouchTypes = 'touchstart' | 'touchend' | 'touchmove';

export type EmitterEvents = 'drag' | 'drop' | 'cloned' | 'cancel' | 'dragend';

export type EmitterDragListener = (element: Element, source: HTMLElement) => void;
export type EmitterDropListener = (element: Element, target: HTMLElement, source: HTMLElement, sibling: Element) => void;
export type EmitterClonedListener = (clone: Element, original: Element, type: 'mirror' | 'copy') => void;

export type EmitterListeners = (EmitterDragListener | EmitterDropListener | EmitterClonedListener) & { _once?: boolean };

/**
 * This is the public interface that will be exported outside the library.
 */
export interface Geschleppt {
  containers?: Array<HTMLElement>;
  isDragging: boolean;
  on: (type: EmitterEvents, listener: EmitterListeners) => Geschleppt;
  once: (type: EmitterEvents, listener: EmitterListeners) => Geschleppt;
  off: (type: EmitterEvents, listener?: EmitterListeners) => Geschleppt;
}

export interface GeschlepptPrivate {
  emit: (type: EmitterEvents, ...args: Array<Element | HTMLElement | ContainerSetting | string>) => void;
}

export type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property];
};
