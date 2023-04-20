import React, { useEffect } from 'react';
import '../Options.css';
import { InitStatus } from '../../../helpers/model';

const Home: React.FC = () => {
  useEffect(() => {
    async function run() {
      var appState = await chrome.storage.local.get();

      if (
        appState.hasOwnProperty('initStatus') == false ||
        appState.initStatus === InitStatus.NotInitialized
      ) {
        window.location.href = '#' + '/setup';
      }
    }
    run();
  }, []);
  return <div className="OptionsContainer"></div>;
};

export default Home;
