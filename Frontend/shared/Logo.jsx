import { useState } from 'react';

// Upande brand mark. Renders the logo image if present, otherwise a "UP"
// monogram fallback. Drop the real file at upande_customer_feedback/public/logo.png
// (served at /assets/upande_customer_feedback/logo.png) and it appears everywhere.
//   import Logo from '@shared/Logo';
//   <div className="brand-mark"><Logo /></div>
const SRC = '/assets/upande_customer_feedback/logo.png';

export default function Logo({ fallback = 'UP', alt = 'Upande' }) {
  const [ok, setOk] = useState(true);
  if (ok) {
    return (
      <img
        src={SRC}
        alt={alt}
        onError={() => setOk(false)}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    );
  }
  return <>{fallback}</>;
}
