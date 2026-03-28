import { Agentation } from 'agentation';

const defaultEndpoint = 'http://localhost:4747';

export default function AgentationBridge({ endpoint = defaultEndpoint }) {
  return <Agentation endpoint={endpoint} />;
}
