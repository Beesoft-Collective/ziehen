// this will contain most of the code for the project
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
  let _grabbed: GrabbedContext;

  const options: WithRequiredProperty<GlobalOptions, 'isContainer'> = {
    mirrorContainer: document.body,
    isContainer: globalOptions.isContainer || never,
  };

  const processContainers = (settings: Array<ContainerSetting>) => {
    for (let i = 0, length = settings.length; i < length; i++) {
      const setting = settings[i];
      setting.items = setting.container.children;
    }
  };

  processContainers(containers);

  // the name for the returned dragging object will be geschleppt (what was drake)

  const isContainer = (element: Element) => {
    const index = containers.findIndex((setting) => setting.container.isSameNode(element));
    return index > -1 || options.isContainer(element);
  };

  const registerEvents = (shouldRemove = true) => {
    const operation: OperationType = shouldRemove ? 'remove' : 'add';
    registerMouseEvents(operation, 'mousedown', grab);
  };

  registerEvents();

  const registerMovementEvents = (shouldRemove = true) => {
    const operation: OperationType = shouldRemove ? 'remove' : 'add';
  };

  const registerMouseEvents = (operation: OperationType, eventType: MouseTypes, func: (event: MouseEvent | TouchEvent) => void) => {
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
  };

  const grab = (event: MouseEvent | TouchEvent) => {
    const mouseEvent = event as MouseEvent;
    if (mouseEvent.button !== 0 || mouseEvent.metaKey || mouseEvent.ctrlKey) {
      return;
    }
  };
};

const never = (...args: Array<unknown>) => false;
const always = (...args: Array<unknown>) => true;

export default ziehen;
