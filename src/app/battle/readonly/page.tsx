// page.tsx
import { Suspense } from 'react';
import ReadOnlyBattlePage from './ReadOnlyClientComponent';

export default function BattlePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ReadOnlyBattlePage />
    </Suspense>
  );
}
