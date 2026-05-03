import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Loader2, Mail, Lock, Chrome, Sparkles, User as UserIcon } from 'lucide-react';

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update Auth Profile
        await updateProfile(user, { displayName: fullName });

        // Store in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          fullName,
          email,
          createdAt: Date.now(),
          styleVibe: 'Classic', // Default
          onboardingComplete: false
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Store/Update in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: user.displayName || 'Anonymous',
        email: user.email,
        photoURL: user.photoURL,
        lastLogin: Date.now()
      }, { merge: true });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl border border-purple-50">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-16 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg mb-4">
            <Sparkles className="size-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Auraku AI</h1>
          <p className="text-gray-500 text-sm">Elevate your sustainable style journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {!isLogin && (
              <div className="relative group animate-in fade-in slide-in-from-top-2 duration-300">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-200 text-sm transition-all"
                  required={!isLogin}
                />
              </div>
            )}
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-200 text-sm transition-all"
                required
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-200 text-sm transition-all"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-medium text-center bg-red-50 py-2 rounded-xl">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-200 hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="size-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-gray-400 font-bold tracking-widest">or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-white border border-gray-100 text-gray-700 py-4 rounded-2xl font-bold shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <Chrome className="size-5 text-purple-600" />
          <span>Google Account</span>
        </button>

        <p className="text-center text-sm text-gray-500">
          {isLogin ? "New to Auraku?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-purple-600 font-bold hover:underline"
          >
            {isLogin ? 'Create Account' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};
