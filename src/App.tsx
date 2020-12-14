import React from 'react';
import data from './data/data.json';
import { MindMap } from './features/mindMap';
import { PauseButton } from './features/pauseButton';

export default function App() {
  return (
    <>
      <PauseButton />
      <MindMap data={data} />
    </>
  );
}
