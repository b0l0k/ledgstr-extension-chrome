import Transport from '@ledgerhq/hw-transport';
import LedgerTransport from '@ledgerhq/hw-transport-webhid';
import { LockedDeviceError, StatusCodes } from '@ledgerhq/errors';
import { Event, getEventHash, nip19, validateEvent } from 'nostr-tools';
import { Point } from '@noble/secp256k1';

export enum InitStatus {
  NotInitialized,
  Initialized,
}

export interface AppState {
  initStatus: InitStatus;
  deviceMode: 'HID';
  confirmSigningOnLedger: boolean;
}

export async function getInitStatus(): Promise<InitStatus> {
  const initStatus: { initStatus?: InitStatus } =
    await chrome.storage.local.get('initStatus');

  if (initStatus.initStatus === undefined) {
    initStatus.initStatus = InitStatus.NotInitialized;
    await chrome.storage.local.set(initStatus);
  }

  return initStatus.initStatus;
}

export async function openApp(transport: Transport) {
  await transport.send(0xe0, 0xd8, 0x00, 0x00, Buffer.from('Ledgstr', 'ascii'));
}

export async function quitCurrentApp(transport: Transport): Promise<void> {
  await transport.send(0xb0, 0xa7, 0x00, 0x00);
}

export async function getPublicKey(
  transport: Transport,
  format: 'hex' | 'bech32' = 'hex',
  validation: boolean = false
) {
  var response = await transport.send(
    0xe0,
    0x05,
    validation ? 0x01 : 0x00,
    0x00
  );

  var pk = response.toString('hex').substring(4, 4 + 64); // size(2) + '04' prefix

  if (format === 'bech32') return nip19.npubEncode(pk);
  else return pk;
}

export async function getCurrentApp(transport: Transport): Promise<{
  name: string;
  version: string;
  flags: number | Buffer;
}> {
  const r = await transport.send(0xb0, 0x01, 0x00, 0x00);
  let i = 0;
  const format = r[i++];

  if (format !== 1) {
    throw new Error('getAppAndVersion: format not supported');
  }

  const nameLength = r[i++];
  const name = r.slice(i, (i += nameLength)).toString('ascii');
  const versionLength = r[i++];
  const version = r.slice(i, (i += versionLength)).toString('ascii');
  const flagLength = r[i++];
  const flags = r.slice(i, (i += flagLength));
  return {
    name,
    version,
    flags,
  };
}

export enum AppStatus {
  Loading,
  NotConnected,
  NotStarted,
  RequireUpdate,
  Started,
}

export async function managerLedgerConnection<T>(
  onProgress: (connectionStatus: AppStatus) => Promise<void>,
  onStarted: (transport: LedgerTransport | null) => Promise<T>
) {
  if ((await LedgerTransport.list()).length == 0) {
    onProgress(AppStatus.NotConnected);
    return LedgerErrors.USBNotAuthorized;
  }

  var transport: LedgerTransport | null = null;
  try {
    transport = await LedgerTransport.openConnected();
    if (transport === null) return LedgerErrors.USBNotConnected;

    onProgress(AppStatus.Loading);

    var currentApp = await getCurrentApp(transport);
    if (currentApp.name != 'Ledgstr') {
      if (currentApp.name != 'BOLOS') {
        await quitCurrentApp(transport);
      }

      try {
        await openApp(transport);
        currentApp = await getCurrentApp(transport);
      } catch (error) {
        throw error;
      }
    }

    if (+currentApp.version[0] < 1) {
      onProgress(AppStatus.RequireUpdate);
      return;
    }

    return await onStarted(transport);
  } catch (error: any) {
    if (error instanceof LockedDeviceError) {
      return LedgerErrors.DeviceLocked;
    }
    if (error.statusCode != null) {
      return error.message;
      return mapToLedgerErrors(error.statusCode);
    }

    return error.message;
  } finally {
    transport?.close();
  }
}

export async function openAndGetPublicKey(
  progress?: (arg0: string) => void,
  bech32: boolean = false
): Promise<string | LedgerErrors> {
  var result = await managerLedgerConnection(
    async (s: AppStatus) => {
      progress?.(s.toString());
    },
    async (t: LedgerTransport | null) => {
      return await getPublicKey(t!, bech32 ? 'bech32' : 'hex');
    }
  );

  return result;
}

export async function signHash(
  transport: LedgerTransport,
  hex: string,
  confirmSigningOnLedger: boolean
): Promise<string> {
  var result = await transport.send(
    0xe0,
    0x07,
    confirmSigningOnLedger ? 0x01 : 0x00,
    0x00,
    Buffer.from(hex, 'hex')
  );
  return result.toString('hex').substring(2, 2 + 128);
}

