declare module 'farce' {
  import { Middleware, StoreEnhancer } from 'redux';

  interface ActionTypes {
    INIT: '@@farce/INIT';
    PUSH: '@@farce/PUSH';
    REPLACE: '@@farce/REPLACE';
    TRANSITION: '@@farce/TRANSITION';
    GO: '@@farce/GO';
    CREATE_HREF: '@@farce/CREATE_HREF';
    CREATE_LOCATION: '@@farce/CREATE_LOCATION';
    UPDATE_LOCATION: '@@farce/UPDATE_LOCATION';
    DISPOSE: '@@farce/DISPOSE';
  }

  const ActionTypes: ActionTypes;

  type Action<
    T extends keyof ActionTypes,
    P extends any = undefined
  > = P extends undefined
    ? {
        type: ActionTypes[T];
      }
    : {
        type: ActionTypes[T];
        payload: P;
      };

  type LocationDescriptorObject = {
    pathname: string;
    search?: string;
    hash?: string;
  };

  type LocationDescriptor = LocationDescriptorObject | string;

  const Actions: {
    init(): Action<'INIT'>;
    push(location: LocationDescriptor): Action<'PUSH', LocationDescriptor>;
    replace(
      location: LocationDescriptor,
    ): Action<'REPLACE', LocationDescriptor>;
    go(delta: number): Action<'GO', number>;
    dispose(): Action<'DISPOSE'>;
  };

  interface IHistoryProtocol {}

  class ServerProtocol implements IHistoryProtocol {
    constructor(url: string);
  }

  class HashProtocol implements IHistoryProtocol {}

  class MemoryProtocol implements IHistoryProtocol {
    constructor(initialRoute: string);
  }

  class BrowserProtocol implements IHistoryProtocol {}

  function createHistoryEnhancer(config: {
    protocol: IHistoryProtocol;
    middlewares: Middleware[];
    useBeforeUnload?: boolean;
  }): StoreEnhancer<{
    farce: {
      addTransitionHook: (
        hook: (location?: LocationDescriptorObject) => any,
      ) => Function;
      createHref: (location: LocationDescriptor) => string;
      createLocation: (location: string) => LocationDescriptorObject;
    };
  }>;

  interface QueryMiddlewareConfig {
    stringify(obj: any): string;
    parse(str: string): any;
  }
  function createQueryMiddleware(config: QueryMiddlewareConfig): Middleware;
}
