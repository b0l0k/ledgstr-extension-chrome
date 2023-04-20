import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import {
  IContentScriptMessage,
  IProviderRequestDataEvent,
  IResponseDataEvent,
  isMessageFromProvider,
  openAndGetPublicKey,
  openAndSign,
} from '../../helpers/model';

// inject the script that will provide window.nostr
const script = document.createElement('script');
script.setAttribute('async', 'false');
script.setAttribute('type', 'text/javascript');
script.setAttribute('src', chrome.runtime.getURL('nostrProvider.bundle.js'));
document.head.appendChild(script);

window.addEventListener('message', async (message: MessageEvent<any>) => {
  if (message.source !== window) return;

  if (isMessageFromProvider(message)) {
    const response = await handleMessage(message);

    // return response
    window.postMessage(
      <IResponseDataEvent>{
        id: message.data.id,
        extension: 'ledgstr',
        response,
      },
      message.origin
    );
  }
});

const handleMessage = async (
  message: MessageEvent<IProviderRequestDataEvent>
) => {
  try {
    switch (message.data.type) {
      case 'getPublicKey': {
        var transport = await TransportWebHID.create();
        transport.close();

        const timeOut = setTimeout(() => {
          chrome.runtime.sendMessage(<IContentScriptMessage>{
            id: message.data.id,
            type: 'open',
            extension: 'ledgstr',
          });
        }, 2000);

        var result = await openAndGetPublicKey(async (s) => {
          await chrome.runtime.sendMessage(<IContentScriptMessage>{
            id: message.data.id,
            type: 'info',
            extension: 'ledgstr',
            params: s,
          });
        });

        clearTimeout(timeOut);

        if (typeof result !== 'string') {
          await chrome.runtime.sendMessage(<IContentScriptMessage>{
            id: message.data.id,
            type: 'open',
            extension: 'ledgstr',
            params: result,
          });

          throw new Error('Unable to get the pubkey, check your device');
        }

        return result;
      }
      case 'signEvent': {
        var transport = await TransportWebHID.create();
        transport.close();

        // const timeOut = setTimeout(() => {
        //   chrome.runtime.sendMessage(<IContentScriptMessage>{
        //     id: message.data.id,
        //     type: 'open',
        //     extension: 'ledgstr',
        //   });
        // }, 2000);

        var result = await openAndSign(message.data.params.event, async (s) => {
          await chrome.runtime.sendMessage(<IContentScriptMessage>{
            id: message.data.id,
            type: 'info',
            extension: 'ledgstr',
            params: s,
          });
        });

        // clearTimeout(timeOut);

        // if (typeof result === 'number') {
        //   await chrome.runtime.sendMessage(<IContentScriptMessage>{
        //     id: message.data.id,
        //     type: 'open',
        //     extension: 'ledgstr',
        //     params: result,
        //   });

        //   throw new Error('Unable o get the pubkey, check your device');
        // }

        return result;
      }

      default: {
        // pass on to background
        return await chrome.runtime.sendMessage({
          type: message.data.type,
          params: message.data.params,
          host: location.host,
          cs: true,
        });
      }
    }
  } catch (error) {
    return { error };
  }
};
