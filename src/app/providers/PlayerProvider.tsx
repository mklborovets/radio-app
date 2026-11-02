import React, { PropsWithChildren } from 'react';
import { usePlayerLifecycle } from './model';

export function PlayerProvider({ children }: PropsWithChildren): React.JSX.Element {
  usePlayerLifecycle();

  return <>{children}</>;
}
