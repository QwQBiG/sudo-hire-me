import { SelectField } from '../../components/SelectField';
import { useState } from 'react';
import { Experiment } from '../../components/Experiment';
import { calculateSubnet } from '../../domain/subnet.mjs';
import './subnet.css';
import './systems-quality.css';

export default function Subnet() {
  const [address, setAddress] = useState('192.168.10.37');
  const [prefix, setPrefix] = useState(26);
  let result: ReturnType<typeof calculateSubnet> | null = null;
  let error = '';
  try {
    result = calculateSubnet(address.trim(), prefix);
  } catch (reason) {
    error = (reason as Error).message;
  }
  const hostBits = 32 - prefix;
  const rows = result
    ? [
        ['地址末字节', result.ipBits],
        ['掩码末字节', result.maskBits],
        ['按位与结果', result.networkBits],
      ]
    : [];
  return (
    <Experiment
      title="把一个地址放进它的网段"
      subtitle="IPv4 教学范围 /24 至 /30；按位与得网络地址，主机位全 1 得广播地址。"
      onReset={() => {
        setAddress('192.168.10.37');
        setPrefix(26);
      }}
    >
      <div className="experiment-controls subnet-controls">
        <label>
          IPv4 地址
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            inputMode="decimal"
            spellCheck={false}
            aria-invalid={!!error}
          />
        </label>
        <label>
          前缀长度
          <SelectField value={prefix} onChange={(event) => setPrefix(Number(event.target.value))}>
            {[24, 25, 26, 27, 28, 29, 30].map((value) => (
              <option value={value} key={value}>
                /{value}
              </option>
            ))}
          </SelectField>
        </label>
      </div>
      {error ? (
        <p className="experiment-status subnet-error" role="alert">
          {error}
        </p>
      ) : (
        result && (
          <>
            <div className="subnet-bits" aria-label="末字节逐位计算">
              {rows.map(([label, bits]) => (
                <div className="subnet-bit-row" key={label}>
                  <span>{label}</span>
                  <div>
                    {[...bits].map((bit, index) =>
                      label === '地址末字节' ? (
                        <button
                          key={index}
                          aria-label={`翻转地址末字节的第 ${index + 1} 位，当前为 ${bit}`}
                          onClick={() => {
                            const octets = address.trim().split('.');
                            octets[3] = String(Number(octets[3]) ^ (1 << (7 - index)));
                            setAddress(octets.join('.'));
                          }}
                        >
                          <strong data-role={index >= 8 - hostBits ? 'host' : 'network'}>
                            {bit}
                          </strong>
                        </button>
                      ) : (
                        <strong key={index} data-role={index >= 8 - hostBits ? 'host' : 'network'}>
                          {bit}
                        </strong>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="subnet-legend">
              <span>深色位：网络位</span>
              <span>浅色位：主机位</span>
            </div>
            <div className="subnet-result">
              <div>
                <small>子网掩码</small>
                <strong>{result.mask}</strong>
              </div>
              <div>
                <small>网络地址</small>
                <strong>{result.network}</strong>
              </div>
              <div>
                <small>广播地址</small>
                <strong>{result.broadcast}</strong>
              </div>
              <div>
                <small>传统可用主机范围</small>
                <strong>
                  {result.firstHost} ~ {result.lastHost}
                </strong>
              </div>
            </div>
            <p className="experiment-status" role="status">
              /{prefix} 留下 {hostBits} 个主机位，共 {2 ** hostBits}{' '}
              个地址；按传统子网分配排除网络地址和广播地址后，可用 {result.usableHosts}{' '}
              个。这里只计算地址范围，不判断真实路由和接口配置。
            </p>
          </>
        )
      )}
    </Experiment>
  );
}
