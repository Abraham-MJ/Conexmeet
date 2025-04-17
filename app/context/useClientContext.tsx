'use client';

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from 'react';

interface State {
  user: any | null;
  loading: boolean;
}

type Action =
  | { type: 'LOGIN'; payload: any }
  | { type: 'LOAD_USER'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: State = {
  user: null,
  loading: true,
};

const useClientContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => undefined,
});

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload,
        loading: false,
      };

    case 'LOAD_USER':
      return {
        ...state,
        user: action.payload,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const checkAuth = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        const res = await fetch('/api/auth/user-data');

        if (res.ok) {
          const user = await res.json();
          dispatch({ type: 'LOAD_USER', payload: user.data.user });
        }
      } catch (error) {
        console.error('Error validating token:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  return (
    <useClientContext.Provider value={{ state, dispatch }}>
      {children}
    </useClientContext.Provider>
  );
}

export const useUser = () => useContext(useClientContext);
