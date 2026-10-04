import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { MAX_PROGRESS_FILE_BYTES } from '../domain/progress.mjs';
import type { Progress } from '../types';

export function MemoryTools({
  progress,
  importProgress,
}: {
  progress: Progress;
  importProgress: (raw: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');
  return (
    <div className="memory-tools">
      <button
        className="icon-button"
        title="导出学习记录"
        aria-label="导出学习记录"
        onClick={() => {
          const url = URL.createObjectURL(
            new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' }),
          );
          const link = document.createElement('a');
          link.href = url;
          link.download = 'sudo-hire-me-progress.json';
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }}
      >
        <Download size={18} />
      </button>
      <button
        className="icon-button"
        title="导入学习记录"
        aria-label="导入学习记录"
        onClick={() => input.current?.click()}
      >
        <Upload size={18} />
      </button>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (!file) return;
          try {
            if (file.size > MAX_PROGRESS_FILE_BYTES) throw new Error('进度文件过大。');
            importProgress(await file.text());
            setNotice('记录已导入');
          } catch (error) {
            setNotice(error instanceof Error ? error.message : '记录未能导入');
          }
        }}
      />
      {notice && <span role="status">{notice}</span>}
    </div>
  );
}
