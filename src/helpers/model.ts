import Transport from '@ledgerhq/hw-transport';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import {
  TransportError,
  LockedDeviceError,
  StatusCodes,
} from '@ledgerhq/errors';
import {
  Event,
  UnsignedEvent,
  getEventHash,
  nip19,
  validateEvent,
} from 'nostr-tools';

export enum InitStatus {
  NotInitialized,
  Initialized,
}

export interface AppState {
  initStatus: InitStatus;
  deviceMode: 'HID';
  signingValidation: boolean;
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

  var pk = response.toString('hex').substring(4, 4 + 64);

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
  onProgress: (connectionStatus: AppStatus) => void,
  onStarted: (transport: TransportWebHID | null) => T
) {
  if ((await TransportWebHID.list()).length == 0) {
    onProgress(AppStatus.NotConnected);
    return LedgerErrors.USBNotAuthorized;
  }

  var transport: TransportWebHID | null = null;
  try {
    transport = await TransportWebHID.openConnected();
    if (transport === null) return LedgerErrors.USBNotConnected;

    onProgress(AppStatus.Loading);

    // await quitCurrentApp(transport);
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

    return onStarted(transport);
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
  var pubkey: string | LedgerErrors = '';

  var connection = await managerLedgerConnection(
    async (s: AppStatus) => {
      progress?.(s.toString());
    },
    async (t: TransportWebHID | null) => {
      return await getPublicKey(t!, bech32 ? 'bech32' : 'hex');
    }
  );

  return connection;
}

export async function signHash(transport: TransportWebHID, hex: string) {
  var result = await transport.send(
    0xe0,
    0x07,
    0x00,
    0x00,
    Buffer.from(hex, 'hex')
  );
  return result.toString('hex').substring(2, 2 + 128);
}

export async function openAndSign(
  event: Event,
  progress?: (arg0: string) => void
): Promise<string | LedgerErrors> {
  var connection = await managerLedgerConnection(
    async (s: AppStatus) => {
      progress?.(s.toString());
    },
    async (t: TransportWebHID | null) => {
      if (t == null) return LedgerErrors.USBNotConnected;
      if (!event.pubkey) event.pubkey = await getPublicKey(t, 'hex');
      if (!event.created_at) event.created_at = Math.round(Date.now() / 1000);
      if (!event.id) event.id = getEventHash(event);
      if (!validateEvent(event)) return { error: { message: 'invalid event' } };

      event.sig = await signHash(t, event.id);
      return event;
    }
  );
  console.log('openandSign', connection);
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

export interface IProviderRequestDataEvent {
  id: string;
  extension: 'ledgstr';
  type: 'getPublicKey' | 'signEvent';
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
