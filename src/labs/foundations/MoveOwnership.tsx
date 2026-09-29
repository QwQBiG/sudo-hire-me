import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Experiment } from '../../components/Experiment';
import {
  inspectMoveExpression,
  ownershipState,
  transferUniqueOwner,
} from '../../domain/move-ownership.mjs';
import './move-ownership.css';

export default function MoveOwnership() {
  const [state, setState] = useState(ownershipState());
  const [message, setMessage] = useState('p 独占整数对象 7，q 为空。');
  const source = state.owner;
  const destination = source === 'p' ? 'q' : 'p';

  return (
    <Experiment
      className="move-ownership-lab"
      title="所有权交接台"
      subtitle="固定 std::unique_ptr<int> 与值 7。先试单独求值 std::move，再让另一个 unique_ptr 接收。"
      onReset={() => {
        setState(ownershipState());
        setMessage('p 独占整数对象 7，q 为空。');
      }}
    >
      <div className="move-ownership-track" aria-label={`当前 ${source} 独占对象 7`}>
        {(['p', 'q'] as const).map((name) => (
          <div key={name} className={state.owner === name ? 'owner' : 'empty'}>
            <code>std::unique_ptr&lt;int&gt; {name}</code>
            <strong>{state.owner === name ? '对象 7' : 'nullptr'}</strong>
            <small>{state.owner === name ? '当前所有者' : '不拥有对象'}</small>
          </div>
        ))}
      </div>
      <div className="move-ownership-actions">
        <button type="button" onClick={() => setMessage(inspectMoveExpression(state).note)}>
          仅求值 <code>std::move({source})</code>
        </button>
        <button
          type="button"
          className="primary"
          onClick={() => {
            setState(transferUniqueOwner(state));
            setMessage(
              `${destination} 接收对象 7；${source} 现在为空。这是 unique_ptr 的具体保证。`,
            );
          }}
        >
          <ArrowLeftRight size={16} aria-hidden="true" />{' '}
          <code>
            {destination} = std::move({source})
          </code>
        </button>
      </div>
      <p className="experiment-status" role="status">
        {message}
      </p>
    </Experiment>
  );
}
