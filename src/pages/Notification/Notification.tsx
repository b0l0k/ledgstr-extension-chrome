import React, { useEffect, useState } from 'react';
import './Notification.css';

const Notification = (props: { info: string }) => {
  return (
    <div className="App">
      <header className="App-header">{props.info}</header>
    </div>
  );
};

export default Notification;
