import { EmitterListeners, Geschleppt, GeschlepptPrivate } from './ziehen-types';

const ziehenEmitter = (object?: Omit<Geschleppt, 'on' | 'once' | 'off'>) => {
  // it doesn't seem there is any way to accomplish settings an object without certain required properties even when
  // those properties are defined below
  // @ts-ignore
  const emitter: Geschleppt & GeschlepptPrivate = object || {};
  const events: Record<string, Array<EmitterListeners>> = {};

  emitter.on = (type, listener) => {
    if (!events[type]) {
      events[type] = [listener];
    } else {
      events[type].push(listener);
    }

    return emitter;
  };

  emitter.once = (type, listener) => {
    listener._once = true;
    emitter.on(type, listener);

    return emitter;
  };

  emitter.off = (type, listener) => {
    if (listener) {
      const eventArray = events[type];
      if (!eventArray) return emitter;
      eventArray.splice(eventArray.indexOf(listener), 1);
    } else {
      delete events[type];
    }

    return emitter;
  };

  emitter.emit = (type, ...args) => {
    const eventArray = events[type] || [];
    if (eventArray.length > 0) {

    }
  };
};

export default ziehenEmitter;
