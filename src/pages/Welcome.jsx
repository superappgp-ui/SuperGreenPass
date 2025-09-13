// src/pages/Welcome.jsx
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mail, Lock, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';

// 🔥 Firebase
import { auth } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from 'firebase/auth';

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <title>Google</title>
    <path
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.48 1.68-4.34 1.68-3.66 0-6.6-3-6.6-6.6s2.94-6.6 6.6-6.6c1.93 0 3.33.72 4.14 1.48l2.5-2.5C18.17 2.09 15.65 1 12.48 1 7.02 1 3 5.02 3 10.5s4.02 9.5 9.48 9.5c2.82 0 5.2-1 6.9-2.73 1.76-1.79 2.5-4.35 2.5-6.81 0-.57-.05-.96-.12-1.32H12.48z"
      fill="currentColor"
    />
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.226 1.343a5.215 5.215 0 0 0-4.237 2.043c-.88.975-1.52 2.45-1.52 3.925 0 2.212.986 3.308 2.043 3.308.88 0 1.52-.787 2.547-1.425.93-.537 1.95-1.237 2.972-1.05 1.2.225 2.137.88 2.875 1.52.88.78 1.325 1.85 1.325 2.925 0 2.04-1.225 3.518-2.572 4.387-.985.63-2.069.96-2.971.96-1.028 0-2.16-.329-3.07-.96-.911-.63-.96-1.21-.96-1.21s.045-2.437.96-3.307c.82-.78 2.09-1.215 3.015-1.215a.4.4 0 0 1 .045.877c-.82.09-1.815.48-2.457 1.125-.687.675-.78 1.425-.78 1.425s-.044 1.282 1.072 2.122c.985.742 2.112.96 2.875.96.865 0 1.9-.322 2.78-.96.985-.735 1.86-2.085 1.86-3.832 0-1.52-.644-2.83-1.662-3.66-1.02-.832-2.348-1.26-3.518-1.05-.98.18-1.815.742-2.662 1.282-.9.538-1.614 1.17-2.456 1.17-.843 0-1.568-.832-1.568-2.547 0-1.9.82-3.615 1.755-4.575a4.35 4.35 0 0 1 3.562-1.95c1.178 0 2.21.442 2.972 1.125a.39.39 0 0 1-.044.644c-.135-.09-.315-.18-.54-.18-.812 0-1.65.538-2.412 1.335z" />
  </svg>
);

export default function Welcome() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // 🔒 auth state
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  // ✅ Listen to Firebase auth but DO NOT auto-redirect
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch {
        // ignore persistence errors
      }
      unsub = onAuthStateChanged(auth, (fbUser) => {
        setUser(fbUser || null);
        setChecking(false);
      });
    })();
    return () => unsub && unsub();
  }, []);

  const handleLoginGoogle = async () => {
    try {
      setBusy(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Navigate after successful, explicit sign-in
      navigate(createPageUrl('Dashboard'));
    } catch (err) {
      console.error('Google sign-in failed:', err);
      alert(err.message || 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  const handleLoginEmail = async () => {
    try {
      setBusy(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate(createPageUrl('Dashboard'));
    } catch (err) {
      console.error('Email sign-in failed:', err);
      alert(err.message || 'Email sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  const handleUnsupportedAuth = () => {
    alert("This sign-in method is not yet available. Please use 'Continue with Google' for now.");
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-4xl py-16 sm:py-24">
          <Card className="p-8 sm:p-12 shadow-2xl rounded-2xl bg-white/80 backdrop-blur-lg">
            <div className="text-center">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/52125f446_GP2withnameTransparent.png"
                alt="GreenPass Super App"
                className="h-12 sm:h-16 w-auto mx-auto mb-6"
              />
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                Your Journey to Canada Starts Here
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                {user
                  ? 'You are already signed in. Choose how you want to continue.'
                  : 'Sign in or create an account to unlock your personalized study abroad dashboard.'}
              </p>
            </div>

            {/* When NOT signed in: show form */}
            {!user && (
              <div className="mt-10 max-w-md mx-auto">
                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      className="pl-10 h-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Password"
                      className="pl-10 h-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button
                    size="lg"
                    className="w-full h-12 text-base"
                    onClick={handleLoginEmail}
                    disabled={busy}
                  >
                    Continue with Email
                  </Button>
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white/80 px-2 text-gray-500">OR</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-12 text-base"
                    onClick={handleLoginGoogle}
                    disabled={busy}
                  >
                    <GoogleIcon />
                    Continue with Google
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-12 text-base bg-black text-white hover:bg-gray-800 hover:text-white"
                    onClick={handleUnsupportedAuth}
                  >
                    <AppleIcon />
                    Continue with Apple
                  </Button>
                </div>
              </div>
            )}

            {/* When ALREADY signed in: offer choices; do NOT auto-redirect */}
            {user && (
              <div className="mt-10 max-w-md mx-auto">
                <div className="px-4 py-3 rounded-lg bg-green-50 text-green-800 flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-sm">
                    Signed in as <span className="font-medium">{user.email || 'your account'}</span>.
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    size="lg"
                    className="w-full h-12 text-base"
                    onClick={() => navigate(createPageUrl('Dashboard'))}
                  >
                    Continue to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-12 text-base"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-8 text-center text-sm text-gray-500">
              By continuing, you agree to our{' '}
              <Link
                to={createPageUrl('TermsOfService')}
                className="font-semibold text-green-600 hover:text-green-500"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                to={createPageUrl('PrivacyPolicy')}
                className="font-semibold text-green-600 hover:text-green-500"
              >
                Privacy Policy
              </Link>
              .
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
