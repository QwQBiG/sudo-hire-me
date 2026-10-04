import type { CSSProperties } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';

export type TopicScene =
  | 'bits'
  | 'objects'
  | 'sort'
  | 'process'
  | 'network'
  | 'query'
  | 'lock'
  | 'git'
  | 'evidence';

export function TopicPreview({ scene }: { scene: TopicScene }) {
  return (
    <div className={`topic-preview scene-${scene}`} aria-hidden="true">
      {scene === 'bits' && (
        <>
          <div className="preview-byte">
            {[...'10100110'].map((bit, index) => (
              <i key={index} data-on={bit === '1'} style={{ '--index': index } as CSSProperties}>
                {bit}
              </i>
            ))}
          </div>
          <code>10100110 = 166</code>
        </>
      )}
      {scene === 'objects' && (
        <>
          <div className="preview-object">
            <span>Shape</span>
            <ArrowRight size={13} />
            <span>Circle</span>
          </div>
          <code>shape.draw()</code>
        </>
      )}
      {scene === 'sort' && (
        <div className="preview-bars">
          {[3, 1, 4, 2].map((value, index) => (
            <i
              key={value}
              style={
                {
                  '--position': index,
                  '--destination': value - 1,
                  height: 14 + value * 10,
                } as CSSProperties
              }
            >
              {value}
            </i>
          ))}
        </div>
      )}
      {scene === 'process' && (
        <div className="preview-processes">
          {['就绪', '运行', '等待'].map((state, index) => (
            <span key={state}>
              <i className={index === 1 ? 'running' : ''} />
              <small>{state}</small>
            </span>
          ))}
        </div>
      )}
      {scene === 'network' && (
        <div className="preview-network">
          <span>客户端</span>
          <div>
            <small>GET /</small>
            <i />
            <i />
          </div>
          <span>服务端</span>
        </div>
      )}
      {scene === 'query' && (
        <div className="preview-query">
          <code>
            <b>SELECT</b> id
          </code>
          <code>
            <b>FROM</b> users
          </code>
          <span>
            {[1, 2, 3].map((id) => (
              <i key={id}>{id}</i>
            ))}
          </span>
        </div>
      )}
      {scene === 'lock' && (
        <div className="preview-lock">
          <span>
            T1
            <i />
          </span>
          <LockKeyhole size={22} />
          <span>
            T2
            <i />
          </span>
        </div>
      )}
      {scene === 'git' && (
        <div className="preview-git">
          <code>main</code>
          <div>
            <i />
            <i />
            <i />
            <span>feature</span>
          </div>
        </div>
      )}
      {scene === 'evidence' && (
        <div className="preview-evidence">
          <span>场景</span>
          <ArrowRight size={13} />
          <span>决策</span>
          <ArrowRight size={13} />
          <span>证据</span>
        </div>
      )}
    </div>
  );
}
