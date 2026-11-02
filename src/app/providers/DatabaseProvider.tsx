import React, { PropsWithChildren } from 'react';
import { database } from '@shared/db';
import { DatabaseContext } from './model';

export function DatabaseProvider({ children }: PropsWithChildren): React.JSX.Element {
  return (
    <DatabaseContext.Provider value={database}>
      {children}
    </DatabaseContext.Provider>
  );
}
