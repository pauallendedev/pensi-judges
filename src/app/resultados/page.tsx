// page.tsx
import { Suspense } from 'react';
import ResultClientComponent from './ResultClientComponent';

export default function BattlePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ResultClientComponent />
    </Suspense>
  );
}
