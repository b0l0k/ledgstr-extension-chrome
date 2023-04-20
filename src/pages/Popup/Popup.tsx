import React, { useEffect, useState } from 'react';
import logo from '../../assets/img/logo.svg';
import './Popup.css';
import {
  InitStatus,
  getInitStatus,
  getPublicKey,
  managerLedgerConnection,
} from '../../helpers/model';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import {
  TransportError,
  LockedDeviceError,
  StatusCodes,
} from '@ledgerhq/errors';
import { Container } from '@mui/material';

enum AppStatus {
  Loading,
  NotConnected,
  NotStarted,
  RequireUpdate,
  Started,
}

interface PopupState {
  publicKey?: string;
  appStatus?: AppStatus;
  initStatus: InitStatus;
  loading: boolean;
}

const Popup = () => {
  const [state, setState] = useState<PopupState>({
    initStatus: InitStatus.NotInitialized,
    loading: true,
  });

  const renderContent = function () {
    if (state.initStatus === InitStatus.NotInitialized) {
      return (
        <>
          <Container>
            <h2>Welcome !</h2>
            <p>
              You first need to authorize the extension to connect to your
              Ledger from the option page
            </p>
            <img src={logo} className="App-logo" alt="logo" />
            <a
              className="App-link"
              onClick={() =>
                chrome.tabs.create({
                  url: chrome.runtime.getURL('options.html#/setup'),
                })
              }
            >
              Go to options
            </a>
          </Container>
        </>
      );
    } else if (
      state.initStatus === InitStatus.Initialized &&
      state.appStatus === AppStatus.Loading
    ) {
      return <>Connecting to your Ledger...</>;
    } else if (
      state.initStatus === InitStatus.Initialized &&
      state.appStatus === AppStatus.NotStarted
    ) {
      return <>Please start the app on your Ledger</>;
    } else if (
      state.initStatus === InitStatus.Initialized &&
      state.appStatus === AppStatus.RequireUpdate
    ) {
      return <>Please update the app on your Ledger</>;
    } else if (
      state.initStatus === InitStatus.Initialized &&
      state.appStatus === AppStatus.Started
    ) {
      return (
        <>
          <Container>
            <img src={logo} className="App-logo" alt="logo" />
            <p>Your public key:</p>{' '}
            <p style={{ fontSize: 10 }}>{state.publicKey}</p>
            <a
              className="App-link"
              onClick={() =>
                chrome.tabs.create({
                  url: chrome.runtime.getURL('options.html#/setup'),
                })
              }
            >
              Go to options
            </a>
          </Container>
        </>
      );
    }

    return <>Unknown state</>;
  };

  const display = async function () {
    var currentInitStatus = await getInitStatus();

    setState({
      ...state,
      initStatus: currentInitStatus,
      loading: false,
    });

    if (currentInitStatus === InitStatus.NotInitialized) {
      return;
    } else if (currentInitStatus === InitStatus.Initialized) {
      console.log('start managerLedgerConnection');

      await managerLedgerConnection(
        async (s) => {
          console.log('managerLedgerConnection', s);
          switch (s) {
            case AppStatus.Loading:
              setState({
                ...state,
                initStatus: InitStatus.Initialized,
                loading: false,
                appStatus: s,
              });
              break;
            case AppStatus.NotStarted:
              setState({
                ...state,
                initStatus: InitStatus.Initialized,
                loading: false,
                appStatus: s,
              });
              break;
            case AppStatus.RequireUpdate:
              setState({
                ...state,
                initStatus: InitStatus.Initialized,
                loading: false,
                appStatus: s,
              });
              break;
          }
        },
        async (t) => {
          setState({
            ...state,
            initStatus: InitStatus.Initialized,
            loading: false,
            appStatus: AppStatus.Started,
            publicKey: 'Loading from the app...',
          });

          try {
            setState({
              ...state,
              publicKey: await getPublicKey(t, 'bech32'),
              initStatus: InitStatus.Initialized,
              loading: false,
              appStatus: AppStatus.Started,
            });
          } catch (error: Error) {
            if (
              error instanceof LockedDeviceError ||
              error?.statusCode == 0x530c
            ) {
              setState({
                ...state,
                publicKey: 'Device is locked, please unlock',
                initStatus: InitStatus.Initialized,
                loading: false,
                appStatus: AppStatus.Started,
              });
            } else {
              setState({
                ...state,
                publicKey: 'Unknown error' + error.message,
                initStatus: InitStatus.Initialized,
                loading: false,
                appStatus: AppStatus.Started,
              });
            }
          }
        }
      );
    }
  };

  useEffect(() => {
    display();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        {state.loading && <p>Loading...</p>}
        {state.loading === false && renderContent()}
      </header>
    </div>
  );
};

export default Popup;
