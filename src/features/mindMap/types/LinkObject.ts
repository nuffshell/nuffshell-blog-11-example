import NodeObject from './NodeObject';

type LinkObject = object & {
  source?: string | number | NodeObject;
  target?: string | number | NodeObject;
};

export default LinkObject;
