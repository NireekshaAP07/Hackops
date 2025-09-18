import React from 'react';
import Scheduler from './components/Scheduler';

export default function App(){
  return (
    <div style={{fontFamily:'Arial, sans-serif', padding:20}}>
      <h1>Study Group Scheduler</h1>
      <Scheduler />
    </div>
  );
}
