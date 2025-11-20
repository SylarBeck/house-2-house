import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Trash2, Save, ChevronLeft, FileText, Search,
  MapPin, User, Hash, MoreVertical, X, Share2,
  Download, Copy, Lock, Check,
  Filter, AlertTriangle, KeyRound, Sparkles, LogOut, Eye, EyeOff, Mail
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { marked } from 'marked';

// PWA Components and Hooks
import { useToast } from './hooks/useToast';
import { useInstallPrompt, usePWAUpdate } from './hooks/usePWA';
import { useHaptic } from './hooks/useHaptic';
import Toast from './components/Toast';
import InstallPrompt from './components/InstallPrompt';
import UpdateNotification from './components/UpdateNotification';
import OfflineIndicator from './components/OfflineIndicator';
import PullToRefresh from './components/PullToRefresh';
import LoadingSkeleton from './components/LoadingSkeleton';


// --- Interfaces ---
interface Row {
  id: string;
  houseNo: string;
  date: string;
  symbol: string;
  remarks: string;
}

interface Sheet {
  id: string;
  street: string;
  terrNo: string;
  publisherName: string;
  rows: Row[];
  createdAt?: { seconds: number } | string;
  updatedAt?: { seconds: number } | string;
  ownerId?: string;
}

interface SheetStats {
  NH: number;
  CA: number;
  B: number;
  Total: number;
  [key: string]: number;
}

// --- Firebase Configuration ---

const firebaseConfig = {
  apiKey: "AIzaSyCZMOMaOOQLUyC8azK-SvTNXY9W9I0TWD0",
  authDomain: "house-2-house-42e42.firebaseapp.com",
  projectId: "house-2-house-42e42",
  storageBucket: "house-2-house-42e42.firebasestorage.app",
  messagingSenderId: "24079284078",
  appId: "1:24079284078:web:d233134cd759cbbb3b737f",
  measurementId: "G-9ENMPS1VKB"
};

