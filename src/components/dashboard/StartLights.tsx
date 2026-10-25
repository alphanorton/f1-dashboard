import React from 'react';

/** Five start lights that come on one by one, then go out. Purely decorative (CSS animation). */
export function StartLights() {
  return (
    <span aria-hidden="true" className="dx-lights">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="dx-light" style={{ '--i': i } as React.CSSProperties} />
      ))}
    </span>
  );
}
