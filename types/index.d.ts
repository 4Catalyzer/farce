// TypeScript Version: 3.0

import { Middleware, Reducer, StoreEnhancer } from 'redux';

export {};

export type Query = Record<string, string>;

export type QueryDescriptor = Record<
  string,
  string | number | boolean | Record<string, unknown> | null | undefined
>;

export interface Location<TState = any> {
  /**
   * 'PUSH' or 'REPLACE' if the location was reached via FarceActions.push or
   * FarceActions.replace respectively; 'POP' on the initial location, or if
   * the location was reached via the browser back or forward buttons or
   * via FarceActions.go
   */
  action: 'PUSH' | 'REPLACE' | 'POP';
  /**
   * the path name; as on window.location e.g. '/foo'
   */
  pathname: string;
  /**
   * map version of search string
   */
  query: Query;
  /**
   * the search string; as on window.location e.g. '?bar=baz'
   */
  search: string;
  /**
   * the location hash; as on window.location e.g. '#qux'
   */
  hash: string;
  /**
   * if present, a unique key identifying the current history entry
   */
  key?: string;
  /**
   * the current index of the history entry, starting at 0 for the initial
   * entry; this increments on FarceActions.push but not on
   * FarceActions.replace
   */
  index: number;
  /**
   * the difference between the current index and the index of the previous
   * location
   */
  delta: number;
  /**
   * additional location state that is not part of the URL
   */
  state: TState;
}

/**
 * Location descriptor object used in #push and #replace.
 */
export interface LocationDescriptorObject {
  pathname: Location['pathname'];
  query?: QueryDescriptor;
  search?: Location['search'];
  hash?: Location['hash'];
  state?: Location['state'];
}

/**
 * Location descriptor string:
 *  store.dispatch(FarceActions.push('/foo?bar=baz#qux'));
 *
 * Equivalent location descriptor object:
 *    store.dispatch(FarceActions.push({
 *     pathname: '/foo',
 *     search: '?bar=baz',
 *     hash: '#qux',
 *   }));
 *
 * https://github.com/4Catalyzer/farce#locations-and-location-descriptors
 */
export type LocationDescriptorString = string;

// Using an interface allows consumers to use object merging to add other
//  location descriptor types.
export interface LocationDescriptorTypes {
  object: LocationDescriptorObject;
  string: LocationDescriptorString;
}

export type LocationDescriptor = LocationDescriptorTypes[keyof LocationDescriptorTypes];

export interface HistoryEnhancerOptions {
  protocol: Protocol;
  middlewares?: Middleware[];
}

export interface NavigationListenerOptions {
  beforeUnload?: boolean;
}

export type NavigationListenerSyncResult = boolean | string | null | undefined;
export type NavigationListenerResult =
  | NavigationListenerSyncResult
  | Promise<NavigationListenerSyncResult>;

/**
 * The navigation listener function receives the location to which the user
 * is attempting to navigate.
 *
 * This function may return:
 *  - true to allow navigation
 *  - false to block navigation
 *  - A string to prompt the user with that string as the message
 *  - A nully value to call the next navigation and use its return value, if
 *    present, or else to allow navigation
 *  - A promise that resolves to any of the above values, to allow or block
 *    navigation once the promise resolves
 *
 * @see https://github.com/4Catalyzer/farce#navigation-listeners
 */
export interface NavigationListener {
  (
    location: Location | LocationDescriptorObject | null,
  ): NavigationListenerResult;
}

export interface FarceStoreExtension {
  createHref: (location: LocationDescriptor) => string;
  createLocation: (location: LocationDescriptor) => LocationDescriptorObject;
  addNavigationListener: (
    listener: NavigationListener,
    options?: NavigationListenerOptions,
  ) => () => void;
}

export function createHistoryEnhancer(
  options: HistoryEnhancerOptions,
): StoreEnhancer<{ farce: FarceStoreExtension }>;

export const ActionTypes: {
  INIT: '@@farce/INIT';
  PUSH: '@@farce/PUSH';
  REPLACE: '@@farce/REPLACE';
  NAVIGATE: '@@farce/NAVIGATE';
  GO: '@@farce/GO';
  CREATE_HREF: '@@farce/CREATE_HREF';
  CREATE_LOCATION: '@@farce/CREATE_LOCATION';
  UPDATE_LOCATION: '@@farce/UPDATE_LOCATION';
  DISPOSE: '@@farce/DISPOSE';
};

export interface InitAction {
  type: typeof ActionTypes['INIT'];
}

export interface PushAction {
  type: typeof ActionTypes['PUSH'];
  payload: LocationDescriptor;
}

export interface ReplaceAction {
  type: typeof ActionTypes['REPLACE'];
  payload: LocationDescriptor;
}

export interface GoAction {
  type: typeof ActionTypes['GO'];
  payload: number;
}

export interface DisposeAction {
  type: typeof ActionTypes['DISPOSE'];
}

export type Action =
  | InitAction
  | PushAction
  | ReplaceAction
  | GoAction
  | DisposeAction;

export const Actions: {
  init(): InitAction;
  push(location: LocationDescriptor): PushAction;
  replace(location: LocationDescriptor): ReplaceAction;
  go(delta: number): GoAction;
  dispose(): DisposeAction;
};

export interface Protocol {
  init(): void;

  subscribe(listener: (location: Location) => void): () => void;

  navigate(location: LocationDescriptorObject): Location;

  go(delta: number): void;

  createHref(location: LocationDescriptorObject): string;
}

// This is just to DRY the declarations below.
declare abstract class ProtocolBase implements Protocol {
  init(): void;

  subscribe(listener: (location: Location) => void): () => void;

  navigate(location: LocationDescriptorObject): Location;

  go(delta: number): void;

  createHref(location: LocationDescriptorObject): string;
}

export class BrowserProtocol extends ProtocolBase {}

export class HashProtocol extends ProtocolBase {}

export interface MemoryProtocolOptions {
  persistent?: boolean;
}

export class ServerProtocol extends ProtocolBase {
  constructor(url: LocationDescriptor);
}

export class MemoryProtocol extends ProtocolBase {
  constructor(
    initialLocation: LocationDescriptor,
    options?: MemoryProtocolOptions,
  );
}

export interface QueryMiddlewareOptions {
  stringify(query: QueryDescriptor): string;
  parse(str: string): Query;
}

export function createQueryMiddleware(
  options: QueryMiddlewareOptions,
): Middleware;

export const queryMiddleware: Middleware;

export interface BasenameMiddlewareOptions {
  basename: string;
}

export function createBasenameMiddleware(
  options: BasenameMiddlewareOptions,
): Middleware;

export const locationReducer: Reducer<Location, Action>;

export class StateStorage {
  constructor(farce: FarceStoreExtension, namespace: string);

  read(location: Location, key: string | null): any;

  save(location: Location, key: string | null, value: any): void;
}
