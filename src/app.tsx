import React, { useEffect } from 'react';
import { ensureMiniProgramAuth } from './api/auth';
import './app.scss';

function App(props: { children?: React.ReactNode }) {
  useEffect(() => {
    ensureMiniProgramAuth().catch((error) => {
      console.error('Failed to initialize mini program auth:', error);
    });
  }, []);

  return <>{props.children}</>;
}

export default App;
