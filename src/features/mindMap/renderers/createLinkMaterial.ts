import * as THREE from "three";
import { colorsByLevel } from "../config";

export default function createLinkMaterial(val: number) {
  return new THREE.MeshBasicMaterial({
    color: colorsByLevel[val],
  });
}
