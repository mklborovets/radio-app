import React, { PropsWithChildren } from 'react';

export function PlayerProvider({ children }: PropsWithChildren): React.JSX.Element {
  return <>{children}</>;
}
