import { MindMapData } from '../../../data';
import RenderCache from './RenderCache';
import { animate, initializeGraph, initializeScene } from './utils';

export default async function renderMindMap(
  div: HTMLDivElement,
  data: MindMapData
) {
  const {
    scene,
    renderer,
    camera,
    controls,
    interactionManager
  } = initializeScene(div);
  const renderCache = new RenderCache({ interactionManager });
  await renderCache.preRender(data);
  const graph = initializeGraph(renderCache, data);
  scene.add(graph);
  camera.lookAt(graph.position);
  animate(() => {
    graph.tickFrame();
    controls.update();
    interactionManager.update();
    renderer.render(scene, camera);
  });
}