export async function openAndSign(
  event: Event,
  confirmSigningOnLedger: boolean,
  progress?: (arg0: string) => void
): Promise<string | LedgerErrors> {
  var connection = await managerLedgerConnection(
    async (s: AppStatus) => {
      progress?.(s.toString());
    },
    async (t: LedgerTransport | null) => {
      if (t == null) return LedgerErrors.USBNotConnected;
      if (!event.pubkey) event.pubkey = await getPublicKey(t, 'hex');
      if (!event.created_at) event.created_at = Math.round(Date.now() / 1000);
      if (!event.id) event.id = getEventHash(event);
      if (!validateEvent(event)) return { error: { message: 'invalid event' } };

      event.sig = await signHash(t, event.id, confirmSigningOnLedger);
      return event;
    }
  );
  console.log('openandSign', connection);
  return connection;
}

function chunks(buffer: Buffer, chunkSize: number, padding = true): Buffer[] {
  assert(Buffer.isBuffer(buffer), 'Buffer is required');
  assert(
    !isNaN(chunkSize) && chunkSize > 0,
    'Chunk size should be positive number'
  );

  var result = [];
  var len = buffer.length;
  var i = 0;

  while (i < len) {
    result.push(buffer.slice(i, (i += chunkSize)));
  }

  if (result[result.length - 1].length < chunkSize && padding) {
    result[result.length - 1] = Buffer.concat([
      result[result.length - 1],
      Buffer.alloc(chunkSize - result[result.length - 1].length, 0),
    ]);
  }

  return result;
}

function assert(cond: boolean, err: string) {
  if (!cond) {
    throw new Error(err);
  }
}

function removePKCS7PaddingInBlocks(buffer: Buffer, blockSize: number) {
  var buffers = [];
  const blockCount = Math.ceil(buffer.length / blockSize);
  for (let i = 0; i < blockCount; i++) {
    const block = buffer.slice(i * blockSize, (i + 1) * blockSize);
    const [paddingPresent, blockBuffer] = removePKCS7PaddingInBlock(block);
    buffers.push(blockBuffer);
    if (paddingPresent) {
      break;
    }
  }
  return Buffer.concat(buffers);
}

function removePKCS7PaddingInBlock(buffer: Buffer): [boolean, Buffer] {
  const padding = buffer[buffer.length - 1];
  if (padding < 1 || padding > buffer.length) {
    return [false, buffer];
  }
  for (let i = buffer.length - padding; i < buffer.length; i++) {
    if (buffer[i] !== padding) {
      return [false, buffer];
    }
  }
  return [true, buffer.slice(0, buffer.length - padding)];
}

export async function sendBulk(
  transport: LedgerTransport,
  ins: number,
  buffers: Buffer[]
) {
  var results = [];
  var i = 0;
  for (const element in buffers) {
    console.log(
      'e0' +
        ins.toString(16) +
        i.toString().padStart(2, '0') +
        (i == buffers.length - 1 ? '00' : '80') +
        buffers[element].byteLength.toString(16) +
        buffers[element].toString('hex')
    );

    var result = await transport.send(
      0xe0,
      ins,
      i,
      i == buffers.length - 1 ? 0x00 : 0x80,
      buffers[element],
      [StatusCodes.OK, 0x6100]
    );

    i++;

    if (result.length == 2) continue;
    if (result[result.length - 2] == 0x61) {
      var pages = [result.subarray(0, result.length - 2)];
      var page;
      do {
        console.log('get more data');
        page = await transport.send(0xe0, 0xc0, 0x00, 0x00, undefined, [
          StatusCodes.OK,
          0x6100,
        ]);
        pages.push(page.subarray(0, page.length - 2));
      } while (page[result.length - 2] == 0x61);

      result = Buffer.concat(pages);
    }

    console.log(result.toString('hex'));
    results.push(result);
  }

  return results;
}

export async function encrypt(
  transport: LedgerTransport,
  uncompressedPublicKey: string,
  plaintext: string
): Promise<string> {
  const uncompressedPublicKeyBytes = Buffer.from(uncompressedPublicKey, 'hex');
  const plaintextBytes = chunks(Buffer.from(plaintext, 'utf8'), 128, false);

  const result = await sendBulk(
    transport,
    0x08,
    [uncompressedPublicKeyBytes].concat(plaintextBytes)
  );

  if (result === undefined) throw new Error('Ledger did not return a result.');
  if (result.length != 1)
    throw new Error('Ledger must return only 1 data for this command.');

  const contentSize = parseInt(
    result[0].subarray(0, 4).reverse().toString('hex'),
    16
  );

  const ivSize = result[0][4];
  const ivResult = result[0].subarray(5, ivSize + 5);
  const contentChunk = result[0].subarray(5 + ivSize, 5 + ivSize + contentSize);

  return contentChunk.toString('base64') + '?iv=' + ivResult.toString('base64');
}

