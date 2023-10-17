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
  let _moveX: number | undefined;
  let _moveY: number | undefined;
  let _offsetX: number | undefined;
  let _offsetY: number | undefined;

  let _grabbed: GrabbedContext | undefined;
  let _mirror: HTMLElement | undefined;
  let _source: ContainerSetting | undefined;
  let _item: Element | undefined;
  let _copy: Element | undefined;
  let _initialSibling: Element | undefined;
  let _currentSibling: Element | undefined;

  const options: WithRequiredProperty<GlobalOptions, 'isContainer' | 'isInvalid' | 'isMovable' | 'slideFactorX' | 'slideFactorY' | 'ignoreInputTextSelection' | 'canAccept'> = {
    mirrorContainer: document.body,
    isContainer: globalOptions.isContainer || never,
    isInvalid: globalOptions.isInvalid || never,
    isMovable: globalOptions.isMovable || always,
    canAccept: globalOptions.canAccept || always,
    getContainerSetting: globalOptions.getContainerSetting,
    slideFactorX: globalOptions.slideFactorX || 0,
    slideFactorY: globalOptions.slideFactorY || 0,
    ignoreInputTextSelection: globalOptions.ignoreInputTextSelection || true,
  };

  // the name for the returned dragging object will be geschleppt (what was drake)
  const geschleppt = ziehenEmitter({
    containers: containers.map((setting) => setting.container),
    isDragging: false,
    canMove,
  });

  registerEvents();

  return geschleppt;

  function isContainer(element: Element) {
    const index = containers.findIndex((setting) => setting.container === element);
    return index > -1 || options.isContainer(element);
  }

  function getContainerSetting(element: HTMLElement) {
    const containerSetting = containers.find((setting) => setting.container === element);
    return containerSetting || options.getContainerSetting?.(element);
  }

  function registerEvents(shouldRemove = false) {
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
    end();
    start(grabbed);
    console.log('grabbed item', _item);
    if (_item) {
      const offset = getOffset(_item);
      _offsetX = clientX(event) - offset.left;
      _offsetY = clientY(event) - offset.top;

      // add the moving-element class
      createMirror();
      drag(event);
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
  
  function canMove(item: Element) {
    return !!canStart(item);
  }

  function grab(event: MouseEvent | TouchEvent) {
    _moveX = clientX(event);
    _moveY = clientY(event);
    console.log('moveX', _moveX, 'moveY', _moveY);
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
    if (!_mirror || !_offsetX || !_offsetY) {
      return;
    }
    event.preventDefault();

    const _clientX = clientX(event);
    const _clientY = clientY(event);
    const x = _clientX - _offsetX;
    const y = _clientY - _offsetY;

    _mirror.style.left = `${x}px`;
    _mirror.style.top = `${y}px`;
  }
  
  function release(event: MouseEvent | TouchEvent) {
    ungrab();

    if (!geschleppt.isDragging || !_mirror || !_source) {
      return;
    }

    const item = _copy || _item;
    if (item) {
      const positionX = clientX(event) || 0;
      const positionY = clientY(event) || 0;
      const elementBehindCursor = getElementBehindPoint(_mirror, positionX, positionY);
      if (!elementBehindCursor) return;
      const dropTarget = findDropTarget(elementBehindCursor, positionX, positionY);
      if (dropTarget && ((_copy && _source?.options.canCopySortSource === true) || (!_copy || dropTarget !== _source.container))) {
        drop(item, dropTarget);
      } else if (_source.options.removeOnSpill === true) {
        remove();
      } else {
        cancel();
      }
    }
  }

  function drop(item: Element, target: HTMLElement) {
    const parent = item.parentElement;
    if (parent && _copy && _item && _source?.options.canCopySortSource === true && target === _source.container) {
      parent.removeChild(_item);
    }

    if (isInitialPlacement(target) && _source) {
      geschleppt.emit('cancel', item, _source, _source);
    } else if (_source && _currentSibling) {
      geschleppt.emit('drop', item, target, _source, _currentSibling);
    }

    cleanup();
  }
  
  function remove() {
    if (!geschleppt.isDragging || !_source) {
      return;
    }

    const item = _copy || _item;
    if (!item) return;
    const parent = item.parentElement;
    if (!parent) return;

    parent.removeChild(item);
    geschleppt.emit(_copy ? 'cancel' : 'remove', item, parent, _source);
    cleanup();
  }

  function cancel(revert = false) {
    if (!geschleppt.isDragging || !_source) {
      return;
    }

    const reverts = revert || _source.options.revertOnSpill === true;
    const item = _copy || _item;
    if (!item) return;
    const parent = item.parentElement;
    if (!parent) return;
    const initial = isInitialPlacement(parent);

    if (!initial && reverts) {
      if (_copy) {
        parent.removeChild(_copy);
      } else if (_initialSibling) {
        _source.container.insertBefore(item, _initialSibling);
      }
    }

    if (initial || reverts) {
      geschleppt.emit('cancel', item, _source, _source);
    } else if (_currentSibling) {
      geschleppt.emit('drop', item, parent, _source, _currentSibling);
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
  
  function getImmediateChild(dropTarget: HTMLElement, target: HTMLElement) {
    let immediate: HTMLElement | null = target;
    while (immediate !== dropTarget && immediate?.parentElement !== dropTarget) {
      immediate = immediate?.parentElement || null;
    }

    if (immediate === documentElement) {
      return null;
    }

    return immediate;
  }
  
  function isInitialPlacement(target: HTMLElement, possibleSibling?: Element | null) {
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
  
  function findDropTarget(elementBehindCursor: Element, clientX: number, clientY: number) {
    let target: HTMLElement | null = elementBehindCursor as HTMLElement;
    while (target && !accepted()) {
      target = target.parentElement;
    }
    return target;

    function accepted() {
      if (!target || !isContainer(target)) {
        return false;
      }

      const immediate = getImmediateChild(target, elementBehindCursor as HTMLElement);
      if (!immediate) return false;
      const reference = getReference(target, immediate, clientX, clientY);
      const initial = isInitialPlacement(target, reference);
      if (initial) {
        return true;
      }

      return _item && _source && options.canAccept(_item, target, _source, reference);
    }
  }
  
  function getReference(dropTarget: HTMLElement, target: HTMLElement, x: number, y: number) {
    const containerSetting = getContainerSetting(dropTarget);
    if (!containerSetting) return null;

    const horizontal = containerSetting.options.orientation === 'horizontal';
    return target !== dropTarget ? inside() : outside();

    function outside() {
      for (let i = dropTarget.children.length; i-- !== 0; ) {
        const element = dropTarget.children[i];
        const rectangle = element.getBoundingClientRect();

        if (horizontal && (rectangle.left + rectangle.width / 2) > x) {
          return element;
        } else if (!horizontal && (rectangle.top + rectangle.height / 2) > y) {
          return element;
        }
      }

      return null;
    }
    
    function inside() {
      const rectangle = target.getBoundingClientRect();
      if (horizontal) {
        return resolve(x > rectangle.left + rectangle.width / 2);
      }

      return resolve(y > rectangle.top + rectangle.height / 2);
    }

    function resolve(after: boolean) {
      return after ? nextElement(target) : target;
    }
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
  
  function getOffset(element: Element) {
    const rectangle = element.getBoundingClientRect();
    const scrollLeft = getScroll('scrollLeft', 'scrollX') as number;
    const scrollTop = getScroll('scrollTop', 'scrollY') as number;

    return {
      left: rectangle.left + scrollLeft,
      top: rectangle.top + scrollTop,
    };
  }
  
  function getScroll(scrollProp: keyof HTMLElement, offsetProp: keyof Window) {
    const globalRecord = window as Record<keyof Window, unknown>;
    if (globalRecord[offsetProp] !== undefined) {
      return globalRecord[offsetProp];
    }
    if (documentElement.clientHeight) {
      return documentElement[scrollProp];
    }

    return document.body[scrollProp];
  }
  
  function getElementBehindPoint(point: Element, x: number, y: number) {
    const state = point.className || '';
    point.className += ' hide-element';

    const element = document.elementFromPoint(x, y);
    point.className = state;

    return element;
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

const never = (..._args: Array<unknown>) => false;
const always = (..._args: Array<unknown>) => true;

export default ziehen;
