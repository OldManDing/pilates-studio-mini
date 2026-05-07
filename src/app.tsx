import React from 'react';
import { installFeedbackGuards } from './utils/feedback';
import './app.scss';

installFeedbackGuards();

function App(props: { children?: React.ReactNode }) {
  return <>{props.children}</>;
}

export default App;
