export type MessageType = {
  command:
    | 'openTabs'
    | 'notFound'
    | 'queryTabs'
    | 'waitUntilWindowWithProperty';
  tabs?: chrome.tabs.Tab[];
  title?: string;
  property?: WindowProperties;
  value?: string;
};

export type Handle = {
  id: string;
  title: string;
  url: string;
};

export type WindowProperties = 'title' | 'url';

export type ServerMochaEventEmitterType = {
  openTabs: [openTabs: chrome.tabs.Tab[]];
  notFound: [openTabs: chrome.tabs.Tab[]];
};

export interface ServerToClientEvents {
  openTabs: (tabs: chrome.tabs.Tab[]) => void;
  notFound: () => void;
  queryTabs: (title: string) => void;
  waitUntilWindowWithProperty: (
    property: WindowProperties,
    value: string,
  ) => void;
}

export interface ClientToServerEvents {
  openTabs: (tabs: chrome.tabs.Tab[]) => void;
  notFound: () => void;
}

// console.log('bitoeee');
// console.log('bito', ServerMochaEventEmitterType);
