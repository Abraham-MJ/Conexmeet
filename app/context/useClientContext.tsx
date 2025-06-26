'use client';

import {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
} from 'react';
import useLogin from '../hooks/api/useLogin';

interface State {
  user: any | null;
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'FETCH_USER_START' }
  | { type: 'FETCH_USER_SUCCESS'; payload: any }
  | { type: 'FETCH_USER_FAILURE'; payload: string }
  | { type: 'LOGIN_SUCCESS'; payload: any }
  | { type: 'LOGOUT' };

const initialState: State = {
  user: null,
  loading: true,
  error: null,
};

const UserContextInternal = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => undefined,
});

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_USER_START':
      return {
        ...state,
        loading: true,
        user: null,
        error: null,
      };
    case 'FETCH_USER_SUCCESS':
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      };
    case 'FETCH_USER_FAILURE':
      return {
        ...state,
        user: null,
        loading: false,
        error: action.payload,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        loading: false,
      };
    default:
      return state;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { logout } = useLogin();

  useEffect(() => {
    const checkAuth = async () => {
      dispatch({ type: 'FETCH_USER_START' });

      try {
        const res = await fetch('/api/auth/user-data');

        if (res.ok) {
          const responseData = await res.json();

          if (responseData && responseData.data && responseData.data.user) {
            dispatch({
              type: 'FETCH_USER_SUCCESS',
              payload: {
                ...responseData.data.user,
                token: responseData.data.access_token,
              },
            });
          } else {
            dispatch({
              type: 'FETCH_USER_FAILURE',
              payload:
                'Formato de datos de usuario inválido recibido del servidor.',
            });
          }
        } else {
          if (res.statusText === 'Unauthorized') {
            dispatch({ type: 'LOGOUT' });
            logout();
            return;
          }

          let errorMessage = `Error ${res.status}: ${res.statusText}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (e) {}
          console.error(
            'Error al cargar el usuario (respuesta no OK):',
            errorMessage,
          );
          dispatch({ type: 'FETCH_USER_FAILURE', payload: errorMessage });
        }
      } catch (error: any) {
        console.error(
          'Excepción durante checkAuth (ej. problema de red):',
          error,
        );
        dispatch({
          type: 'FETCH_USER_FAILURE',
          payload:
            error.message ||
            'No se pudo conectar al servidor para verificar la autenticación.',
        });
      }
    };

    checkAuth();
  }, []);

  return (
    <UserContextInternal.Provider value={{ state, dispatch }}>
      {children}
    </UserContextInternal.Provider>
  );
}

export const useUser = () => useContext(UserContextInternal);
