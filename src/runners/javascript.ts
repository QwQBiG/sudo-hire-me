import bootstrap from './js-worker.js?raw';

export interface RunEvent {
  kind: 'log' | 'error' | 'done';
  text?: string;
}
export function runJavaScript(code: string, onEvent: (event: RunEvent) => void): () => void {
  const token = crypto.randomUUID();
  const nonce = crypto.randomUUID().replaceAll('-', '');
  const frame = document.createElement('iframe');
  frame.hidden = true;
  frame.setAttribute('sandbox', 'allow-scripts');
  frame.setAttribute('aria-hidden', 'true');
  let disposed = false;
  let timer: ReturnType<typeof setTimeout>;
  let cleanupTimer: ReturnType<typeof setTimeout>;
  let count = 0;
  const removeFrame = () => {
    clearTimeout(cleanupTimer);
    window.removeEventListener('message', receive);
    frame.remove();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    clearTimeout(timer);
    frame.contentWindow?.postMessage({ type: 'stop', token }, '*');
    cleanupTimer = setTimeout(removeFrame, 250);
  };
  const receive = (event: MessageEvent) => {
    if (event.source !== frame.contentWindow || !event.data || event.data.token !== token) return;
    if (event.data.type === 'stopped') {
      removeFrame();
      return;
    }
    if (disposed) return;
    if (event.data.type === 'ready') {
      frame.contentWindow?.postMessage({ type: 'run', token, code, bootstrap }, '*');
      return;
    }
    const result = event.data.result;
    if (!result || !['log', 'error', 'done'].includes(result.kind)) return;
    if (result.kind === 'done') {
      dispose();
      onEvent({ kind: 'done' });
    } else if (typeof result.text === 'string' && count++ < 152)
      onEvent({ kind: result.kind, text: result.text.slice(0, 2000) });
  };
  frame.srcdoc = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; worker-src blob:; connect-src 'none'; base-uri 'none'; form-action 'none'"><script nonce="${nonce}">
    const token = ${JSON.stringify(token)};
    let worker, url;
    const stop = () => { worker?.terminate(); worker = null; if (url) URL.revokeObjectURL(url); url = null; };
    addEventListener('message', event => {
      if (event.source !== parent || event.data?.token !== token) return;
      if (event.data.type === 'stop') { stop(); parent.postMessage({token,type:'stopped'}, '*'); return; }
      if (event.data.type !== 'run' || worker) return;
      const opening = '\\n(async function(){"use strict";\\n';
      const closing = '\\n})().catch(error => output("error",[error])).finally(()=>{finished=true;settle();});';
      url = URL.createObjectURL(new Blob([event.data.bootstrap, opening, event.data.code, closing], {type: 'text/javascript'}));
      worker = new Worker(url);
      worker.onmessage = e => { if (e.data?.kind === 'done') stop(); parent.postMessage({token, result: e.data}, '*'); };
      worker.onerror = e => { stop(); parent.postMessage({token,result:{kind:'error',text:e.message}}, '*'); parent.postMessage({token,result:{kind:'done'}}, '*'); };
    });
    parent.postMessage({token,type:'ready'}, '*');
  <\/script>`;
  window.addEventListener('message', receive);
  timer = setTimeout(() => {
    dispose();
    onEvent({ kind: 'error', text: '运行超过 2 秒，已终止。' });
    onEvent({ kind: 'done' });
  }, 2000);
  document.body.append(frame);
  return dispose;
}
