// page.tsx
import { Suspense } from 'react';
import BattleClientComponent from './BattleClientComponent';

export default function BattlePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <BattleClientComponent />
    </Suspense>
  );
}