// --- Auth Modal ---
const AuthModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean; onClose: () => void; onLogin: (e: string, p: string, l: boolean) => Promise<any> }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await onLogin(email, password, isLogin);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">{isLogin ? 'Sign In' : 'Create Account'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <Mail size={16} className="inline mr-2" />Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <Lock size={16} className="inline mr-2" />Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Lock size={16} className="inline mr-2" />Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Profile Modal ---
const ProfileModal = ({ isOpen, onClose, userId, userEmail, onLogout, displayName, setDisplayName, geminiApiKey, setGeminiApiKey, cityState, setCityState }: { isOpen: boolean; onClose: () => void; userId: string | null; userEmail: string | null; onLogout: () => void; displayName: string; setDisplayName: (s: string) => void; geminiApiKey: string; setGeminiApiKey: (s: string) => void; cityState: string; setCityState: (s: string) => void }) => {
  const [showApiKey, setShowApiKey] = useState(false);
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">User Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* User Info */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
              <User size={32} />
            </div>

            {/* Name Input */}
            <div className="w-full">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 text-left">Your Name</label>
              <input
                type="text"
                autoFocus
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-2 border border-gray-300 rounded-lg text-center font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[10px] text-green-600 mt-1 h-4">{displayName ? '✓ Saved' : ''}</p>
            </div>

            <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded text-xs break-all w-full">
              ID: {userId}
            </p>
          </div>

          {/* City/State Input */}
          <div className="w-full">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Default City/State</label>
            <input
              type="text"
              value={cityState}
              onChange={(e) => setCityState(e.target.value)}
              placeholder="e.g. New York, NY"
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">Used for accurate map previews</p>
          </div>

          {/* Email Display */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm w-full">
            <p className="font-bold text-gray-700 mb-1 flex items-center gap-2">
              <Mail size={14} /> Email
            </p>
            <p className="text-gray-600 break-all">{userEmail}</p>
          </div>

          {/* API Key Configuration */}
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm w-full">
            <p className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
              <KeyRound size={14} /> Gemini API Key
            </p>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full p-2 pr-10 border border-yellow-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-yellow-600 hover:text-yellow-800"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              {geminiApiKey ? '✓ API key set' : 'Required for AI report generation'}
            </p>
          </div>

          {/* Storage Status */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm w-full">
            <p className="font-bold text-blue-800 mb-1">Storage Status:</p>
            <p className="text-blue-700">💾 Local Storage Only (Device)</p>
            <p className="text-xs text-blue-600 mt-1">Data is saved on this device.</p>
          </div>

          {/* Actions */}
          <div className="pt-2 w-full">
            <button
              onClick={onLogout}
              className="w-full py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Keep getFirestore for now, though not used for data storage
const appId = 'house-2-house-pwa'; // Keep appId for consistency, though not used for data storage

// --- Gemini API Configuration ---
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=`;


// --- Theme Colors ---
const PRIMARY_RED = '#d14336';
const DARK_TEXT = '#2d231e';
const LIGHT_BG = '#f5f2eb';
const MEDIUM_GRAY = '#6b7280';
const LIGHT_GRAY = '#e5e7eb';
const WHITE = '#ffffff';

// --- Constants & Data ---
const SYMBOLS = [
  { code: '', label: '-', desc: 'None' },
  { code: 'NH', label: 'NH', desc: 'Not Home', color: `text-red-600 bg-red-50 border-red-200` },
  { code: 'CA', label: 'CA', desc: 'Call Again', color: `text-blue-600 bg-blue-50 border-blue-200` },
  { code: 'B', label: 'B', desc: 'Busy', color: `text-red-600 bg-red-50 border-red-200` },
  { code: 'C', label: 'C', desc: 'Child', color: `text-purple-600 bg-purple-50 border-purple-200` },
  { code: 'M', label: 'M', desc: 'Man', color: `text-gray-700 bg-gray-50 border-gray-200` },
  { code: 'W', label: 'W', desc: 'Woman', color: `text-gray-700 bg-gray-50 border-gray-200` },
];

// --- Helper Functions ---
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const generateCSV = (data: Sheet) => {
  const headers = ['Street', 'Territory No', 'Publisher', 'House No', 'Date', 'Symbol', 'Remarks'];
  const rows = (data.rows || []).map(row => [
    `"${data.street || ''}"`,
    `"${data.terrNo || ''}"`,
    `"${data.publisherName || ''}"`,
    `"${row.houseNo || ''}"`,
    `"${row.date || ''}"`,
    `"${row.symbol || ''}"`,
    `"${row.remarks || ''}"`
  ]);
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.street || 'Record'}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const copyRichText = (data: Sheet) => {
  let text = `HOUSE-TO-HOUSE RECORD\n`;
  text += `Street: ${data.street || 'N/A'} | Terr: ${data.terrNo || 'N/A'} | Pub: ${data.publisherName || 'N/A'}\n`;
  text += `----------------------------------------\n`;
  (data.rows || []).forEach(row => {
    const sym = row.symbol ? `[${row.symbol}]` : '';
    text += `${row.houseNo || '?'} \t| ${row.date} \t| ${sym} ${row.remarks || ''}\n`;
  });
  navigator.clipboard.writeText(text);
};

const getSheetStats = (rows: Row[] = []): SheetStats => {
  const stats: SheetStats = { NH: 0, CA: 0, B: 0, Total: rows.length };
  rows.forEach(r => {
    if (['NH', 'CA', 'B'].includes(r.symbol)) {
      stats[r.symbol]++;
    }
  });
  return stats;
};



// --- LLM Feature: Report Generator ---
const ReportGeneratorModal = ({ isOpen, onClose, sheetData, stats, apiKey }: { isOpen: boolean; onClose: () => void; sheetData: Sheet; stats: SheetStats; apiKey: string }) => {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Function to call the Gemini API
  const generateReport = async (data: Sheet, stats: SheetStats) => {
    setIsLoading(true);
    setError(null);
    setReport(null);

    // 1. Prepare Prompt
    const allRemarks = data.rows.map(r => r.remarks).filter(r => r).join('; ');

    const systemPrompt = `You are a professional territory analyst and report writer. Your task is to analyze house-to-house records and generate a concise, encouraging report based ONLY on the data provided below. The report must be formatted in clean Markdown.

      The report MUST include:
      1. A bold summary of the territory's identity (Street and Territory Number).
      2. Key statistics (Total entries, Not Home (NH) count, Call Again (CA) count).
      3. A thematic summary of the remarks (identify 2-3 common themes, interests, or demographics noted in the remarks).
      4. A suggested next step or encouraging closing statement for the publisher.`;

    const userQuery = `Analyze the following territory record data:
      Street: ${data.street || 'N/A'}
      Territory No: ${data.terrNo || 'N/A'}
      Total Entries: ${stats.Total}
      Not Home (NH) Count: ${stats.NH}
      Call Again (CA) Count: ${stats.CA}
      All Remarks: "${allRemarks || 'No detailed remarks were provided.'}"`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    // 2. API Call with Exponential Backoff
    let finalResult = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const headers = { 'Content-Type': 'application/json' };
        const url = GEMINI_API_URL + apiKey;

        const response = await fetch(url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          if (response.status === 429 && attempts < maxAttempts) {
            const delay = Math.pow(2, attempts) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Retry
          }
          throw new Error(`API returned status ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          finalResult = text;
          break; // Success
        } else {
          throw new Error("API response was empty or malformed.");
        }
      } catch (err: unknown) {
        if (attempts === maxAttempts) {
          console.error("Gemini API error:", err);
          setError("Failed to generate report after several attempts. Please try again.");
        }
        // Wait for backoff time before next attempt
        if (attempts < maxAttempts) {
          const delay = Math.pow(2, attempts) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    setIsLoading(false);
    if (finalResult) setReport(finalResult);
  };

  // Effect to trigger report generation when modal opens
  useEffect(() => {
    if (isOpen) {
      generateReport(sheetData, stats);
      setIsCopied(false);
    }
  }, [isOpen, sheetData, stats, apiKey]); // Added apiKey to dependencies

  if (!isOpen) return null;

  const handleCopy = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 transform transition-all scale-100 min-h-[500px] flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b pb-3" style={{ borderColor: LIGHT_GRAY }}>
          <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: PRIMARY_RED }}>
            <Sparkles size={24} /> Territory Summary Report
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center flex-grow p-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 mb-4" style={{ borderColor: PRIMARY_RED }}></div>
            <p className="text-lg font-medium" style={{ color: DARK_TEXT }}>Analyzing {sheetData.street || 'the territory'}...</p>
            <p className="text-sm text-gray-500 mt-1">Generating insights from {stats.Total} entries.</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center flex-grow p-10 text-center">
            <AlertTriangle size={36} className="text-red-500 mb-4" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {report && (
          <div className="flex-grow overflow-y-auto pr-2">
            <div className="markdown-content prose max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(report) }} />
          </div>
        )}

        <div className="mt-6 flex gap-3 justify-end border-t pt-4" style={{ borderColor: LIGHT_GRAY }}>
          <button
            onClick={handleCopy}
            disabled={!report}
            className={`px-4 py-2 font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors ${report ? 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
            {isCopied ? 'Copied!' : 'Copy Report'}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-white font-medium rounded-lg hover:bg-red-700" style={{ backgroundColor: PRIMARY_RED }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- General Components (Spinner, ConfirmModal, ShareModal, EnterCodeModal, SheetList) ---

const Spinner = () => (
  <div className="flex justify-center items-center p-8" style={{ backgroundColor: LIGHT_BG }}>
    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: PRIMARY_RED }}></div>
  </div>
);

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isDangerous }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; isDangerous?: boolean }) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${isDangerous ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold" style={{ color: DARK_TEXT }}>{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancel</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2 text-white font-medium rounded-lg shadow-md ${isDangerous ? 'bg-red-600 hover:bg-red-700' : ''}`}
            style={!isDangerous ? { backgroundColor: PRIMARY_RED, '--hover-bg-color': '#c03a2f' } as React.CSSProperties : {}}
            onMouseOver={e => !isDangerous && (e.currentTarget.style.backgroundColor = e.currentTarget.style.getPropertyValue('--hover-bg-color'))}
            onMouseOut={e => !isDangerous && (e.currentTarget.style.backgroundColor = PRIMARY_RED)}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ShareModal = ({ isOpen, onClose, shareUrl, shareId, showToast, vibrate }: { isOpen: boolean; onClose: () => void; shareUrl: string; shareId: string; showToast?: (message: string, type: 'success' | 'error' | 'info') => void; vibrate?: (type: 'light' | 'medium' | 'heavy') => void }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (vibrate) vibrate('light');
    if (showToast) showToast('Copied to clipboard!', 'success');
  };

  // Native share functionality for iOS and Android
  const handleNativeShare = async () => {
    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'House-to-House Record',
          text: `View this territory record. Share code: ${shareId}`,
          url: shareUrl,
        });
        if (vibrate) vibrate('medium');
        if (showToast) showToast('Shared successfully!', 'success');
      } catch (err: unknown) {
        // User cancelled or share failed
        const error = err as Error; // Cast for checking name, or use safe check
        if (error?.name !== 'AbortError') {
          console.error('Share failed:', err);
          const msg = error?.message || 'Unknown error';
          if (showToast) showToast('Share failed: ' + msg, 'error');
          // Fallback to copy
          handleCopy(shareUrl);
        }
      }
    } else {
      // Fallback to copy if Web Share API not supported
      handleCopy(shareUrl);
      if (showToast) showToast('Link copied! (Share not supported on this device)', 'info');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: DARK_TEXT }}>
            <Share2 size={20} style={{ color: PRIMARY_RED }} /> Share Record
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="bg-red-50 p-3 rounded-lg text-sm text-red-800 mb-4" style={{ borderColor: PRIMARY_RED }}>
          Anyone with this code or link can view a "Read-Only" snapshot of this record.
        </div>

        {/* Native Share Button */}
        <button
          onClick={handleNativeShare}
          className="w-full mb-4 p-3 rounded-lg font-medium text-white flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
          style={{ backgroundColor: PRIMARY_RED }}
        >
          <Share2 size={18} />
          Share Link
        </button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or copy manually</span>
          </div>
        </div>

        <label className="text-xs font-bold uppercase mb-1 block" style={{ color: MEDIUM_GRAY }}>Share Link</label>
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 mb-4">
          <input readOnly value={shareUrl} className="bg-transparent w-full text-sm text-gray-600 focus:outline-none font-mono truncate" />
          <button onClick={() => handleCopy(shareUrl)} className={`p-2 rounded-md transition-colors ${copied ? 'bg-green-100 text-green-700' : 'hover:bg-gray-200 text-gray-500'}`}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <label className="text-xs font-bold uppercase mb-1 block" style={{ color: MEDIUM_GRAY }}>Share Code (Alternative)</label>
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 mb-4">
          <span className="font-mono font-bold text-lg text-gray-800 tracking-wider w-full text-center select-all">{shareId}</span>
          <button onClick={() => handleCopy(shareId)} className="p-2 text-gray-500 hover:bg-gray-200 rounded-md">
            <Copy size={16} />
          </button>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-white rounded-lg hover:bg-red-700 font-medium" style={{ backgroundColor: PRIMARY_RED }}>Done</button>
        </div>
      </div>
    </div>

  );
};

