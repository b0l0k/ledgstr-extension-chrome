import React from 'react';
import { createRoot } from 'react-dom/client';

import Notification from './Notification';
import './index.css';

const container = document.getElementById('app-container');
const root = createRoot(container); 

const queryParameters = new URLSearchParams(window.location.search)
const info = queryParameters.get("info")

root.render(<Notification info={info}/>);
