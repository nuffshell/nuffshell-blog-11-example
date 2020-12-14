import MindMapNodeData from './MindMapNodeData';
import MindMapLinkData from './MindMapLinkData';

interface MindMapData {
  nodes: Array<MindMapNodeData>;
  links: Array<MindMapLinkData>;
}

export default MindMapData;
