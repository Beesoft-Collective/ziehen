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

  const options: WithRequiredProperty<GlobalOptions, 'isContainer'> = {
    mirrorContainer: document.body,
    isContainer: globalOptions.isContainer || never,
  };

  // the name for the returned dragging object will be geschleppt (what was drake)
  const geschleppt = ziehenEmitter({
    containers: containers.map((setting) => setting.container),
  });

  processContainers(containers);
  registerEvents();

  return geschleppt;

  function processContainers(settings: Array<ContainerSetting>) {
    for (let i = 0, length = settings.length; i < length; i++) {
      const setting = settings[i];
      setting.items = setting.container.children;
    }
  }

  function isContainer(element: Element) {
    const index = containers.findIndex((setting) => setting.container.isSameNode(element));
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
  }

  function grab(event: MouseEvent | TouchEvent) {
    const mouseEvent = event as MouseEvent;
    if (mouseEvent.button !== 0 || mouseEvent.metaKey || mouseEvent.ctrlKey) {
      return;
    }

    registerMovementEvents();
  }

  function ungrab() {
    _grabbed = undefined;
  }
  
  function release(event: MouseEvent | TouchEvent) {
    ungrab();
    registerMovementEvents(true);
  }
};

const never = (...args: Array<unknown>) => false;
const always = (...args: Array<unknown>) => true;

export default ziehen;
