import React, { useEffect, useState } from 'react';
import '../Options.css';
import {
  Alert,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  FormGroup,
  Grid,
  Stack,
  Step,
  StepLabel,
  Stepper,
} from '@mui/material';
import {
  InitStatus,
  getCurrentApp,
  getInitStatus,
  quitCurrentApp,
  openApp,
  getPublicKey,
  AppState,
} from '../../../helpers/model';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';

interface AlmostDoneStep {
  requireValidation: boolean;
}

interface CheckPublicKeyStep {
  publicKey: string;
}

interface CheckAppStep {
  message: string;
}

interface SetupState {
  error?: Error;
  activeStep: number;
  hint: boolean;
  checkAppStep?: CheckAppStep;
  checkPublicKeyStep?: CheckPublicKeyStep;
  almostDoneStep?: AlmostDoneStep;
}

enum SetupStep {
  AuthorizeHID = 0,
  CheckApp = 1,
  CheckPublicKey = 2,
  AlmostDone = 3,
  Done = 4,
}

const Setup: React.FC = () => {
  const [state, setState] = useState<SetupState>({
    activeStep: SetupStep.AuthorizeHID,
    hint: false,
  });

  const saveSettings = async function (publish: boolean) {
    const appState: AppState = {
      initStatus: InitStatus.Initialized,
      confirmSigningOnLedger: state.almostDoneStep?.requireValidation ?? false,
      deviceMode: 'HID',
    };
    await chrome.storage.local.set(appState);

    setState({
      ...state,
      activeStep: SetupStep.Done,
    });
  };

  const resetSettings = async function () {
    await chrome.storage.local.clear();
  };

  var display = async function () {
    var initState = await getInitStatus();
    if (initState === InitStatus.Initialized) {
      setState({ ...state, activeStep: SetupStep.Done });
      return;
    }

    if ((await TransportWebHID.list()).length == 0) {
      setState({ ...state, activeStep: SetupStep.AuthorizeHID });
      return;
    }

    var transport: TransportWebHID | null = null;
    try {
      transport = await TransportWebHID.openConnected();
      if (transport === null) throw new Error();

      setState({
        ...state,
        activeStep: SetupStep.CheckApp,
        checkAppStep: { message: 'Trying to launch app...' },
      });

      const currentApp = await getCurrentApp(transport);
      if (currentApp.name != 'Ledgstr') {
        if (currentApp.name != 'BOLOS') {
          await quitCurrentApp(transport);
        }

        try {
          await openApp(transport);
        } catch (error) {
          setState({
            ...state,
            activeStep: SetupStep.CheckApp,
            error: error as Error,
          });
        }
      }

      const publicKey = await getPublicKey(transport, 'bech32');

      setState({
        ...state,
        activeStep: SetupStep.CheckPublicKey,
        checkPublicKeyStep: { publicKey: publicKey },
      });

      await getPublicKey(transport, 'bech32', true);

      setState({
        ...state,
        activeStep: SetupStep.AlmostDone,
      });
    } catch (error) {
      setState({
        ...state,
        error: error as Error,
      });
    } finally {
      transport?.close();
    }
  };

  useEffect(() => {
    display();
  }, []);

  const connectHID = async function () {
    var transport: TransportWebHID | null = null;
    try {
      transport = await TransportWebHID.request();

      if (transport === null) {
        setState({ ...state, hint: true });
      }
    } catch (error) {
      setState({ ...state, hint: true });
    } finally {
      transport?.close();
    }

    await display();
  };

  const displayStep = function (activeStep: number) {
    switch (activeStep) {
      case SetupStep.AuthorizeHID:
        return (
          <Container className="stepbox">
            <p>1. Connect your Ledger Nano </p>
            <p>2. Click on the button below and choose your Ledger device.</p>
            <p></p>
            <button onClick={connectHID}>Connect HID</button>
            {state.hint && <p>you don't find your device? Try to unlock it.</p>}
          </Container>
        );

      case SetupStep.CheckApp:
        return <>{state.checkAppStep?.message}</>;

      case SetupStep.CheckPublicKey:
        return <>{state.checkPublicKeyStep?.publicKey}</>;
      case SetupStep.AlmostDone:
        return (
          <>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.almostDoneStep?.requireValidation}
                    onChange={() =>
                      setState({
                        ...state,
                        almostDoneStep: {
                          requireValidation:
                            !state.almostDoneStep?.requireValidation,
                        },
                      })
                    }
                  />
                }
                label="Confirm signature on ledger?"
              />
              <Button onClick={() => saveSettings(true)}>Save</Button>
            </FormGroup>
          </>
        );
      case SetupStep.Done:
        return (
          <>
            You're ready <button onClick={resetSettings}>Reset</button>
          </>
        );
      default:
        return <>To do :)</>;
    }
  };

  return (
    <>
      <Container
        sx={{ p: 2, backgroundColor: 'white', maxWidth: '800px' }}
        maxWidth={false}
      >
        <Stack alignItems="center" spacing={8}>
          <h1>Setup Ledger connection</h1>
          <Stepper activeStep={state.activeStep} alternativeLabel>
            <Step>
              <StepLabel>Authorize HID</StepLabel>
            </Step>
            <Step>
              <StepLabel>Install the App</StepLabel>
            </Step>
            <Step>
              <StepLabel>Check your pubkey</StepLabel>
            </Step>
            <Step>
              <StepLabel>Almost done</StepLabel>
            </Step>
            <Step>
              <StepLabel>It's done</StepLabel>
            </Step>
          </Stepper>
          <Grid>{displayStep(state.activeStep)}</Grid>
          {state.error && (
            <Alert severity="error">
              An error has occured: {state.error.message}. Please try again.
            </Alert>
          )}
        </Stack>
      </Container>
    </>
  );
};

export default Setup;