export async function decrypt(
  transport: LedgerTransport,
  uncompressedPublicKey: string,
  cyphertext: string
): Promise<string> {
  const uncompressedPublicKeyBytes = Buffer.from(uncompressedPublicKey, 'hex');
  const [contentB64, ivB64] = cyphertext.split('?iv=');

  const ivBytes = Buffer.from(ivB64, 'base64');
  const contentBytes = chunks(Buffer.from(contentB64, 'base64'), 128, false);

  try {
    const result = await sendBulk(
      transport,
      0x09,
      [uncompressedPublicKeyBytes, ivBytes].concat(contentBytes)
    );
    if (result === undefined) throw new Error('Ledger did not return a result');
    if (result.length != 1)
      throw new Error('Ledger must return only 1 data for this command.');

    const contentSize = parseInt(
      result[0].subarray(0, 4).reverse().toString('hex'),
      16
    );

    var plaintextBytes = removePKCS7PaddingInBlocks(
      result[0].subarray(4, 4 + contentSize),
      16
    );

    console.log(plaintextBytes);
    return plaintextBytes
      .toString('utf8')
      .replace(/^[\s\uFEFF\xA0\0]+|[\s\uFEFF\xA0\0]+$/g, '');
  } catch (error) {
    return (
      'Unable to decrypt with your Ledger. Please make sure you are using the correct key. ' +
      error.message
    );
  }
}

export async function openAndEncrypt(
  peer: string,
  plaintext: string,
  progress?: (arg0: string) => void
): Promise<string | LedgerErrors> {
  var connection = await managerLedgerConnection(
    async (s: AppStatus) => {
      progress?.(s.toString());
    },
    async (t: LedgerTransport | null) => {
      if (t == null) return LedgerErrors.USBNotConnected;

      const uncompressedPublicKey = Point.fromHex(peer).toHex().substring(2);

      var encryptResult = await encrypt(t, uncompressedPublicKey, plaintext);

      return encryptResult;
    }
  );
  console.log('openandEncrypt', connection);
  return connection;
}

export async function openAndDecrypt(
  peer: string,
  cyphertext: string,
  progress?: (arg0: string) => void
): Promise<string | LedgerErrors> {
  var connection = await managerLedgerConnection(
    async (s: AppStatus) => {
      progress?.(s.toString());
    },
    async (t: LedgerTransport | null) => {
      if (t == null) return LedgerErrors.USBNotConnected;

      const uncompressedPublicKey = Point.fromHex(peer).toHex().substring(2);
      const result = await decrypt(t, uncompressedPublicKey, cyphertext);

      return result;
    }
  );
  console.log('openAndDecrypt', connection);
  return connection;
}

enum LedgerErrors {
  ApplicationNotPresent = 0x6807,
  USBNotConnected = 'USBNotConnected',
  DeviceLocked = 'DeviceLocked',
  Unknown = 0x99999,
  USBNotAuthorized = 'USBNotAuthorized',
}

function mapToLedgerErrors(errorStr: string) {
  var value = (
    Object.keys(LedgerErrors) as Array<keyof typeof LedgerErrors>
  ).find((k) => LedgerErrors[k] == errorStr);
  return value ?? LedgerErrors.Unknown;
}

export interface IContentScriptMessage {
  id: string;
  extension: 'ledgstr';
  type: 'open' | 'close' | 'info';
  params: any;
}

export type INostrProviderRequestType =
  | 'getPublicKey'
  | 'signEvent'
  | 'nip04.encrypt'
  | 'nip04.decrypt';

export interface IProviderRequestDataEvent {
  id: string;
  extension: 'ledgstr';
  type: INostrProviderRequestType;
  params: any;
}

export interface IResponseDataEvent {
  id: any;
  extension: 'ledgstr';
  response: any;
}

export function isResponse(
  message: MessageEvent
): message is MessageEvent<IResponseDataEvent> {
  return (
    message.data.extension === 'ledgstr' &&
    message.data.hasOwnProperty('response')
  );
}

export function isMessageFromProvider(
  message: MessageEvent
): message is MessageEvent<IProviderRequestDataEvent> {
  return (
    message.data.extension === 'ledgstr' &&
    message.data.hasOwnProperty('params')
  );
}

export function isContentScriptMessage(
  object: any
): object is IContentScriptMessage {
  return 'extension' in object && object['extension'] === 'ledgstr';
}
