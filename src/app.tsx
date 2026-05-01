import React from 'react';
import './app.scss';

function App(props: { children?: React.ReactNode }) {
  return <>{props.children}</>;
}

export default App;
