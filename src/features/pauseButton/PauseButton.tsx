import React from 'react';
import { useAppConfig } from '../../storage/appConfig';
import styles from './PauseButton.module.css';

export default function PauseButton() {
  const { isPaused, togglePause } = useAppConfig();

  return (
    <button className={styles.PauseButton} onClick={togglePause}>
      {isPaused ? 'unpause' : 'pause'}
    </button>
  );
}
