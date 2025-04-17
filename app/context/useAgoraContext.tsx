'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';

interface State {
  rtcUid: string;
  rtmUid: string;
  appID: string;
  tokenRtm: string | null;
  tokenRtc: string | null;
}

interface Action {
  type: '';
  payload: any;
}

const initialState: State = {
  rtcUid: String(Math.floor(Math.random() * 2032)),
  rtmUid: String(Math.floor(Math.random() * 2032)),
  appID: '927bd867d03e4aa49edd4a4141fe8121',
  tokenRtm: null,
  tokenRtc: null,
};

const AgoraContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => undefined,
});

function reducer(state: State, action: Action): State {
  switch (action.type) {
    default:
      return state;
  }
}

export function AgoraProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AgoraContext.Provider value={{ state, dispatch }}>
      {children}
    </AgoraContext.Provider>
  );
}

export const useAgoraContext = () => {
  const context = useContext(AgoraContext);
  if (!context) {
    throw new Error('useVideoChat debe usarse dentro de VideoChatProvider');
  }
  return context;
};
