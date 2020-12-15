import { InteractionManager } from "three.interactive";
import renderToSprite from "./renderToSprite";
import { MindMapNode } from "../components";
import * as THREE from "three";
import React from "react";
import MindMapNodeData from "../../../data/MindMapNodeData";

interface CreatorArguments {
  interactionManager: InteractionManager;
}

export default function createMindMapNodeRenderer({
  interactionManager,
}: CreatorArguments) {
  return async function renderMindMapNode({
    name,
    val,
    id,
  }: MindMapNodeData) {
    const sprite = await renderToSprite(
      <MindMapNode label={name} level={val} />,
      {
        width: 128,
        height: 64,
      }
    );
    sprite.renderOrder = 999;
    sprite.onBeforeRender = (renderer: THREE.WebGLRenderer) =>
      renderer.clearDepth();
    sprite.addEventListener("click", (event) => {
      event.stopPropagation();
      return console.log(`Mind map node clicked: #${id} “${name}”`);
    });
    interactionManager.add(sprite);
    return sprite;
  };
}
