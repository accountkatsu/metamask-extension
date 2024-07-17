export type MessageType = {
  command:
    | 'openTabs'
    | 'notFound'
    | 'queryTabs'
    | 'waitUntilWindowWithProperty';
  tabs?: Handle[];
  title?: string;
  property?: WindowProperties;
  value?: string;
};

export type WindowProperties = 'title' | 'url';
