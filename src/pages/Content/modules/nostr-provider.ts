import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import qs from 'qs';
import {
  IProviderRequestDataEvent,
  IResponseDataEvent,
  isResponse,
} from '../../../helpers/model';

declare global {
  interface Window {
    nostr: {
      _requests: { [id: string]: { resolve: Function; reject: Function } };
      _pubkey: string | null;
      getPublicKey(): Promise<string | null>;
      signEvent(event: string): Promise<string>;
      // getRelays(): Promise<string[]>;
      // nip04: {
      //   encrypt(peer: string, plaintext: string): Promise<string>;
      //   decrypt(peer: string, ciphertext: string): Promise<string>;
      // };
      _call(type: string, params: any): Promise<any>;
    };
  }
}

// export async function getPublicKey(
//   progress?: (string) => void,
//   bech32: boolean = false
// ): Promise<string | LedgerErrors> {
//   try {
//     if ((await TransportWebHID.list()).length == 0) {
//       return LedgerErrors.USBNotAuthorized;
//     }

//     progress = progress ?? function (s) {};

//     progress('Trying to open Ledgstr app');

//     var transport = await TransportWebHID.openConnected();
//     if (transport == null) return LedgerErrors.USBNotConnected;

//     await openApp(transport);

//     progress('Getting the public key');
//     var response = await transport.send(0xe0, 0x05, 0x00, 0x00);
//     transport?.close();

//     var pk = response.toString('hex').substring(4, 4 + 64);
//     if (bech32) return nip19.npubEncode(pk);
//     else return pk;
//   } catch (error: any) {
//     if (error instanceof LockedDeviceError) {
//       return LedgerErrors.DeviceLocked;
//     }
//     if (error.statusCode != null) {
//       return error.statusCode;
//       return mapToLedgerErrors(error.statusCode);
//     }

//     return error.message;
//   }

//   return LedgerErrors.Unknown;
// }

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

  _call(type, params) {
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
