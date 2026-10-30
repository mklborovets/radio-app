import React, { createContext, PropsWithChildren, useContext } from 'react';
import { Database } from '@nozbe/watermelondb';
import { database } from '@shared/db';

const DatabaseContext = createContext<Database>(database);

export function DatabaseProvider({ children }: PropsWithChildren): React.JSX.Element {
  return (
    <DatabaseContext.Provider value={database}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): Database {
  return useContext(DatabaseContext);
}

