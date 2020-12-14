import { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createCanvas, loadImage, getContextFromCanvas } from './utils';
import Dimensions from './Dimensions';

export default async function renderToCanvas(
  content: ReactElement,
  { width, height }: Dimensions
) {
  const canvas = createCanvas(width, height, true);
  const ctx = getContextFromCanvas(canvas);
  const url = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <style type="text/css">
      <![CDATA[
        ${document.getElementById('styles')?.innerHTML || ''}
      ]]>
    </style>
    <foreignObject width="${width}" height="${height}">
      <html xmlns="http://www.w3.org/1999/xhtml">
        ${renderToStaticMarkup(content)}
      </html>
    </foreignObject>
    </svg>`;
  const image = await loadImage(url);
  ctx.drawImage(image, 0, 0);
  return canvas;
}
