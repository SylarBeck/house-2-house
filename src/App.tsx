import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  getFirestore
} from 'firebase/firestore';
import { marked } from 'marked';

// PWA Components and Hooks
import { ToastProvider, useToast } from './hooks/useToast';
import { useInstallPrompt } from './hooks/usePWA';
import { useHaptic } from './hooks/useHaptic';
import Toast from './components/Toast';
import InstallPrompt from './components/InstallPrompt';
import UpdateNotification from './components/UpdateNotification';
import OfflineIndicator from './components/OfflineIndicator';
import LoadingSkeleton from './components/LoadingSkeleton';


// --- Firebase Configuration ---
// TODO: Replace with your actual Firebase configuration
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
const AuthModal = ({ isOpen, onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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
    } catch (err) {
      setError(err.message || 'Authentication failed');
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
const ProfileModal = ({ isOpen, onClose, userId, userEmail, onLogout, displayName, setDisplayName, geminiApiKey, setGeminiApiKey }) => {
  const [showApiKey, setShowApiKey] = useState(false);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">User Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
              <User size={32} />
            </div>

            {/* Name Input */}
            <div className="w-full mb-2">
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

            <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded text-xs break-all">
              ID: {userId}
            </p>
          </div>

          {/* Email Display */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm mb-3">
            <p className="font-bold text-gray-700 mb-1 flex items-center gap-2">
              <Mail size={14} /> Email
            </p>
            <p className="text-gray-600 break-all">{userEmail}</p>
          </div>

          {/* API Key Configuration */}
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm mb-3">
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
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm">
            <p className="font-bold text-blue-800 mb-1">Storage Status:</p>
            <p className="text-blue-700">💾 Local Storage Only (Device)</p>
            <p className="text-xs text-blue-600 mt-1">Data is saved on this device.</p>
          </div>

          {/* Actions */}
          <div className="pt-4">
            <button
              onClick={onLogout}
              className="w-full py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Keep getFirestore for now, though not used for data storage
const appId = 'house-2-house-pwa'; // Keep appId for consistency, though not used for data storage

// --- Gemini API Configuration ---
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=`;
const apiKey = ""; // TODO: Add your Gemini API key here

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

const generateCSV = (data) => {
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

const copyRichText = (data) => {
  let text = `HOUSE-TO-HOUSE RECORD\n`;
  text += `Street: ${data.street || 'N/A'} | Terr: ${data.terrNo || 'N/A'} | Pub: ${data.publisherName || 'N/A'}\n`;
  text += `----------------------------------------\n`;
  (data.rows || []).forEach(row => {
    const sym = row.symbol ? `[${row.symbol}]` : '';
    text += `${row.houseNo || '?'} \t| ${row.date} \t| ${sym} ${row.remarks || ''}\n`;
  });
  navigator.clipboard.writeText(text);
};

const getSheetStats = (rows = []) => {
  const stats = { NH: 0, CA: 0, B: 0, Total: rows.length };
  rows.forEach(r => {
    if (['NH', 'CA', 'B'].includes(r.symbol)) {
      stats[r.symbol] = (stats[r.symbol] || 0) + 1;
    }
  });
  return stats;
};

// --- LLM Feature: Report Generator ---
const ReportGeneratorModal = ({ isOpen, onClose, sheetData, stats }) => {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // Function to call the Gemini API
  const generateReport = async (data, stats) => {
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
      } catch (err) {
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
  }, [isOpen, sheetData, stats]);

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

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isDangerous }) => {
  if (!isOpen) return null;
  return (
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
            style={!isDangerous ? { backgroundColor: PRIMARY_RED, '--hover-bg-color': '#c03a2f' } : {}}
            onMouseOver={e => !isDangerous && (e.currentTarget.style.backgroundColor = e.currentTarget.style.getPropertyValue('--hover-bg-color'))}
            onMouseOut={e => !isDangerous && (e.currentTarget.style.backgroundColor = PRIMARY_RED)}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const ShareModal = ({ isOpen, onClose, shareUrl, shareId }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

const EnterCodeModal = ({ isOpen, onClose, onSubmit }) => {
  const [input, setInput] = useState('');
  if (!isOpen) return null;

  const handleSubmit = (e) => {
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
            style={{ '--tw-ring-color': PRIMARY_RED }}
            placeholder="e.g. 3vfihh..."
          />
          <button type="submit" className="w-full py-2 text-white rounded-lg hover:bg-red-700 font-medium" style={{ backgroundColor: PRIMARY_RED }}>Open Record</button>
        </form>
      </div>
    </div>
  );
};

const SheetList = ({ sheets, onSelect, onCreate, onDelete, onOpenShared, userId, userEmail, onLogout, displayName, setDisplayName, geminiApiKey, setGeminiApiKey }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState(null);
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
        onConfirm={() => onDelete(deleteId)}
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
          style={{ '--tw-ring-color': PRIMARY_RED, color: DARK_TEXT }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      {
        sheets.length === 0 ? (
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
                  className="group bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer relative hover:border-blue-300" // Blue hover for general interactivity
                  onClick={() => onSelect(sheet)}
                >
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
                    <span>{sheet.updatedAt?.toDate ? sheet.updatedAt.toDate().toLocaleDateString() : 'Just now'}</span>
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
const SymbolSelector = ({ value, onChange, disabled }) => {
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

const SheetEditor = ({ sheetData, onBack, onUpdate, onShare, isReadOnly = false }) => {
  const [localData, setLocalData] = useState(sheetData);
  const [isSaving, setIsSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false); // State for the new modal
  const [filterMode, setFilterMode] = useState('ALL'); // ALL, CA, NH
  const [rowToDelete, setRowToDelete] = useState(null);

  const menuRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => { setLocalData(sheetData); }, [sheetData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const debouncedSave = (newData) => {
    setIsSaving(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onUpdate(newData.id, newData);
      setIsSaving(false);
    }, 800);
  };

  const handleHeaderChange = (field, value) => {
    if (isReadOnly) return;
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    debouncedSave(newData);
  };

  const handleRowChange = (id, field, value) => {
    if (isReadOnly) return;
    const newRows = localData.rows.map(row => row.id === id ? { ...row, [field]: value } : row);
    const newData = { ...localData, rows: newRows };
    setLocalData(newData);
    debouncedSave(newData);
  };

  const addRow = () => {
    if (isReadOnly) return;
    const newRow = {
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

  const confirmDeleteRow = (id) => {
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
        onConfirm={() => confirmDeleteRow(rowToDelete)}
        title="Delete Entry?"
        message="Are you sure you want to remove this house from the record?"
        isDangerous={true}
      />
      <ReportGeneratorModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        sheetData={localData}
        stats={stats}
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
              <input type="text" disabled={isReadOnly} value={localData.street || ''} onChange={(e) => handleHeaderChange('street', e.target.value)} className="w-full border-b-2 border-gray-300 bg-transparent px-2 py-1 text-lg font-medium focus:outline-none disabled:border-transparent disabled:text-gray-600" style={{ color: DARK_TEXT, '--tw-focus-ring-color': PRIMARY_RED }} placeholder="e.g., Maple Avenue" />
            </div>
            <div className="md:col-span-4">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: MEDIUM_GRAY }}>Terr. No.</label>
              <input type="text" disabled={isReadOnly} value={localData.terrNo || ''} onChange={(e) => handleHeaderChange('terrNo', e.target.value)} className="w-full border-b-2 border-gray-300 bg-transparent px-2 py-1 text-lg font-medium focus:outline-none disabled:border-transparent disabled:text-gray-600" style={{ color: DARK_TEXT, '--tw-focus-ring-color': PRIMARY_RED }} placeholder="e.g., 14-B" />
            </div>
            <div className="md:col-span-12">
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: MEDIUM_GRAY }}>Publisher</label>
              <input type="text" disabled={isReadOnly} value={localData.publisherName || ''} onChange={(e) => handleHeaderChange('publisherName', e.target.value)} className="w-full border-b-2 border-gray-300 bg-transparent px-2 py-1 text-lg font-medium focus:outline-none disabled:border-transparent disabled:text-gray-600" style={{ color: DARK_TEXT, '--tw-focus-ring-color': PRIMARY_RED }} placeholder="Your Name" />
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
              onClick={() => setFilterMode(mode)}
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
                className="p-3 grid grid-cols-12 gap-4 md:gap-4 items-center transition-colors"
                style={{ backgroundColor: symbolObj.code ? 'rgba(209, 67, 54, 0.05)' : '#ffffff' }}
              >
                {/* House No. */}
                <div className="col-span-4 md:col-span-2">
                  <label className="md:hidden text-xs font-bold uppercase block mb-1" style={{ color: MEDIUM_GRAY }}>House No.</label>
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

                {/* Date */}
                <div className="col-span-4 md:col-span-2">
                  <label className="md:hidden text-xs font-bold uppercase block mb-1" style={{ color: MEDIUM_GRAY }}>Date</label>
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={row.date || new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleRowChange(row.id, 'date', e.target.value)}
                    className="w-full text-sm border-b border-gray-300 px-1 py-0.5 focus:outline-none disabled:border-transparent bg-transparent"
                    style={{ color: DARK_TEXT }}
                  />
                </div>

                {/* Symbol Dropdown */}
                <div className="col-span-4 md:col-span-2">
                  <label className="md:hidden text-xs font-bold uppercase block mb-1" style={{ color: MEDIUM_GRAY }}>Symbol</label>
                  <SymbolSelector
                    value={row.symbol}
                    onChange={(val) => handleRowChange(row.id, 'symbol', val)}
                    disabled={isReadOnly}
                  />
                </div>

                {/* Remarks/Name */}
                <div className="col-span-11 md:col-span-5 pt-3 md:pt-0">
                  <label className="md:hidden text-xs font-bold uppercase block mb-1" style={{ color: MEDIUM_GRAY }}>Remarks</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={row.remarks || ''}
                    onChange={(e) => handleRowChange(row.id, 'remarks', e.target.value)}
                    className="w-full text-sm border-b border-gray-300 px-1 focus:outline-none disabled:border-transparent bg-transparent"
                    style={{ color: DARK_TEXT }}
                    placeholder="Notes (Name, literature, etc.)"
                  />
                </div>

                {/* Delete Button (Mobile & Desktop) */}
                {!isReadOnly && (
                  <div className="col-span-1 text-right md:text-center">
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
  const [userId, setUserId] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState({});
  const [showEnterCodeModal, setShowEnterCodeModal] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false); // To handle shared view
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('displayName') || '');
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [userEmail, setUserEmail] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Persist displayName
  useEffect(() => {
    localStorage.setItem('displayName', displayName);
  }, [displayName]);

  // Persist API key
  useEffect(() => {
    localStorage.setItem('geminiApiKey', geminiApiKey);
  }, [geminiApiKey]);

  // Handle email/password authentication
  const handleLogin = async (email, password, isLogin) => {
    try {
      const userCredential = isLogin
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password);

      setUserEmail(email);
      return userCredential;
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  };

  // 1. Authentication and Initialization + PWA Registration
  useEffect(() => {
    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error);
          });
      });
    }

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
    const loadLocalSheets = () => {
      try {
        const local = JSON.parse(localStorage.getItem('localSheets') || '[]');
        setSheets(local);
      } catch (e) {
        console.error("Failed to load local sheets", e);
        setSheets([]);
      }
    };
    loadLocalSheets();
    // Listen for storage events (optional, for multi-tab)
    window.addEventListener('storage', loadLocalSheets);
    return () => window.removeEventListener('storage', loadLocalSheets);
  }, []);

  // --- CRUD Operations (Local Storage Only) ---
  const handleCreateSheet = () => {
    const id = 'local_' + Date.now();
    const newSheet = {
      id,
      street: '',
      terrNo: '',
      publisherName: displayName,
      rows: [],
      createdAt: { seconds: Date.now() / 1000 },
      updatedAt: { seconds: Date.now() / 1000 }
    };
    const updatedSheets = [newSheet, ...sheets];
    setSheets(updatedSheets);
    localStorage.setItem('localSheets', JSON.stringify(updatedSheets));
    setSelectedSheet(newSheet);
    setIsReadOnly(false);
  };

  const handleDeleteSheet = (id) => {
    const updatedSheets = sheets.filter(s => s.id !== id);
    setSheets(updatedSheets);
    localStorage.setItem('localSheets', JSON.stringify(updatedSheets));
    if (selectedSheet?.id === id) setSelectedSheet(null);
  };

  const handleUpdateSheet = (id, data) => {
    const updatedSheets = sheets.map(s => s.id === id ? { ...s, ...data, updatedAt: { seconds: Date.now() / 1000 } } : s);
    setSheets(updatedSheets);
    localStorage.setItem('localSheets', JSON.stringify(updatedSheets));
  };

  // 4. Sharing Logic
  const handleShareSheet = async (data) => {
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
  const handleOpenSharedRecord = async (shareId) => {
    const docRef = doc(db, `artifacts/${appId}/public/data/sharedRecords`, shareId);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // Shared record is read-only, load it into selectedSheet
        setSelectedSheet({ ...docSnap.data(), id: shareId });
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
        />
      )}

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

      {/* User ID Display */}
      <div className="fixed bottom-0 left-0 right-0 p-2 text-center text-xs bg-gray-100/80 backdrop-blur-sm border-t" style={{ color: MEDIUM_GRAY, borderColor: LIGHT_GRAY }}>
        App ID: {appId} | User ID: {userId || 'Authenticating...'}
      </div>
    </div>
  );
};

export default App;