const EnterCodeModal = ({ isOpen, onClose, onSubmit }: { isOpen: boolean; onClose: () => void; onSubmit: (code: string) => void }) => {
  const [input, setInput] = useState('');
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Extract ID if full URL is pasted
    let idToUse = input.trim();
    if (idToUse.includes('shareId=')) {
      idToUse = idToUse.split('shareId=')[1].split('&')[0];
    }
    if (idToUse) onSubmit(idToUse);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold" style={{ color: DARK_TEXT }}>Open Shared Record</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <p className="text-sm text-gray-600 mb-3">Enter the <strong>Share Code</strong> or paste the full Link provided to you.</p>
          <input
            autoFocus
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:outline-none font-mono text-center"
            style={{ '--tw-focus-ring-color': PRIMARY_RED } as React.CSSProperties}
            placeholder="e.g. 3vfihh..."
          />
          <button type="submit" className="w-full py-2 text-white rounded-lg hover:bg-red-700 font-medium" style={{ backgroundColor: PRIMARY_RED }}>Open Record</button>
        </form>
      </div>
    </div>
  );
};

const SheetList = ({ sheets, onSelect, onCreate, onDelete, onOpenShared, userId, userEmail, onLogout, displayName, setDisplayName, geminiApiKey, setGeminiApiKey, cityState, setCityState, isLoading }: { sheets: Sheet[]; onSelect: (s: Sheet) => void; onCreate: () => void; onDelete: (id: string) => void; onOpenShared: () => void; userId: string | null; userEmail: string | null; onLogout: () => void; displayName: string; setDisplayName: (s: string) => void; geminiApiKey: string; setGeminiApiKey: (s: string) => void; cityState: string; setCityState: (s: string) => void; isLoading: boolean }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const filteredSheets = sheets.filter(sheet =>
    (sheet.street || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sheet.terrNo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) onDelete(deleteId); setDeleteId(null); }}
        title="Delete Record Sheet?"
        message="This action cannot be undone. Are you sure you want to permanently delete this territory record?"
        isDangerous={true}
      />

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        userId={userId}
        userEmail={userEmail}
        onLogout={onLogout}
        displayName={displayName}
        setDisplayName={setDisplayName}
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        cityState={cityState}
        setCityState={setCityState}
      />

      {/* Top Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold" style={{ color: DARK_TEXT }}>Territory Records</h1>
            <p className="text-sm mt-1" style={{ color: MEDIUM_GRAY }}>House-to-House Record Keeper</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto items-center">
            <button
              onClick={() => setShowProfile(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors border border-gray-200 bg-white shadow-sm"
              title="User Profile"
            >
              <User size={20} />
            </button>

            <button
              onClick={onOpenShared}
              className="bg-white border border-gray-300 px-4 py-2 rounded-lg shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-colors flex-1 md:flex-none justify-center"
              style={{ color: DARK_TEXT }}
            >
              <KeyRound size={18} />
              Open Code
            </button>
            <button
              onClick={onCreate}
              className="text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors flex-1 md:flex-none justify-center hover:bg-red-700"
              style={{ backgroundColor: PRIMARY_RED }}
            >
              <Plus size={18} />
              New Sheet
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} style={{ color: MEDIUM_GRAY }} />
        </div>
        <input
          type="text"
          placeholder="Search by Street or Territory No..."
          className="pl-10 w-full p-3 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:outline-none transition-shadow"
          style={{ '--tw-ring-color': PRIMARY_RED, color: DARK_TEXT } as React.CSSProperties}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      {
        isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <LoadingSkeleton type="card" count={6} />
          </div>
        ) : sheets.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium" style={{ color: DARK_TEXT }}>No records found</h3>
            <p className="text-sm mt-1" style={{ color: MEDIUM_GRAY }}>Create a new sheet or open a shared code.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSheets.map(sheet => {
              const stats = getSheetStats(sheet.rows);
              return (
                <div
                  key={sheet.id}
                  className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer relative hover:border-blue-300 overflow-hidden" // Blue hover for general interactivity
                  onClick={() => onSelect(sheet)}
                >
                  {/* Map Preview */}
                  <div className="h-32 w-full bg-gray-100 relative overflow-hidden">
                    {sheet.street ? (
                      <iframe
                        title={`Map of ${sheet.street}`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        marginHeight={0}
                        marginWidth={0}
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(sheet.street + ' ' + (sheet.terrNo || '') + ' ' + cityState)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        className="opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none absolute top-[-25%] left-[-25%] w-[150%] h-[150%] border-none"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-300">
                        <MapPin size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/10 pointer-events-none" />
                  </div>

                  <div className="p-5 pt-3">
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: LIGHT_BG }}>
                        <MapPin size={20} style={{ color: PRIMARY_RED }} />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(sheet.id); }}
                        className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors md:opacity-0 md:group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h3 className="font-bold text-lg mb-1 truncate" style={{ color: DARK_TEXT }}>
                      {sheet.street || 'Untitled Street'}
                    </h3>

                    <div className="flex items-center gap-3 text-sm mb-4" style={{ color: MEDIUM_GRAY }}>
                      <span className="flex items-center gap-1">
                        <Hash size={14} /> {sheet.terrNo || '--'}
                      </span>
                      <span className="flex items-center gap-1 truncate max-w-[50%]">
                        <User size={14} /> {sheet.publisherName || 'No Name'}
                      </span>
                    </div>

                    {/* Mini Stats */}
                    <div className="flex gap-2 mb-3">
                      {stats.NH > 0 && <span className="text-xs px-2 py-0.5 rounded border font-medium" style={{ backgroundColor: LIGHT_BG, color: DARK_TEXT, borderColor: LIGHT_GRAY }}>{stats.NH} NH</span>}
                      {stats.CA > 0 && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100 font-medium">{stats.CA} CA</span>}
                    </div>

                    <div className="text-xs text-gray-400 border-t pt-3 flex justify-between items-center" style={{ borderColor: LIGHT_GRAY }}>
                      <span>{stats.Total} entries</span>
                      <span>{
                        sheet.updatedAt && typeof sheet.updatedAt === 'object' && 'seconds' in sheet.updatedAt
                          ? new Date(sheet.updatedAt.seconds * 1000).toLocaleDateString()
                          : 'Just now'
                      }</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
};

