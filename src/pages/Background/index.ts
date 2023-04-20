import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import {
  IContentScriptMessage,
  getPublicKey,
  isContentScriptMessage,
} from '../../helpers/model';

chrome.runtime.onInstalled.addListener((args) => {
  if (args.reason === 'install') chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener(async (req, sender) => {
  if (isContentScriptMessage(req)) {
    return handleMessage(req);
  }
});

var lastInfo: string;

async function handleMessage(req: IContentScriptMessage) {
  if (req.type === 'open') {
    return chrome.windows.create({
      url: `${chrome.runtime.getURL('notification.html')}?${
        req.params !== null
          ? `params=${req.params}`
          : lastInfo === null
          ? ''
          : `info=${lastInfo}`
      }`,
      type: 'popup',
      width: 340,
      height: 330,
    });
  } else if (req.type === 'info') {
    lastInfo = req.params;
  }
}
