import { useState } from "react";

export function SignalCounter() {
  const [signal, setSignal] = useState(3);

  return (
    <div className="mdx-component-demo" data-testid="mdx-counter">
      <button
        aria-label="Decrease signal"
        disabled={signal === 0}
        onClick={() => setSignal((value) => Math.max(0, value - 1))}
        type="button"
      >
        −
      </button>
      <output aria-live="polite">{signal}</output>
      <button
        aria-label="Increase signal"
        disabled={signal === 9}
        onClick={() => setSignal((value) => Math.min(9, value + 1))}
        type="button"
      >
        +
      </button>
      <span>这是从 MDX 中嵌入的 React 组件。</span>
    </div>
  );
}
