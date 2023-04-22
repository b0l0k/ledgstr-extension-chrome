import React, { useEffect, useState } from 'react';
import '../Options.css';
import { InitStatus } from '../../../helpers/model';
import {
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  FormGroup,
  Grid,
  Stack,
} from '@mui/material';

const Home: React.FC = () => {
  const [state, setState] = useState({
    loading: true,
    confirmSigningOnLedger: false,
  });

  useEffect(() => {
    async function run() {
      var appState = await chrome.storage.local.get();

      if (
        appState.hasOwnProperty('initStatus') == false ||
        appState.initStatus === InitStatus.NotInitialized
      ) {
        window.location.href = '#' + '/setup';
      } else {
        setState({
          loading: false,
          confirmSigningOnLedger: appState.confirmSigningOnLedger,
        });
      }
    }
    run();
  }, []);

  const saveSettings = async function () {
    await chrome.storage.local.set({
      confirmSigningOnLedger: state.confirmSigningOnLedger,
    });
  };

  return (
    <Container
      sx={{ p: 2, backgroundColor: 'white', maxWidth: '800px' }}
      maxWidth={false}
    >
      <Stack alignItems="center" spacing={8}>
        <h1>Preferences</h1>
        <Grid>
          {state.loading == false ? (
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.confirmSigningOnLedger}
                    onChange={() =>
                      setState({
                        ...state,
                        confirmSigningOnLedger: !state.confirmSigningOnLedger,
                      })
                    }
                  />
                }
                label="Confirm signature on ledger?"
              />
              <Button onClick={() => saveSettings()}>Save</Button>
            </FormGroup>
          ) : (
            <>Loading ...</>
          )}
        </Grid>
      </Stack>
    </Container>
  );
};

export default Home;
