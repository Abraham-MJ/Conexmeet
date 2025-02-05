'use client'

import useLogin from '@/app/hooks/api/useLogin';
import { useEffect } from 'react';

export default function DashBoardScreen() {
  const { logout } = useLogin();

  // useEffect(() => {
  //   logout();
  // }, []);

  return <div>ESTO ES UN DASHBOARD</div>;
}
