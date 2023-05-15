import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import qs from 'qs';
import {
  IContentScriptMessage,
  INostrProviderRequestType,
  IProviderRequestDataEvent,
  IResponseDataEvent,
  isResponse,
} from '../../../helpers/model';
import { decrypt } from 'nostr-tools/lib/nip04';

declare global {
  interface Window {
    nostr: {
      _requests: { [id: string]: { resolve: Function; reject: Function } };
      _pubkey: string | null;
      getPublicKey(): Promise<string | null>;
      signEvent(event: string): Promise<string>;
      // getRelays(): Promise<string[]>;
      nip04: {
        encrypt(peer: string, plaintext: string): Promise<string>;
        decrypt(peer: string, ciphertext: string): Promise<string>;
      };
      _call(type: INostrProviderRequestType, params: any): Promise<any>;
    };
  }
}

window.nostr = {
  _requests: {},
  _pubkey: null,

  async getPublicKey(): Promise<string | null> {
    if (this._pubkey) return this._pubkey;
    this._pubkey = await this._call('getPublicKey', {});
    return this._pubkey;
  },

  async signEvent(event) {
    return await this._call('signEvent', { event });
  },

  nip04: {
    async encrypt(peer: string, plaintext: string): Promise<string> {
      return await window.nostr._call('nip04.encrypt', { peer, plaintext });
    },
    async decrypt(peer: string, cyphertext: string): Promise<string> {
      return await window.nostr._call('nip04.decrypt', { peer, cyphertext });
    },
  },

  _call(type: INostrProviderRequestType, params) {
    return new Promise((resolve, reject) => {
      let id = Math.random().toString().slice(4);
      this._requests[id] = { resolve, reject };
      window.postMessage(
        <IProviderRequestDataEvent>{
          id,
          extension: 'ledgstr',
          type,
          params,
        },
        '*'
      );
    });
  },
};

window.addEventListener('message', (message: MessageEvent) => {
  if (!message.data) return;

  if (isResponse(message)) {
    if (!window.nostr._requests[message.data.id]) {
      console.error('Response without request', message.data);
      return;
    }

    if (message.data.response.error) {
      let error = new Error('ledgstr: ' + message.data.response.error.message);
      error.stack = message.data.response.error.stack;
      window.nostr._requests[message.data.id].reject(error);
    } else {
      window.nostr._requests[message.data.id].resolve(message.data.response);
    }

    delete window.nostr._requests[message.data.id];
  }
});
