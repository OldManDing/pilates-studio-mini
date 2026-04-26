import React, { useEffect } from 'react';
import { ensureMiniProgramAuth } from './api/auth';
import './app.scss';

function App(props: { children?: React.ReactNode }) {
  useEffect(() => {
    ensureMiniProgramAuth().catch(() => undefined);
  }, []);

  return <>{props.children}</>;
}

export default App;
