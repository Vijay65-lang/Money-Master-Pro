
import React, { useState } from 'react';
import { Lock, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { sbUpdateUserPassword } from '../services/supabaseService';

export const ResetPasswordPage = ({ onCancel }: { onCancel: () => void }) => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        const { error } = await sbUpdateUserPassword(newPassword);
        setLoading(false);
        
        if (error) {
            setError(error);
        } else {
            setSuccess(true);
            setTimeout(() => {
                // Clear hash and reload to return to login screen fresh
                window.location.hash = "";
                window.location.reload();
            }, 2000);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
             {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl animate-slide-up relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-5 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                        <Lock size={32} className="text-white" />
                    </div>
                </div>
                
                <h2 className="text-3xl font-black text-center mb-2 text-white tracking-tight">
                    {success ? "Success!" : "Reset Password"}
                </h2>
                <p className="text-center text-indigo-200 mb-8 font-medium text-sm">
                    {success ? "Your password has been updated. Redirecting..." : "Enter your new password below."}
                </p>
                
                {success ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <CheckCircle2 size={64} className="text-emerald-500 animate-bounce mb-4" />
                        <p className="text-emerald-200 font-bold">You can now log in.</p>
                    </div>
                ) : (
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">New Password</label>
                            <input 
                                type="password" 
                                className="w-full bg-black/30 border border-white/10 focus:border-indigo-500 rounded-xl p-4 font-bold outline-none text-white placeholder-gray-500 transition-all focus:ring-1 focus:ring-indigo-500" 
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)} 
                                required 
                                placeholder="••••••••" 
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 ml-1 uppercase tracking-wider">Confirm Password</label>
                            <input 
                                type="password" 
                                className="w-full bg-black/30 border border-white/10 focus:border-indigo-500 rounded-xl p-4 font-bold outline-none text-white placeholder-gray-500 transition-all focus:ring-1 focus:ring-indigo-500" 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)} 
                                required 
                                placeholder="••••••••" 
                                minLength={6}
                            />
                        </div>

                        <button disabled={loading} type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] mt-6 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? <Loader2 className="animate-spin" /> : "UPDATE PASSWORD"}
                        </button>
                        
                        <button type="button" onClick={onCancel} className="w-full flex items-center justify-center gap-2 text-gray-400 font-bold py-3 text-sm hover:text-white transition-colors">
                            <ArrowLeft size={16} /> Back to Login
                        </button>
                    </form>
                )}
                
                {error && (
                    <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 text-red-200 font-bold rounded-xl text-sm flex items-center gap-3 animate-fade-in">
                        <AlertCircle size={20} className="shrink-0"/> {error}
                    </div>
                )}
            </div>
        </div>
    );
};
