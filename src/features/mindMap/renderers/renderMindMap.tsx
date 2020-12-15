import { MindMapData } from "../../../data";
import RenderCache from "./RenderCache";
import { animate, initializeGraph, initializeScene } from "./utils";
import createMindMapNodeRenderer from "./createMindMapNodeRenderer";
import createLinkMaterial from "./createLinkMaterial";

export default async function renderMindMap(
  div: HTMLDivElement,
  data: MindMapData
) {
  const {
    scene,
    renderer,
    camera,
    controls,
    interactionManager,
  } = initializeScene(div);
  const renderCache = new RenderCache({
    renderMindMapNode: createMindMapNodeRenderer({ interactionManager }),
    createLinkMaterial
  });
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
