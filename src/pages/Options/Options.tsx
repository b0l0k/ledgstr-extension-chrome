import React from 'react';
import './Options.css';
import Home from './Tabs/Home';
import Setup from './Tabs/Setup';
import {
  createHashRouter,
  Route,
  RouterProvider,
} from "react-router-dom";

interface Props {
  title: string;
}

const Options: React.FC<Props> = ({ title }: Props) => {

  const router = createHashRouter([{
    path: "/",
    element: <Home />,
  },
  {
    path: "/setup",
    element: <Setup />
  }])


  return <RouterProvider router={router} />
};

export default Options;
