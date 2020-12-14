import React, { createRef, useEffect, RefObject } from 'react';
import { renderMindMap } from '../renderers';
import { MindMapData } from '../../../data';

interface Props {
  data: MindMapData;
}

export default function MindMap({ data }: Props) {
  const divRef: RefObject<HTMLDivElement> = createRef();
  useEffect(() => {
    renderMindMap(divRef.current!, data);
  }, [divRef, data]);
  return <div ref={divRef} />;
}
