// Copied from the source code of three-forcegraph:
// The type is not exported by the library, so we have
// to duplicate and duck-type it

type NodeObject = object & {
  id?: string | number;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
};

export default NodeObject;
