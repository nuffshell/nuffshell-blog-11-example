import React from "react";
import * as THREE from "three";
import { LinkObject, NodeObject, PreRendered } from "../types";
import { MindMapData } from "../../../data";
import MindMapNodeData from "../../../data/MindMapNodeData";

interface Constructor {
  renderMindMapNode: ({ name, val, id }: MindMapNodeData) => Promise<THREE.Object3D>;
  createLinkMaterial: (val: number) => THREE.Material;
}

export default class RenderCache {
  private readonly preRendered: Map<
    string | number | NodeObject | undefined,
    PreRendered
  > = new Map();

  private readonly renderMindMapNode;

  private readonly createLinkMaterial;

  constructor({ renderMindMapNode, createLinkMaterial }: Constructor) {
    this.renderMindMapNode = renderMindMapNode;
    this.createLinkMaterial = createLinkMaterial;
  }

  preRender(data: MindMapData) {
    return Promise.all(
      data.nodes.map(async ({ name, val, id }) => {
        const sprite = await this.renderMindMapNode({ name, val, id });
        const linkMaterial = this.createLinkMaterial(val);
        this.preRendered.set(id, { sprite, linkMaterial });
      })
    );
  }

  createNodeThreeObjectCallback() {
    return ({ id }: NodeObject) => {
      const sprite = this.preRendered.get(id)?.sprite;
      if (!sprite) {
        // if this happens, then there is a problem in the program code
        // leaving this check in (rather than using ! instead of ? above)
        // because caching can get complicated
        console.error(`Error – no pre-rendered mind map node for ID ${id}`);
        return new THREE.Mesh(
          new THREE.BoxGeometry(),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
      }
      return sprite;
    };
  }

  createLinkMaterialCallback() {
    return ({ source }: LinkObject) => {
      const linkMaterial = this.preRendered.get(source)?.linkMaterial;
      if (!linkMaterial) {
        // if this happens, then there is a problem in the program code
        // leaving this check in (rather than using ! instead of ? above)
        // because caching can get complicated
        console.error(
          `Error – no pre-rendered link material for source ID ${source}`
        );
        return new THREE.MeshBasicMaterial({ color: 0xffffff });
      }
      return linkMaterial;
    };
  }
}
