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

export type LocationDescriptor = LocationDescriptorObject | string;

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

export interface NavigationListener {
  (
    location: Location | LocationDescriptorObject | null,
    options?: NavigationListenerOptions,
  ): NavigationListenerResult;
}

export interface Farce {
  createHref: (location: LocationDescriptor) => string;
  createLocation: (location: LocationDescriptor) => LocationDescriptorObject;
  addNavigationListener: (listener: NavigationListener) => () => void;
}

export function createHistoryEnhancer(
  options: HistoryEnhancerOptions,
): StoreEnhancer<{ farce: Farce }>;

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

interface Action<TAction extends keyof typeof ActionTypes> {
  type: typeof ActionTypes[TAction];
}

interface ActionWithPayload<
  TAction extends keyof typeof ActionTypes,
  TPayload
> extends Action<TAction> {
  payload: TPayload;
}

export const Actions: {
  init(): Action<'INIT'>;
  push(
    location: LocationDescriptor,
  ): ActionWithPayload<'PUSH', LocationDescriptor>;
  replace(
    location: LocationDescriptor,
  ): ActionWithPayload<'REPLACE', LocationDescriptor>;
  go(delta: number): ActionWithPayload<'GO', number>;
  dispose(): Action<'DISPOSE'>;
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

export interface QueryMiddlewareConfig {
  stringify(query: QueryDescriptor): string;
  parse(str: string): Query;
}

export function createQueryMiddleware(
  config: QueryMiddlewareConfig,
): Middleware;

export const queryMiddleware: Middleware;

export interface BasenameMiddlewareConfig {
  basename: string;
}

export function createBasenameMiddleware(
  config: BasenameMiddlewareConfig,
): Middleware;

export const locationReducer: Reducer<Location>;

export class StateStorage {
  constructor(farce: Farce, namespace: string);

  read(location: Location, key: string | null): any;

  save(location: Location, key: string | null, value: any): void;
}
