// this will contain most of the code for the project
import ziehenEmitter from './ziehen-emitter.ts';
import {
  ContainerSetting,
  GlobalOptions,
  GrabbedContext,
  MouseTypes,
  OperationType,
  TouchTypes,
  WithRequiredProperty
} from './ziehen-types';

const documentElement = document.documentElement;

const ziehen = (containers: Array<ContainerSetting>, globalOptions: GlobalOptions) => {
  let _grabbed: GrabbedContext | undefined;
  let _mirror: HTMLElement | undefined;

  const options: WithRequiredProperty<GlobalOptions, 'isContainer' | 'isInvalid' | 'isMovable'> = {
    mirrorContainer: document.body,
    isContainer: globalOptions.isContainer || never,
    isInvalid: globalOptions.isInvalid || never,
    isMovable: globalOptions.isMovable || always,
  };

  // the name for the returned dragging object will be geschleppt (what was drake)
  const geschleppt = ziehenEmitter({
    containers: containers.map((setting) => setting.container),
    isDragging: false,
  });

  registerEvents();

  return geschleppt;

  function isContainer(element: Element) {
    const index = containers.findIndex((setting) => setting.container === element);
    return index > -1 || options.isContainer(element);
  }

  function registerEvents(shouldRemove = true) {
    const operation: OperationType = shouldRemove ? 'remove' : 'add';
    registerMouseEvents(operation, 'mousedown', grab);
    registerMouseEvents(operation, 'mouseup', release);
  }

  function registerMovementEvents(shouldRemove = false) {
    const operation: OperationType = shouldRemove ? 'remove' : 'add';
    registerMouseEvents(operation, 'mousemove', startSinceMouseMoved);
  }

  function registerMouseEvents(operation: OperationType, eventType: MouseTypes, func: (event: MouseEvent | TouchEvent) => void) {
    const touch = {
      mouseup: 'touchend',
      mousedown: 'touchstart',
      mousemove: 'touchmove',
    };

    if (operation === 'add') {
      document.addEventListener(eventType, func);
      document.addEventListener(touch[eventType] as TouchTypes, func);
    } else {
      document.removeEventListener(eventType, func);
      document.removeEventListener(touch[eventType] as TouchTypes, func);
    }
  }
  
  function startSinceMouseMoved(event: MouseEvent | TouchEvent) {
    if (!_grabbed) {
      return;
    }
    if (isInvalidMouseButton(event as MouseEvent)) {
      return;
    }
  }

  function canStart(element: Element): GrabbedContext | undefined {
    if (geschleppt.isDragging && _mirror) {
      return;
    }
    if (isContainer(element)) {
      return;
    }

    const handle = element;

    let source: HTMLElement | undefined;
    let item: Element | undefined;
    let sibling: Element | undefined;

    for (let i = containers.length; i-- !== 0; ) {
      source = containers[i].container;
      if (source.contains(element)) {
        const children = source.children
        for (let j = children.length; j-- !== 0; ) {
          const child = children.item(j);
          if (child?.contains(element)) {
            item = child;
            sibling = children.item(j + 1) || undefined;
            break;
          }
        }

        if (item) {
          break;
        }
      }
    }

    if (!source || !item || options.isInvalid(item, handle)) {
      return;
    }

    if (!options.isMovable(item, source, handle, sibling)) {
      return;
    }

    return {
      item,
      source,
    };
  }

  function grab(event: MouseEvent | TouchEvent) {
    const mouseEvent = event as MouseEvent;
    if (isInvalidMouseButton(mouseEvent)) {
      return;
    }

    const item = event.target as Element;
    const context = canStart(item);
    if (!context) {
      return;
    }

    _grabbed = context;
    registerMovementEvents();

    if (event.type === 'mousedown') {
      event.preventDefault();
    }
  }

  function ungrab() {
    _grabbed = undefined;
  }
  
  function release(event: MouseEvent | TouchEvent) {
    ungrab();
    registerMovementEvents(true);
  }

  function drag(event: MouseEvent | TouchEvent) {
    if (!_mirror) {
      return;
    }
    event.preventDefault();
  }

  function isInvalidMouseButton(event: MouseEvent) {
    return event.button !== 0 || event.metaKey || event.ctrlKey;
  }
  
  function createMirror() {
    if (_mirror) {
      return;
    }

    const item = _grabbed?.item;
    if (item) {
      const rectangle = item.getBoundingClientRect();
      _mirror = item.cloneNode(true) as HTMLElement;
      _mirror.style.width = rectangle.width + 'px';
      _mirror.style.height = rectangle.height + 'px';
      // remove the moving-element and add the ghost class
      options.mirrorContainer.appendChild(_mirror);
      registerMouseEvents('add', 'mousemove', drag);
      // add unselectable-element to the mirrorContainer
      geschleppt.emit('cloned', _mirror, item, 'mirror');
    }
  }
  
  function removeMirror() {
    if (_mirror) {
      // remove the unselectable-element class from mirrorContainer
      registerMouseEvents('remove', 'mousemove', drag);
      _mirror.parentElement?.removeChild(_mirror)
      _mirror = undefined;
    }
  }
};

const never = (...args: Array<unknown>) => false;
const always = (...args: Array<unknown>) => true;

export default ziehen;
