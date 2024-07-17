import events from 'events';
import log from 'loglevel';
import { WebSocketServer } from 'ws';
import { MessageType } from './message-type';
import { WindowProperties } from './window-handles';

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

    log.debug('ServerMochaToBackground created');

    this.server.on('connection', (ws: WebSocket) => {
      this.ws = ws;

      ws.onmessage = (ev: MessageEvent) => {
        let message: MessageType;

        try {
          message = JSON.parse(ev.data);
        } catch (e) {
          log.error('error in JSON', e);
          return;
        }

        this.receivedMessage(message);
      };
    });

    this.eventEmitter = new events.EventEmitter();
  }

  // This function is never explicitly called, but in the future it could be
  stop() {
    this.ws?.close();

    this.server.close();

    log.debug('ServerMochaToBackground stopped');
  }

  // Send a message to the Extension background script (service worker in MV3)
  send(message: MessageType) {
    if (!this.ws) {
      log.debug('No client connected');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  // Handle messages received from the Extension background script (service worker in MV3)
  private receivedMessage(message: MessageType) {
    if (message.command === 'openTabs') {
      this.eventEmitter.emit('openTabs', message);
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
    this.send({ command: 'waitUntilWindowWithProperty', property, value });

    const tabs = await this.waitForResponse();
    log.debug('got the response', tabs);

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
