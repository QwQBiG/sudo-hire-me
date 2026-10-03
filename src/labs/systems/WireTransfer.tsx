import { ArrowLeft, ArrowRight, Ban, Send } from 'lucide-react';

interface Props {
  sequence: number;
  label: string;
  direction?: 'left' | 'right';
  lost?: boolean;
  local?: boolean;
  from?: string;
  to?: string;
}

export function WireTransfer({
  sequence,
  label,
  direction = 'right',
  lost = false,
  local = false,
  from = '客户端',
  to = '服务端',
}: Props) {
  const Icon = lost ? Ban : local ? Send : direction === 'left' ? ArrowLeft : ArrowRight;
  return (
    <div className="wire-transfer" data-direction={direction} data-lost={lost} data-local={local}>
      <div className="wire-route" aria-hidden="true">
        <span>{from}</span>
        <div className="wire-channel">
          {sequence > 0 && (
            <i className="wire-packet" key={sequence}>
              <Icon size={15} />
            </i>
          )}
          <b />
        </div>
        <span>{to}</span>
      </div>
      <output>{sequence > 0 ? label : '尚未发生传递'}</output>
    </div>
  );
}