// --- New Component: SymbolSelector (Radio Buttons) ---
const SymbolSelector = ({ value, onChange, disabled }: { value: string; onChange: (val: string) => void; disabled?: boolean }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {SYMBOLS.map((sym) => (
        <button
          key={sym.code}
          type="button"
          onClick={() => onChange(sym.code)}
          disabled={disabled}
          className={`flex-shrink-0 text-xs font-bold px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${value === sym.code
            ? 'text-white border-gray-800'
            : 'bg-white border-gray-200 hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={value === sym.code ? { backgroundColor: DARK_TEXT } : { color: MEDIUM_GRAY }}
          title={sym.desc}
        >
          {sym.label}
        </button>
      ))}
    </div>
  );
};

const SheetEditor = ({ sheetData, onBack, onUpdate, onShare, isReadOnly }: { sheetData: Sheet; onBack: () => void; onUpdate: (id: string, data: Sheet) => void; onShare: (data: Sheet) => void; isReadOnly: boolean }) => {
  const [localData, setLocalData] = useState(sheetData);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false); // State for the new modal
  const [filterMode, setFilterMode] = useState<'ALL' | 'CA' | 'NH'>('ALL'); // ALL, CA, NH
  const [rowToDelete, setRowToDelete] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setLocalData(sheetData); }, [sheetData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const debouncedSave = (newData: Sheet) => {
    setIsSaving(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onUpdate(newData.id, newData);
      setIsSaving(false);
    }, 800) as any;
  };

  const handleHeaderChange = (field: string, value: string) => {
    if (isReadOnly) return;
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    debouncedSave(newData);
  };

  const handleRowChange = (id: string, field: keyof Row, value: string) => {
    if (isReadOnly) return;
    const newRows = localData.rows.map(row => row.id === id ? { ...row, [field]: value } : row);
    const newData = { ...localData, rows: newRows };
    setLocalData(newData);
    debouncedSave(newData);
  };

  const addRow = () => {
    if (isReadOnly) return;
    const newRow: Row = {
      id: generateId(),
      houseNo: '',
      date: new Date().toISOString().split('T')[0],
      symbol: '',
      remarks: ''
    };
    const newData = { ...localData, rows: [...(localData.rows || []), newRow] };
    setLocalData(newData);
    onUpdate(newData.id, newData); // Immediate save for adding
  };

  const confirmDeleteRow = (id: string) => {
    const newData = { ...localData, rows: localData.rows.filter(r => r.id !== id) };
    setLocalData(newData);
    onUpdate(newData.id, newData);
  };

  const filteredRows = useMemo(() => {
    if (!localData.rows) return [];
    if (filterMode === 'ALL') return localData.rows;
    return localData.rows.filter(r => r.symbol === filterMode);
  }, [localData.rows, filterMode]);

  const stats = getSheetStats(localData.rows);

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24">
      <ConfirmModal
        isOpen={!!rowToDelete}
        onClose={() => setRowToDelete(null)}
        onConfirm={() => { if (rowToDelete) confirmDeleteRow(rowToDelete); setRowToDelete(null); }}
        title="Delete Entry?"
        message="Are you sure you want to remove this house from the record?"
        isDangerous={true}
      />
      <ReportGeneratorModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        sheetData={localData}
        stats={stats}
        apiKey={localStorage.getItem('geminiApiKey') || ''}
      />

      {/* Nav */}
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur py-3 border-b mb-6 flex justify-between items-center" style={{ backgroundColor: LIGHT_BG, borderColor: LIGHT_GRAY }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors" style={{ color: DARK_TEXT }}>
            <ChevronLeft size={20} /> Back
          </button>
          {isReadOnly && (
            <span className="hidden sm:flex px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full items-center gap-1 ring-1 ring-amber-300">
              <Lock size={12} /> READ ONLY
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* New Gemini Feature Button */}
          <button
            onClick={() => setShowReportModal(true)}
            disabled={isReadOnly || stats.Total === 0}
            className="hidden md:flex items-center gap-2 px-3 py-2 text-white rounded-lg shadow font-medium transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: PRIMARY_RED }}
            title={stats.Total === 0 ? "Add entries to generate a report" : "Generate Territory Summary Report"}
          >
            <Sparkles size={18} /> Generate Summary Report
          </button>

          {!isReadOnly && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 mr-2">
              {isSaving ? (
                <span className="flex items-center gap-1 text-blue-500"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div> Saving...</span>
              ) : (
                <span className="flex items-center gap-1 text-green-600"><Save size={12} /> Saved</span>
              )}
            </div>
          )}

          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors" style={{ color: DARK_TEXT }}>
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2 space-y-1">
                  <button onClick={() => { setShowReportModal(true); setShowMenu(false); }} className="md:hidden w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-md flex items-center gap-2" style={{ color: DARK_TEXT }}>
                    <Sparkles size={16} style={{ color: PRIMARY_RED }} /> Generate Report
                  </button>
                  <button onClick={() => { generateCSV(localData); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md flex items-center gap-2" style={{ color: DARK_TEXT }}>
                    <Download size={16} /> Export CSV
                  </button>
                  <button onClick={() => { copyRichText(localData); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md flex items-center gap-2" style={{ color: DARK_TEXT }}>
                    <Copy size={16} /> Copy Text
                  </button>
                  {!isReadOnly && (
                    <>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button onClick={() => { onShare(localData); setShowMenu(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 hover:text-red-700 rounded-md flex items-center gap-2 font-medium" style={{ color: PRIMARY_RED }}>
                        <Share2 size={16} /> Share Link
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`bg-white shadow-lg rounded-lg overflow-hidden border ${isReadOnly ? 'border-amber-200 ring-4 ring-amber-50/50' : 'border-gray-200'} min-h-[80vh]`}>

        {/* Header Form */}
        <div className="p-6 border-b space-y-4" style={{ backgroundColor: WHITE, borderColor: LIGHT_GRAY }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <h2 className="text-xl font-serif font-bold uppercase tracking-wide" style={{ color: DARK_TEXT }}>House-to-House Record</h2>
            {/* Stats Pills */}
            <div className="flex gap-2 text-xs font-bold">
              <div className="px-2 py-1 rounded border" style={{ backgroundColor: LIGHT_BG, color: DARK_TEXT, borderColor: LIGHT_GRAY }}>{stats.NH} NH</div>
              <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded border border-blue-200">{stats.CA} CA</div>
              <div className="px-2 py-1 bg-gray-200 text-gray-700 rounded border border-gray-300">{localData.rows?.length || 0} Total</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: MEDIUM_GRAY }}>Street Name</label>
              <input type="text" disabled={isReadOnly} value={localData.street || ''} onChange={(e) => handleHeaderChange('street', e.target.value)} className="w-full border-b-2 border-gray-300 bg-transparent px-2 py-1 text-lg font-medium focus:outline-none disabled:border-transparent disabled:text-gray-600" style={{ color: DARK_TEXT, '--tw-focus-ring-color': PRIMARY_RED } as React.CSSProperties} placeholder="e.g., Maple Avenue" />
            </div>
            <div className="md:col-span-4">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: MEDIUM_GRAY }}>Terr. No.</label>
              <input type="text" disabled={isReadOnly} value={localData.terrNo || ''} onChange={(e) => handleHeaderChange('terrNo', e.target.value)} className="w-full border-b-2 border-gray-300 bg-transparent px-2 py-1 text-lg font-medium focus:outline-none disabled:border-transparent disabled:text-gray-600" style={{ color: DARK_TEXT, '--tw-focus-ring-color': PRIMARY_RED } as React.CSSProperties} placeholder="e.g., 14-B" />
            </div>
            <div className="md:col-span-12">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: MEDIUM_GRAY }}>Publisher</label>
              <input type="text" disabled={isReadOnly} value={localData.publisherName || ''} onChange={(e) => handleHeaderChange('publisherName', e.target.value)} className="w-full border-b-2 border-gray-300 bg-transparent px-2 py-1 text-lg font-medium focus:outline-none disabled:border-transparent disabled:text-gray-600" style={{ color: DARK_TEXT, '--tw-focus-ring-color': PRIMARY_RED } as React.CSSProperties} placeholder="Your Name" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border-b px-4 py-2 flex items-center gap-2 overflow-x-auto" style={{ borderColor: LIGHT_GRAY }}>
          <Filter size={14} style={{ color: MEDIUM_GRAY }} className="mr-1 shrink-0" />
          <span className="text-xs font-bold uppercase mr-2 shrink-0" style={{ color: MEDIUM_GRAY }}>Filter:</span>
          {['ALL', 'NH', 'CA'].map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode as 'ALL' | 'CA' | 'NH')}
              className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${filterMode === mode
                ? 'text-white border-gray-800'
                : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              style={filterMode === mode ? { backgroundColor: DARK_TEXT } : { color: MEDIUM_GRAY }}
            >
              {mode === 'ALL' ? 'Show All' : mode}
            </button>
          ))}
        </div>

        {/* Table Header (Desktop) */}
        <div className="hidden md:grid grid-cols-12 gap-4 bg-gray-100 p-3 border-b text-xs font-bold uppercase tracking-wider" style={{ borderColor: LIGHT_GRAY, backgroundColor: LIGHT_BG, color: DARK_TEXT }}>
          <div className="col-span-2">House No.</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Symbol</div>
          <div className="col-span-5">Name, Placement, Remarks</div>
          <div className="col-span-1 text-center">{!isReadOnly && 'Action'}</div>
        </div>

        {/* Rows */}
        <div className="divide-y" style={{ borderColor: LIGHT_GRAY }}>
          {filteredRows.length === 0 && (
            <div className="p-8 text-center text-sm italic" style={{ color: MEDIUM_GRAY }}>
              {filterMode === 'ALL' ? 'No entries yet. Add one below.' : `No "${filterMode}" entries found.`}
            </div>
          )}
          {filteredRows.map((row) => {
            const symbolObj = SYMBOLS.find(s => s.code === row.symbol) || SYMBOLS[0];
            return (
              <div
                key={row.id}
                className="p-4 border-b last:border-b-0 md:grid md:grid-cols-12 md:gap-4 md:items-center transition-colors hover:bg-gray-50 flex flex-col gap-3 relative"
                style={{ backgroundColor: symbolObj.code ? 'rgba(209, 67, 54, 0.03)' : '#ffffff' }}
              >
                {/* Mobile: Top Row (House No + Date + Delete) */}
                <div className="flex md:hidden justify-between items-start w-full">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">House No.</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={row.houseNo || ''}
                      onChange={(e) => handleRowChange(row.id, 'houseNo', e.target.value)}
                      className="text-xl font-bold text-gray-800 bg-transparent border-b border-transparent focus:border-red-500 focus:outline-none placeholder-gray-300 w-32"
                      placeholder="#"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="date"
                      disabled={isReadOnly}
                      value={row.date || new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleRowChange(row.id, 'date', e.target.value)}
                      className="text-xs text-gray-500 bg-transparent border-none focus:ring-0 text-right font-medium"
                    />
                    {!isReadOnly && (
                      <button
                        onClick={() => setRowToDelete(row.id)}
                        className="p-2 -mr-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Desktop: House No */}
                <div className="hidden md:block col-span-2">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={row.houseNo || ''}
                    onChange={(e) => handleRowChange(row.id, 'houseNo', e.target.value)}
                    className="w-full text-base font-medium border-b border-gray-300 px-1 focus:outline-none disabled:border-transparent bg-transparent"
                    style={{ color: DARK_TEXT }}
                    placeholder="e.g. 1234"
                  />
                </div>

                {/* Desktop: Date */}
                <div className="hidden md:block col-span-2">
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={row.date || new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleRowChange(row.id, 'date', e.target.value)}
                    className="w-full text-sm border-b border-gray-300 px-1 py-0.5 focus:outline-none disabled:border-transparent bg-transparent"
                    style={{ color: DARK_TEXT }}
                  />
                </div>

                {/* Symbol Selector (Mobile & Desktop) */}
                <div className="w-full md:col-span-2">
                  <label className="md:hidden text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1 block">Status</label>
                  <SymbolSelector
                    value={row.symbol}
                    onChange={(val) => handleRowChange(row.id, 'symbol', val)}
                    disabled={isReadOnly}
                  />
                </div>

                {/* Remarks (Mobile & Desktop) */}
                <div className="w-full md:col-span-5">
                  <label className="md:hidden text-[10px] font-bold uppercase text-gray-400 tracking-wider mb-1 block">Remarks</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={row.remarks || ''}
                    onChange={(e) => handleRowChange(row.id, 'remarks', e.target.value)}
                    className="w-full text-sm border-b border-gray-200 md:border-gray-300 px-1 py-1 focus:outline-none disabled:border-transparent bg-transparent focus:border-red-500 transition-colors"
                    style={{ color: DARK_TEXT }}
                    placeholder="Add notes..."
                  />
                </div>

                {/* Desktop: Delete Button */}
                {!isReadOnly && (
                  <div className="hidden md:block col-span-1 text-center">
                    <button
                      onClick={() => setRowToDelete(row.id)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-100 transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Row Button */}
        {!isReadOnly && (
          <div className="p-4 border-t" style={{ borderColor: LIGHT_GRAY }}>
            <button
              onClick={addRow}
              className="w-full py-2 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-red-50 transition-colors"
              style={{ borderColor: PRIMARY_RED, color: PRIMARY_RED }}
            >
              <Plus size={18} /> Add New Entry
            </button>
          </div>
        )}

      </div>

    </div>
  );
};

// --- Main App Component ---
const App = () => {
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState<{ shareUrl?: string; shareId?: string }>({});
  const [showEnterCodeModal, setShowEnterCodeModal] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false); // To handle shared view
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('displayName') || '');
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [cityState, setCityState] = useState(() => localStorage.getItem('cityState') || '');

  const [showAuthModal, setShowAuthModal] = useState(false);

  // PWA Hooks
  const { showToast } = useToast();
  const { isInstallable, promptInstall, dismissPrompt } = useInstallPrompt();
  const { needRefresh, updateServiceWorker } = usePWAUpdate();
  const { vibrate } = useHaptic();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  // Show install prompt after a delay (UX best practice)
  useEffect(() => {
    if (isInstallable && !localStorage.getItem('installPromptDismissed')) {
      const timer = setTimeout(() => setShowInstallPrompt(true), 5000); // 5 seconds delay
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  // Show update prompt when new version is available
  useEffect(() => {
    if (needRefresh) {
      setShowUpdatePrompt(true);
    }
  }, [needRefresh]);


  // Persist displayName
  useEffect(() => { localStorage.setItem('displayName', displayName); }, [displayName]);
  useEffect(() => { localStorage.setItem('geminiApiKey', geminiApiKey); }, [geminiApiKey]);
  useEffect(() => { localStorage.setItem('cityState', cityState); }, [cityState]);

  // Handle email/password authentication
  const handleLogin = async (email: string, password: string, isLogin: boolean) => {
    try {
      const userCredential = isLogin
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password);

      setUserEmail(email);
      return userCredential;
    } catch (error: unknown) {
      console.error("Authentication error:", error);
      vibrate('heavy');
      const msg = error instanceof Error ? error.message : 'Authentication failed';
      showToast(msg, 'error');
      throw error; // Re-throw for AuthModal to handle
    }
  };

  // 1. Authentication and Initialization
  useEffect(() => {
    // --- Firebase Auth ---
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email || '');
        setAuthReady(true);
      } else {
        // User not logged in, show auth modal
        setAuthReady(true);
        setShowAuthModal(true);
      }

    });

    return () => unsubscribe();
  }, []);

  // --- Data Fetching (Local Storage Only) ---
  useEffect(() => {
    const loadLocalSheets = async () => {
      setIsLoadingData(true);
      // Simulate network delay for skeleton demonstration
      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        const local = JSON.parse(localStorage.getItem('localSheets') || '[]');
        setSheets(local);
      } catch (e) {
        console.error("Failed to load local sheets", e);
        setSheets([]);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadLocalSheets();
    // Listen for storage events (optional, for multi-tab)
    window.addEventListener('storage', loadLocalSheets);
    return () => window.removeEventListener('storage', loadLocalSheets);
  }, []);

  // --- CRUD Operations (Local Storage Only) ---
  const handleCreateSheet = () => {
    const newSheet = {
      id: generateId(),
      street: '',
      terrNo: '',
      publisherName: displayName || 'Unknown',
      rows: [],
      createdAt: { seconds: Date.now() / 1000 },
      updatedAt: { seconds: Date.now() / 1000 }
    };
    const updatedSheets = [...sheets, newSheet];
    setSheets(updatedSheets);
    setSelectedSheet(newSheet);
    setIsReadOnly(false);
    localStorage.setItem('localSheets', JSON.stringify(updatedSheets));

    // PWA Enhancements
    vibrate('light');
    showToast('New sheet created!', 'success');
  };

  const handleDeleteSheet = (id: string) => {
    const updatedSheets = sheets.filter(s => s.id !== id);
    setSheets(updatedSheets);
    localStorage.setItem('localSheets', JSON.stringify(updatedSheets));
    if (selectedSheet?.id === id) setSelectedSheet(null);

    // PWA Enhancements
    vibrate('medium');
    showToast('Sheet deleted', 'info');
  };

  const handleUpdateSheet = (id: string, data: Sheet) => {
    const updatedSheets = sheets.map(s => s.id === id ? { ...s, ...data, updatedAt: { seconds: Date.now() / 1000 } } : s);
    setSheets(updatedSheets);
    localStorage.setItem('localSheets', JSON.stringify(updatedSheets));
  };

  // 4. Sharing Logic
  const handleShareSheet = async (data: Sheet) => {
    if (!userId) return;
    const shareId = generateId(); // Use a unique, public ID for sharing

    // Save a copy of the current state to a public collection for sharing
    // Path: /artifacts/{appId}/public/data/sharedRecords/{shareId}
    const publicDocRef = doc(db, `artifacts/${appId}/public/data/sharedRecords`, shareId);

    try {
      // Clean up serverTimestamp for public copy, just save the latest data.
      const publicData = {
        ...data,
        ownerId: userId,
        updatedAt: new Date().toISOString(),
      };
      // Use setDoc to use the generated shareId as the document ID
      await setDoc(publicDocRef, publicData);

      const shareUrl = `${window.location.origin}${window.location.pathname}?shareId=${shareId}`;

      setShareData({ shareUrl, shareId });
      setShowShareModal(true);
    } catch (error) {
      console.error("Error sharing sheet:", error);
    }
  };

  // 5. Opening Shared Record Logic
  const handleOpenSharedRecord = async (shareId: string) => {
    const docRef = doc(db, `artifacts/${appId}/public/data/sharedRecords`, shareId);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // Shared record is read-only, load it into selectedSheet
        setSelectedSheet({ ...docSnap.data(), id: shareId } as Sheet);
        setIsReadOnly(true);
      } else {
        console.warn("Shared record not found.");
      }
    } catch (error) {
      console.error("Error opening shared record:", error);
    } finally {
      setShowEnterCodeModal(false);
    }
  };

  // 6. Handle URL parameters for direct shared access
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get('shareId');
    if (shareId && authReady) {
      handleOpenSharedRecord(shareId);
    }
  }, [authReady]);

  // --- Render Logic ---
  if (!authReady) {
    return <div className="min-h-screen" style={{ backgroundColor: LIGHT_BG }}><Spinner /></div>;
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: LIGHT_BG }}>
      {/* Modals */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareData.shareUrl || ''}
        shareId={shareData.shareId || ''}
      />
      <EnterCodeModal
        isOpen={showEnterCodeModal}
        onClose={() => setShowEnterCodeModal(false)}
        onSubmit={handleOpenSharedRecord}
      />

      {/* Main Content */}
      <PullToRefresh onRefresh={async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        window.location.reload();
      }}>
        {selectedSheet ? (
          <SheetEditor
            sheetData={selectedSheet}
            onBack={() => { setSelectedSheet(null); setIsReadOnly(false); }}
            onUpdate={handleUpdateSheet}
            onShare={handleShareSheet}
            isReadOnly={isReadOnly}
          />
        ) : (
          <SheetList
            sheets={sheets}
            onSelect={(sheet) => { setSelectedSheet(sheet); setIsReadOnly(false); }}
            onCreate={handleCreateSheet}
            onDelete={handleDeleteSheet}
            onOpenShared={() => setShowEnterCodeModal(true)}
            userId={userId}
            userEmail={userEmail}
            onLogout={() => {
              signOut(auth);
              localStorage.clear();
              window.location.reload();
            }}
            displayName={displayName}
            setDisplayName={setDisplayName}
            geminiApiKey={geminiApiKey}
            setGeminiApiKey={setGeminiApiKey}
            cityState={cityState}
            setCityState={setCityState}
            isLoading={isLoadingData}
          />
        )}
      </PullToRefresh>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal && !userId}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
      />

      {/* Loading Screen */}
      {!authReady && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )}



      {/* PWA Components */}
      <Toast />
      <OfflineIndicator />

      {/* Install Prompt */}
      {showInstallPrompt && (
        <InstallPrompt
          onInstall={async () => {
            vibrate('medium');
            await promptInstall();
            setShowInstallPrompt(false);
            localStorage.setItem('installPromptDismissed', 'true');
            showToast('App installed successfully!', 'success');
          }}
          onDismiss={() => {
            dismissPrompt();
            setShowInstallPrompt(false);
            localStorage.setItem('installPromptDismissed', 'true');
          }}
        />
      )}

      {/* Update Notification */}
      {showUpdatePrompt && (
        <UpdateNotification
          onUpdate={() => {
            vibrate('medium');
            updateServiceWorker();
          }}
          onDismiss={() => setShowUpdatePrompt(false)}
        />
      )}
    </div>
  );
};

export default App;