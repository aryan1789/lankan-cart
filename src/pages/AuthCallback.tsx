import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

/** SPA Router + OAuth redirects can occasionally skip navigate(); force navigation off callback route if needed. */
function goHome(navigate: ReturnType<typeof useNavigate>) {
  navigate('/', { replace: true });
  queueMicrotask(() => {
    if (window.location.pathname.startsWith('/auth/callback')) {
      window.location.replace('/');
    }
  });
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    const watchdogId = window.setTimeout(() => {
      if (!window.location.pathname.startsWith('/auth/callback')) return;
      setMessage(
        'Still stuck? Open DevTools -> Network and inspect auth requests to Supabase (including /auth/v1/token). Confirm your app is on http://localhost:5173 and your Supabase Auth URL settings include this callback. Sending you to sign-in.'
      );
      window.location.replace('/login');
    }, 20000);

    const run = async () => {
      try {
        await supabase.auth.initialize().catch((err: unknown) => {
          console.error('supabase.auth.initialize()', err);
        });

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('getSession after OAuth redirect', error.message);
          setMessage(error.message || 'Something went wrong.');
          window.clearTimeout(watchdogId);
          setTimeout(() => navigate('/login', { replace: true }), 2800);
          return;
        }

        if (session) {
          window.clearTimeout(watchdogId);
          goHome(navigate);
          return;
        }

        window.clearTimeout(watchdogId);
        setMessage(
          'Session missing after redirect. Stay on http://localhost:5173 for the whole Google flow and verify your Supabase Auth URL settings, then try again.'
        );
        setTimeout(() => navigate('/login', { replace: true }), 3200);
      } catch (e) {
        console.error('Auth callback', e);
        window.clearTimeout(watchdogId);
        setMessage(e instanceof Error ? e.message : 'Sign-in failed.');
        setTimeout(() => navigate('/login', { replace: true }), 2800);
      }
    };

    run();

    return () => window.clearTimeout(watchdogId);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center px-4">
      <div className="w-8 h-8 border-2 border-[#00B140]/30 border-t-[#00B140] rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-600 text-center max-w-sm">{message}</p>
    </div>
  );
}
