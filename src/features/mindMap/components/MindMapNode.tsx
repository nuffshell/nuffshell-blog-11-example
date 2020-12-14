import React from 'react';
import cx from 'classnames';

interface Props {
  level: number;
  label: string;
}

export default function MindMapNode({ level, label }: Props) {
  return (
    <div
      className={cx(
        'mind-map-node',
        level === 0 && 'magenta',
        level === 1 && 'violet',
        level === 2 && 'blue',
        level >= 3 && 'turquoise'
      )}
    >
      <div>{label}</div>
    </div>
  );
}
