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

const ziehen = (containers: Array<ContainerSetting>, globalOptions: GlobalOptions) => {
  let _moveX: number | undefined;
  let _moveY: number | undefined;

  let _grabbed: GrabbedContext | undefined;
  let _mirror: HTMLElement | undefined;
  let _source: ContainerSetting | undefined;
  let _item: Element | undefined;
  let _copy: Element | undefined;
  let _initialSibling: Element | undefined;
  let _currentSibling: Element | undefined;

  const options: WithRequiredProperty<GlobalOptions, 'isContainer' | 'isInvalid' | 'isMovable' | 'slideFactorX' | 'slideFactorY' | 'ignoreInputTextSelection'> = {
    mirrorContainer: document.body,
    isContainer: globalOptions.isContainer || never,
    isInvalid: globalOptions.isInvalid || never,
    isMovable: globalOptions.isMovable || always,
    slideFactorX: globalOptions.slideFactorX || 0,
    slideFactorY: globalOptions.slideFactorY || 0,
    ignoreInputTextSelection: globalOptions.ignoreInputTextSelection || true,
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
  
  function registerPreventEvents(shouldRemove = false) {
    const operation: OperationType = shouldRemove ? 'remove' : 'add';
    registerEventListener(operation, 'selectstart', preventGrabbed);
    registerEventListener(operation, 'click', preventGrabbed);
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

  function registerEventListener<T extends keyof DocumentEventMap>(operation: OperationType, type: T, listener: EventListener) {
    if (operation === 'add') {
      document.addEventListener(type, listener);
    } else {
      document.removeEventListener(type, listener);
    }
  }

  function preventGrabbed(event: Event) {
    if (_grabbed) {
      event.preventDefault();
    }
  }
  
  function startSinceMouseMoved(event: MouseEvent | TouchEvent) {
    if (!_grabbed) {
      return;
    }
    if (isInvalidMouseButton(event as MouseEvent)) {
      return;
    }

    const _clientX = clientX(event);
    const _clientY = clientY(event);
    if ((_moveX !== undefined && Math.abs(_clientX - _moveX) <= options.slideFactorX) &&
      (_moveY !== undefined && Math.abs(_clientY - _moveY) <= options.slideFactorY)) {
      return;
    }

    if (options.ignoreInputTextSelection) {
      const elementBehindCursor = document.elementFromPoint(_clientX, _clientY) as HTMLElement;
      if (!elementBehindCursor || isInput(elementBehindCursor)) {
        return;
      }
    }

    const grabbed = _grabbed;
    registerMovementEvents(true);
    registerPreventEvents();
  }

  function canStart(element: Element): GrabbedContext | undefined {
    if (geschleppt.isDragging && _mirror) {
      return;
    }
    if (isContainer(element)) {
      return;
    }

    const handle = element;

    let source: ContainerSetting | undefined;
    let item: Element | undefined;
    let sibling: Element | undefined;

    for (let i = containers.length; i-- !== 0; ) {
      source = containers[i];
      if (source.container.contains(element)) {
        const children = source.container.children
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
    _moveX = clientX(event);
    _moveY = clientY(event);

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

  function start(context: GrabbedContext) {
    if (context.source.options.isCopy) {
      _copy = context.item.cloneNode(true) as Element;
      geschleppt.emit('cloned', _copy, context.item, 'copy');
    }

    _source = context.source;
    _item = context.item;
    _initialSibling = _currentSibling = nextElement(context.item);

    geschleppt.isDragging = true;
    geschleppt.emit('drag', _item, _source);
  }

  function end() {
    if (!geschleppt.isDragging) {
      return;
    }

    const item = _copy || _item;
    const parent = item?.parentElement;
    item && parent && drop(item, parent);
  }

  function ungrab() {
    _grabbed = undefined;
    registerMovementEvents(true);
    registerPreventEvents(true);
  }

  function drag(event: MouseEvent | TouchEvent) {
    if (!_mirror) {
      return;
    }
    event.preventDefault();
  }
  
  function release(event: MouseEvent | TouchEvent) {
    ungrab();
    registerMovementEvents(true);
  }

  function drop(item: Element, target: HTMLElement) {
    const parent = item.parentElement;
    if (parent && _copy && _item && _source?.options.isCopy && target === _source.container) {
      parent.removeChild(_item);
    }

    if (isInitialPlacement(target) && _source) {
      geschleppt.emit('cancel', item, _source, _source);
    } else if (_source && _currentSibling) {
      geschleppt.emit('drop', item, target, _source, _currentSibling);
    }

    cleanup();
  }

  function cleanup() {
    const item = _copy || _item;

    ungrab();
    removeMirror();

    if (item) {
      // remove the moving element class
    }

    // look at render timer code...may want to use the lodash throttle method

    geschleppt.isDragging = false
    if (item) {
      geschleppt.emit('dragend', item);
    }

    _source = _item = _copy = _initialSibling = _currentSibling = undefined;
  }
  
  function isInitialPlacement(target: HTMLElement, possibleSibling?: Element) {
    let sibling: Element;
    if (possibleSibling) {
      sibling = possibleSibling;
    } else if (_mirror && _currentSibling) {
      sibling = _currentSibling;
    } else {
      // @ts-ignore at this point one of these items will be defined
      sibling = nextElement(_copy || _item);
    }

    return target === _source?.container && sibling === _initialSibling;
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

  function getCorrectEvent(event: MouseEvent | TouchEvent) {
    const touchEvent = event as TouchEvent;
    if (touchEvent.targetTouches && touchEvent.targetTouches.length) {
      return touchEvent.targetTouches[0];
    }
    if (touchEvent.changedTouches && touchEvent.changedTouches.length) {
      return touchEvent.changedTouches[0];
    }

    return event as MouseEvent;
  }
  
  function clientX(event: MouseEvent | TouchEvent) {
    return getCorrectEvent(event).clientX || 0;
  }

  function clientY(event: MouseEvent | TouchEvent) {
    return getCorrectEvent(event).clientY || 0;
  }

  function isInput(element: HTMLElement) {
    return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT' || isEditable(element);
  }
  
  function isEditable(element: HTMLElement): boolean {
    if (!element) return false;
    if (!element.isContentEditable) return false;
    if (element.isContentEditable) return true;

    return element.parentElement ? isEditable(element.parentElement) : false;
  }
  
  function nextElement(element: Element) {
    return element.nextElementSibling || findNextSibling();
    function findNextSibling() {
      let sibling: ChildNode | null = element as ChildNode;
      do {
        sibling = sibling.nextSibling;
      } while (sibling && sibling.nodeType !== 1);

      return sibling as Element;
    }
  }
};

const never = (...args: Array<unknown>) => false;
const always = (...args: Array<unknown>) => true;

export default ziehen;
