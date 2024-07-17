import events from 'events';
import { WebSocketServer } from 'ws';
import {
  MessageType,
  ServerMochaEventEmitterType,
  WindowProperties,
} from './types';

/**
 * This singleton class runs on the Mocha/Selenium test.
 * It's used to communicate from the Mocha/Selenium test to the Extension background script (service worker in MV3).
 */
class ServerMochaToBackground {
  private server: WebSocketServer;

  private ws: WebSocket | null = null;

  private eventEmitter;

  constructor() {
    this.server = new WebSocketServer({ port: 8111 });

    console.debug('ServerMochaToBackground created');

    this.server.on('connection', (ws: WebSocket) => {
      this.ws = ws;

      ws.onmessage = (ev: MessageEvent) => {
        let message: MessageType;

        try {
          message = JSON.parse(ev.data);
        } catch (e) {
          throw new Error(
            'Error in JSON sent to ServerMochaToBackground: ' +
              (e as Error).message,
          );
        }

        this.receivedMessage(message);
      };
    });

    this.eventEmitter = new events.EventEmitter<ServerMochaEventEmitterType>();
  }

  // This function is never explicitly called, but in the future it could be
  stop() {
    this.ws?.close();

    this.server.close();

    console.debug('ServerMochaToBackground stopped');
  }

  // Send a message to the Extension background script (service worker in MV3)
  send(message: MessageType) {
    if (!this.ws) {
      throw new Error('No client connected');
    }

    this.ws.send(JSON.stringify(message));
  }

  // Handle messages received from the Extension background script (service worker in MV3)
  private receivedMessage(message: MessageType) {
    if (message.command === 'openTabs' && message.tabs) {
      console.debug('ServerMochaToBackground openTabsBinx', message.tabs);
      this.eventEmitter.emit('openTabs', message.tabs);
    } else if (message.command === 'notFound') {
      throw new Error('No window found by background script');
    }
  }

  // This is not used in the current code, but could be used in the future
  queryTabs(tabTitle: string) {
    this.send({ command: 'queryTabs', title: tabTitle });
  }

  // Sends the message to the Extension, and waits for a response
  async waitUntilWindowWithProperty(property: WindowProperties, value: string) {
    console.debug('ServerMochaToBackground dinkadee1');
    this.send({ command: 'waitUntilWindowWithProperty', property, value });
    console.debug('ServerMochaToBackground dinkadee');

    const tabs = await this.waitForResponse();
    console.debug('ServerMochaToBackground got the response', tabs);

    // The return value here is less useful than we had hoped, because the tabs
    // are not in the same order as driver.getAllWindowHandles()
    return tabs;
  }

  // This is a way to wait for an event async, without timeouts or polling
  async waitForResponse() {
    return new Promise((resolve) => {
      this.eventEmitter.once('openTabs', resolve);
    });
  }
}

// Singleton setup below
let _serverMochaToBackground: ServerMochaToBackground;

export function getServerMochaToBackground() {
  if (!_serverMochaToBackground) {
    startServerMochaToBackground();
  }

  return _serverMochaToBackground;
}

function startServerMochaToBackground() {
  _serverMochaToBackground = new ServerMochaToBackground();
}
