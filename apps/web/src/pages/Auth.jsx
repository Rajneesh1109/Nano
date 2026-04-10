
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { RetroCard, RetroButton } from '../components/RetroUI';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard` // Return to dashboard, not landing
                }
            });
            if (error) throw error;
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-retro-bg">
            <h1 className="text-4xl font-black bg-retro-secondary text-white p-4 border-2 border-retro-border shadow-retro mb-8 -rotate-2">
                NONO
            </h1>

            <RetroCard className="max-w-md w-full flex flex-col gap-4 text-center">
                <h2 className="text-2xl font-bold border-b-2 border-retro-border pb-2">Welcome</h2>
                <p className="font-bold text-gray-600 mb-4">
                    Sign in to access your personal dashboard and sync your activity logs.
                </p>

                {error && (
                    <div className="bg-red-100 border-2 border-black p-2 font-bold text-red-600 mb-2">
                        {error}
                    </div>
                )}

                <RetroButton
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 !bg-white hover:!bg-gray-50"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
                    {loading ? 'Connecting...' : 'Continue with Google'}
                </RetroButton>

                <div className="text-xs font-bold text-gray-400 mt-4 border-t-2 border-gray-200 pt-2">
                    SECURED BY SUPABASE
                </div>
            </RetroCard>

            <button
                onClick={() => window.location.href = '/'}
                className="mt-8 font-black text-gray-400 hover:text-black transition-colors"
            >
                ← BACK TO CIVILIZATION
            </button>
        </div>
    );
}
