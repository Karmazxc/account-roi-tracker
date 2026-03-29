/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, ReactNode, Component, ErrorInfo } from 'react';
import { 
  Users, 
  PhilippinePeso, 
  FileCode, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  History,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Save,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, signInAnonymously, firebaseConfig } from './firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  setDoc,
  writeBatch, 
  serverTimestamp,
  getDocFromServer,
  orderBy
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

// --- Types ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface Account {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  status: 'Available' | 'Restricted';
  restrictionEndTime?: number; // Timestamp
  balance: number;
  ownerId: string;
}

interface Earning {
  id: string;
  amount: number;
  date: string;
  accountId: string;
  scriptId: string;
  status: 'Available' | 'Withdrawn';
  ownerId: string;
}

interface Script {
  id: string;
  name: string;
  cost: number;
  earned: number;
  date: string;
  expirationDate?: string;
  ownerId: string;
}

// --- Components ---

const Card: React.FC<{ children: ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button: React.FC<{ 
  children: ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost',
  className?: string,
  disabled?: boolean
}> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = "",
  disabled = false
}) => {
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-50"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder,
  className = "",
  id
}: { 
  label?: string, 
  type?: string, 
  value?: string | number, 
  onChange?: (val: any) => void,
  placeholder?: string,
  className?: string,
  id?: string
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{label}</label>}
    <input 
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange?.(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 placeholder:text-slate-400"
    />
  </div>
);

const Select = ({ 
  label, 
  value, 
  onChange, 
  options,
  placeholder,
  className = ""
}: { 
  label?: string, 
  value?: string, 
  onChange?: (val: string) => void,
  options: { value: string, label: string }[],
  placeholder?: string,
  className?: string
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">{label}</label>}
    <select 
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 appearance-none cursor-pointer"
    >
      <option value="">{placeholder || 'Select option'}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number, 
  totalPages: number, 
  onPageChange: (page: number) => void 
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-10 pb-6">
      <button 
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
      >
        <ChevronLeft size={20} />
      </button>
      
      <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm font-mono text-sm">
        <span className="text-indigo-600 font-bold">{currentPage.toString().padStart(2, '0')}</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 font-bold">{totalPages.toString().padStart(2, '0')}</span>
      </div>

      <button 
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.errorInfo || "");
        if (parsed.error && parsed.error.includes("insufficient permissions")) {
          displayMessage = "You don't have permission to perform this action. Please check your account settings.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <Card className="max-w-md w-full p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Application Error</h2>
            <p className="text-slate-600">{displayMessage}</p>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Reload Application
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'accounts' | 'earnings' | 'scripts'>('accounts');
  const PAGE_SIZE = 6;

  const [newAccount, setNewAccount] = useState({ name: '', email: '', phone: '' });
  const [newEarning, setNewEarning] = useState({ amount: '', accountId: '', scriptId: '' });
  const [newScript, setNewScript] = useState({ name: '', cost: '', durationDays: '' });

  const [accountsPage, setAccountsPage] = useState(1);
  const [earningsPage, setEarningsPage] = useState(1);
  const [scriptsPage, setScriptsPage] = useState(1);
  const [earningsFilter, setEarningsFilter] = useState<'All' | 'Available' | 'Withdrawn'>('All');
  const [scriptsFilter, setScriptsFilter] = useState<'All' | 'Active' | 'Expired'>('All');
  const [accountsFilter, setAccountsFilter] = useState<'All' | 'Available' | 'Restricted'>('All');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (error: any) {
          console.error("Anonymous sign-in failed:", error);
          if (error.code === 'auth/admin-restricted-operation') {
            setAuthError(`Anonymous Authentication is disabled in the Firebase Console for project "${firebaseConfig.projectId}". Please enable it under Authentication > Sign-in method.`);
          } else {
            setAuthError("Failed to sign in automatically. Please check your internet connection.");
          }
          setIsAuthReady(true);
        }
      } else {
        setUser(currentUser);
        setIsAuthReady(true);
        setAuthError(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners & Migration
  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setEarnings([]);
      setScripts([]);
      return;
    }

    const migrateData = async () => {
      const accountsRef = collection(db, 'accounts');
      const q = query(accountsRef, where('ownerId', '==', user.uid));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Check local storage for migration
        const localAccounts = JSON.parse(localStorage.getItem('tracker_accounts') || '[]');
        const localEarnings = JSON.parse(localStorage.getItem('tracker_earnings') || '[]');
        const localScripts = JSON.parse(localStorage.getItem('tracker_scripts') || '[]');

        if (localAccounts.length > 0 || localEarnings.length > 0 || localScripts.length > 0) {
          console.log("Migrating data to Firestore...");
          const batch = writeBatch(db);

          localAccounts.forEach((acc: any) => {
            const newDoc = doc(collection(db, 'accounts'));
            batch.set(newDoc, {
              ...acc,
              id: newDoc.id,
              ownerId: user.uid,
              balance: acc.balance || 0,
              status: acc.status || 'Available',
              createdAt: serverTimestamp()
            });
          });

          localEarnings.forEach((e: any) => {
            const newDoc = doc(collection(db, 'earnings'));
            batch.set(newDoc, {
              ...e,
              id: newDoc.id,
              ownerId: user.uid,
              status: (e.status === 'Cashout' || e.status === 'Pending') ? 'Available' : 
                      (e.status === 'Cashed' || e.status === 'Payout') ? 'Withdrawn' : 
                      (e.status || 'Available'),
              createdAt: serverTimestamp()
            });
          });

          localScripts.forEach((s: any) => {
            const newDoc = doc(collection(db, 'scripts'));
            batch.set(newDoc, {
              ...s,
              id: newDoc.id,
              ownerId: user.uid,
              createdAt: serverTimestamp()
            });
          });

          await batch.commit();
          console.log("Migration complete.");
          // Clear local storage after migration
          localStorage.removeItem('tracker_accounts');
          localStorage.removeItem('tracker_earnings');
          localStorage.removeItem('tracker_scripts');
        }
      }
    };

    migrateData();

    // Real-time listeners
    const unsubAccounts = onSnapshot(
      query(collection(db, 'accounts'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setAccounts(snapshot.docs.map(doc => doc.data() as Account));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'accounts')
    );

    const unsubEarnings = onSnapshot(
      query(collection(db, 'earnings'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setEarnings(snapshot.docs.map(doc => doc.data() as Earning));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'earnings')
    );

    const unsubScripts = onSnapshot(
      query(collection(db, 'scripts'), where('ownerId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setScripts(snapshot.docs.map(doc => doc.data() as Script));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'scripts')
    );

    return () => {
      unsubAccounts();
      unsubEarnings();
      unsubScripts();
    };
  }, [user]);

  // Timer logic for restricted accounts
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const now = Date.now();
      accounts.forEach(async (acc) => {
        if (acc.status === 'Restricted' && acc.restrictionEndTime && acc.restrictionEndTime <= now) {
          try {
            await updateDoc(doc(db, 'accounts', acc.id), {
              status: 'Available',
              restrictionEndTime: null
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `accounts/${acc.id}`);
          }
        }
      });
    }, 5000); // Check every 5 seconds for Firestore updates
    return () => clearInterval(interval);
  }, [user, accounts]);

  // --- Handlers ---

  const addAccount = async (name: string, email: string, phoneNumber: string) => {
    if (!name || !user) return;
    try {
      const accountsRef = collection(db, 'accounts');
      const newAccountDoc = doc(accountsRef);
      const newAcc: Account = { 
        id: newAccountDoc.id, 
        name, 
        email, 
        phoneNumber, 
        status: 'Available',
        balance: 0,
        ownerId: user.uid
      };
      await setDoc(newAccountDoc, {
        ...newAcc,
        createdAt: serverTimestamp()
      });
      setAccountsPage(1);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'accounts');
    }
  };

  const restrictAccount = async (id: string, minutes: number) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'accounts', id), {
        status: 'Restricted',
        restrictionEndTime: Date.now() + minutes * 60 * 1000
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `accounts/${id}`);
    }
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'accounts', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `accounts/${id}`);
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'accounts', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `accounts/${id}`);
    }
  };

  const addEarning = async (amount: number, accountId: string, scriptId: string) => {
    if (!amount || !accountId || !scriptId || !user) return;
    
    try {
      const batch = writeBatch(db);
      const earningsRef = collection(db, 'earnings');
      const newEarningDoc = doc(earningsRef);
      
      const newEarningObj: Earning = { 
        id: newEarningDoc.id, 
        amount, 
        accountId,
        scriptId,
        date: new Date().toISOString(),
        status: 'Available',
        ownerId: user.uid
      };
      
      batch.set(newEarningDoc, {
        ...newEarningObj,
        createdAt: serverTimestamp()
      });
      
      // Update Account Balance
      const account = accounts.find(a => a.id === accountId);
      if (account) {
        batch.update(doc(db, 'accounts', accountId), {
          balance: account.balance + amount
        });
      }
      
      // Update Script Earnings
      const script = scripts.find(s => s.id === scriptId);
      if (script) {
        batch.update(doc(db, 'scripts', scriptId), {
          earned: script.earned + amount
        });
      }
      
      await batch.commit();
      setEarningsPage(1);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'earnings/batch');
    }
  };

  const withdrawEarning = async (id: string) => {
    if (!user) return;
    const earning = earnings.find(e => e.id === id);
    if (!earning || earning.status === 'Withdrawn') return;

    try {
      const batch = writeBatch(db);
      
      // Update Earning Status
      batch.update(doc(db, 'earnings', id), {
        status: 'Withdrawn'
      });

      // Decrease Account Balance
      const account = accounts.find(a => a.id === earning.accountId);
      if (account) {
        batch.update(doc(db, 'accounts', earning.accountId), {
          balance: account.balance - earning.amount
        });
      }
      
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'earnings/withdraw/batch');
    }
  };

  const addScript = async (name: string, cost: number, expirationDate?: string) => {
    if (!name || !cost || !user) return;
    try {
      const scriptsRef = collection(db, 'scripts');
      const newScriptDoc = doc(scriptsRef);
      const newScriptObj: Script = { 
        id: newScriptDoc.id, 
        name, 
        cost, 
        earned: 0, 
        date: new Date().toISOString(),
        expirationDate,
        ownerId: user.uid
      };
      await setDoc(newScriptDoc, {
        ...newScriptObj,
        createdAt: serverTimestamp()
      });
      setScriptsPage(1);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'scripts');
    }
  };

  const deleteScript = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'scripts', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `scripts/${id}`);
    }
  };

  const updateScript = async (id: string, updates: Partial<Script>) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'scripts', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `scripts/${id}`);
    }
  };

  // --- Stats ---
  const totalEarnings = useMemo(() => earnings.reduce((sum, e) => sum + e.amount, 0), [earnings]);
  const totalWithdrawn = useMemo(() => earnings.filter(e => e.status === 'Withdrawn').reduce((sum, e) => sum + e.amount, 0), [earnings]);
  const availableBalance = useMemo(() => earnings.filter(e => e.status === 'Available').reduce((sum, e) => sum + e.amount, 0), [earnings]);
  const totalScriptCost = useMemo(() => scripts.reduce((sum, s) => sum + s.cost, 0), [scripts]);
  const totalScriptEarned = useMemo(() => scripts.reduce((sum, s) => sum + s.earned, 0), [scripts]);

  // --- Paginated Data ---
  const filteredAccounts = useMemo(() => {
    if (accountsFilter === 'All') return accounts;
    return accounts.filter(a => a.status === accountsFilter);
  }, [accounts, accountsFilter]);

  const paginatedAccounts = useMemo(() => {
    const start = (accountsPage - 1) * PAGE_SIZE;
    return filteredAccounts.slice(start, start + PAGE_SIZE);
  }, [filteredAccounts, accountsPage]);

  const filteredEarnings = useMemo(() => {
    if (earningsFilter === 'All') return earnings;
    return earnings.filter(e => e.status === earningsFilter);
  }, [earnings, earningsFilter]);

  const paginatedEarnings = useMemo(() => {
    const start = (earningsPage - 1) * PAGE_SIZE;
    return filteredEarnings.slice(start, start + PAGE_SIZE);
  }, [filteredEarnings, earningsPage]);

  const filteredScripts = useMemo(() => {
    if (scriptsFilter === 'All') return scripts;
    const now = new Date();
    if (scriptsFilter === 'Active') {
      return scripts.filter(s => !s.expirationDate || new Date(s.expirationDate) >= now);
    }
    return scripts.filter(s => s.expirationDate && new Date(s.expirationDate) < now);
  }, [scripts, scriptsFilter]);

  const paginatedScripts = useMemo(() => {
    const start = (scriptsPage - 1) * PAGE_SIZE;
    return filteredScripts.slice(start, start + PAGE_SIZE);
  }, [filteredScripts, scriptsPage]);

  const totalAccountsPages = Math.ceil(filteredAccounts.length / PAGE_SIZE);
  const totalEarningsPages = Math.ceil(filteredEarnings.length / PAGE_SIZE);
  const totalScriptsPages = Math.ceil(filteredScripts.length / PAGE_SIZE);

  // Sync pages when data changes (e.g. after deletion)
  useEffect(() => {
    if (accountsPage > totalAccountsPages && totalAccountsPages > 0) {
      setAccountsPage(totalAccountsPages);
    }
  }, [accounts.length, filteredAccounts.length, totalAccountsPages, accountsPage]);

  useEffect(() => {
    if (earningsPage > totalEarningsPages && totalEarningsPages > 0) {
      setEarningsPage(totalEarningsPages);
    }
  }, [earnings.length, totalEarningsPages, earningsPage]);

  useEffect(() => {
    if (scriptsPage > totalScriptsPages && totalScriptsPages > 0) {
      setScriptsPage(totalScriptsPages);
    }
  }, [scripts.length, totalScriptsPages, scriptsPage]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight italic">ROI TRACKER</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{authError}</p>
          </div>
          <div className="pt-2">
            <Button className="w-full h-12 shadow-lg shadow-indigo-100" onClick={() => window.location.reload()}>
              I've enabled it, try again
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Firebase Configuration Required</p>
        </Card>
      </div>
    );
  }

  if (!isAuthReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <TrendingUp size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Account & ROI Tracker</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Management System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <nav className="flex bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'accounts', icon: Users, label: 'Accounts' },
                { id: 'earnings', icon: PhilippinePeso, label: 'Earnings' },
                { id: 'scripts', icon: FileCode, label: 'Scripts' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <tab.icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'accounts' && (
            <motion.div 
              key="accounts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <Input 
                  label="Account Name" 
                  placeholder="e.g. Account #01" 
                  className="flex-1"
                  value={newAccount.name}
                  onChange={(val) => setNewAccount({ ...newAccount, name: val })}
                />
                <Input 
                  label="Email" 
                  placeholder="email@example.com" 
                  className="flex-1"
                  value={newAccount.email}
                  onChange={(val) => setNewAccount({ ...newAccount, email: val })}
                />
                <Input 
                  label="Phone Number" 
                  placeholder="09123456789" 
                  className="flex-1"
                  value={newAccount.phone}
                  onChange={(val) => {
                    const numericVal = val.toString().replace(/\D/g, '');
                    setNewAccount({ ...newAccount, phone: numericVal });
                  }}
                />
                <Button onClick={() => {
                  addAccount(newAccount.name, newAccount.email, newAccount.phone);
                  setNewAccount({ name: '', email: '', phone: '' });
                }}>
                  <Plus size={18} /> Add Account
                </Button>
              </div>

              <div className="flex items-center justify-end mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter:</span>
                  <select
                    value={accountsFilter}
                    onChange={(e) => {
                      setAccountsFilter(e.target.value as any);
                      setAccountsPage(1);
                    }}
                    className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="All">All Accounts</option>
                    <option value="Available">Available</option>
                    <option value="Restricted">Restricted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedAccounts.map(acc => (
                  <AccountCard 
                    key={acc.id} 
                    account={acc} 
                    onRestrict={restrictAccount} 
                    onUpdate={updateAccount}
                  />
                ))}
                {accounts.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                    <Users className="mx-auto text-slate-300 mb-3" size={48} />
                    <p className="text-slate-400 font-medium">No accounts added yet</p>
                  </div>
                )}
              </div>

              <Pagination 
                currentPage={accountsPage} 
                totalPages={totalAccountsPages} 
                onPageChange={setAccountsPage} 
              />
            </motion.div>
          )}

          {activeTab === 'earnings' && (
            <motion.div 
              key="earnings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="p-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Earnings</p>
                  <h2 className="text-3xl font-bold text-slate-800">₱{totalEarnings.toLocaleString()}</h2>
                </Card>
                <Card className="p-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Withdrawn</p>
                  <h2 className="text-3xl font-bold text-emerald-600">₱{totalWithdrawn.toLocaleString()}</h2>
                </Card>
                <Card className="p-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Available Balance</p>
                  <h2 className="text-3xl font-bold text-indigo-600">₱{availableBalance.toLocaleString()}</h2>
                </Card>
                <Card className="p-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Today's Total</p>
                  <h2 className="text-3xl font-bold text-slate-800">
                    ₱{earnings
                      .filter(e => new Date(e.date).toDateString() === new Date().toDateString())
                      .reduce((sum, e) => sum + e.amount, 0)
                      .toLocaleString()}
                  </h2>
                </Card>
              </div>

              <Card className="p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Plus size={18} className="text-indigo-600" /> New Entry
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <Input 
                    label="Amount (₱)" 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full sm:w-32"
                    value={newEarning.amount}
                    onChange={(val) => setNewEarning({ ...newEarning, amount: val })}
                  />
                  <Select 
                    label="Account"
                    placeholder="Select Account"
                    className="w-full sm:w-48"
                    value={newEarning.accountId}
                    onChange={(val) => setNewEarning({ ...newEarning, accountId: val })}
                    options={accounts.map(a => ({ value: a.id, label: a.name }))}
                  />
                  <Select 
                    label="Link to Script (Required)"
                    placeholder="Select Script"
                    className="w-full sm:w-48"
                    value={newEarning.scriptId}
                    onChange={(val) => setNewEarning({ ...newEarning, scriptId: val })}
                    options={scripts.map(s => ({ value: s.id, label: s.name }))}
                  />
                  <Button 
                    disabled={!newEarning.amount || !newEarning.accountId || !newEarning.scriptId}
                    onClick={() => {
                      addEarning(
                        parseFloat(newEarning.amount.toString()) || 0, 
                        newEarning.accountId,
                        newEarning.scriptId
                      );
                      setNewEarning({ amount: '', accountId: '', scriptId: '' });
                    }}
                  >
                    Add Entry
                  </Button>
                </div>
                {(!newEarning.accountId || !newEarning.scriptId) && (newEarning.amount) && (
                  <p className="text-[10px] text-rose-500 font-bold uppercase mt-2 ml-1">
                    Please select both an account and a script to continue
                  </p>
                )}
              </Card>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <History size={18} className="text-indigo-600" /> Recent History
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter:</span>
                    <select 
                      value={earningsFilter}
                      onChange={(e) => {
                        setEarningsFilter(e.target.value as any);
                        setEarningsPage(1);
                      }}
                      className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="All">All Status</option>
                      <option value="Available">Available</option>
                      <option value="Withdrawn">Withdrawn</option>
                    </select>
                  </div>
                </div>
                {paginatedEarnings.map(e => (
                  <Card key={e.id} className="p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        e.status === 'Withdrawn' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {e.status === 'Withdrawn' ? <CheckCircle2 size={20} /> : <PhilippinePeso size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-bold ${e.status === 'Withdrawn' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            ₱{e.amount.toLocaleString()}
                          </p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            e.status === 'Withdrawn' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {e.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {accounts.find(a => a.id === e.accountId)?.name || 'Unknown Account'} 
                          {e.scriptId && scripts.find(s => s.id === e.scriptId) && (
                            <span className="ml-2 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase">
                              {scripts.find(s => s.id === e.scriptId)?.name}
                            </span>
                          )}
                          • {new Date(e.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {e.status === 'Available' && (
                      <Button 
                        variant="secondary" 
                        className="text-xs py-1 h-8 px-3" 
                        onClick={() => withdrawEarning(e.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </Card>
                ))}
                {earnings.length === 0 && (
                  <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                    <PhilippinePeso className="mx-auto text-slate-300 mb-3" size={48} />
                    <p className="text-slate-400 font-medium">No earnings recorded yet</p>
                  </div>
                )}

                <Pagination 
                  currentPage={earningsPage} 
                  totalPages={totalEarningsPages} 
                  onPageChange={setEarningsPage} 
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'scripts' && (
            <motion.div 
              key="scripts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Investment</p>
                  <h2 className="text-3xl font-bold text-slate-800">₱{totalScriptCost.toLocaleString()}</h2>
                </Card>
                <Card className="p-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total ROI Progress</p>
                  <div className="flex items-end gap-2">
                    <h2 className="text-3xl font-bold text-slate-800">₱{totalScriptEarned.toLocaleString()}</h2>
                    <span className={`text-sm font-bold mb-1 ${totalScriptEarned >= totalScriptCost ? 'text-emerald-500' : 'text-slate-400'}`}>
                      ({totalScriptCost > 0 ? Math.round((totalScriptEarned / totalScriptCost) * 100) : 0}%)
                    </span>
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Calculator size={18} className="text-indigo-600" /> New Script Purchase
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter:</span>
                    <select 
                      value={scriptsFilter}
                      onChange={(e) => {
                        setScriptsFilter(e.target.value as any);
                        setScriptsPage(1);
                      }}
                      className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="All">All Scripts</option>
                      <option value="Active">Active</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <Input 
                    label="Script Name" 
                    placeholder="e.g. Auto-Farmer v2" 
                    className="flex-1"
                    value={newScript.name}
                    onChange={(val) => setNewScript({ ...newScript, name: val })}
                  />
                  <Input 
                    label="Cost (₱)" 
                    type="number" 
                    placeholder="0.00" 
                    className="w-full sm:w-32"
                    value={newScript.cost}
                    onChange={(val) => setNewScript({ ...newScript, cost: val })}
                  />
                  <Input
                    label="Duration (Hours:Minutes)"
                    type="text"
                    placeholder="e.g. 48:00"
                    className="w-full sm:w-40"
                    value={newScript.durationDays}
                    onChange={(val) => setNewScript({ ...newScript, durationDays: val })}
                  />
                  <Button onClick={() => {
                    let expiryDate: string | undefined = undefined;
                    if (newScript.durationDays) {
                      const parts = newScript.durationDays.toString().split(':');
                      const hours = parseInt(parts[0] || '0');
                      const minutes = parseInt(parts[1] || '0');
                      const totalMinutes = hours * 60 + minutes;
                      if (!isNaN(hours) && hours >= 0 && totalMinutes > 0) {
                        const date = new Date();
                        date.setMinutes(date.getMinutes() + totalMinutes);
                        expiryDate = date.toISOString();
                      }
                    }
                    addScript(newScript.name, parseFloat(newScript.cost.toString()) || 0, expiryDate);
                    setNewScript({ name: '', cost: '', durationDays: '' });
                  }}>Add Script</Button>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginatedScripts.map(s => (
                  <ScriptCard 
                    key={s.id} 
                    script={s} 
                    onDelete={deleteScript} 
                    onEdit={updateScript}
                  />
                ))}
                {scripts.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                    <FileCode className="mx-auto text-slate-300 mb-3" size={48} />
                    <p className="text-slate-400 font-medium">No scripts tracked yet</p>
                  </div>
                )}
              </div>

              <Pagination 
                currentPage={scriptsPage} 
                totalPages={totalScriptsPages} 
                onPageChange={setScriptsPage} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-components ---

interface AccountCardProps {
  account: Account;
  onRestrict: (id: string, mins: number) => void;
  onUpdate: (id: string, updates: Partial<Account>) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ 
  account, 
  onRestrict, 
  onUpdate
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [restrictMins, setRestrictMins] = useState<number>(60);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ 
    name: account.name, 
    email: account.email || '', 
    phoneNumber: account.phoneNumber || '' 
  });

  useEffect(() => {
    if (account.status !== 'Restricted' || !account.restrictionEndTime) return;

    const update = () => {
      const diff = account.restrictionEndTime! - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [account]);

  const handleSave = () => {
    onUpdate(account.id, editData);
    setIsEditing(false);
  };

  return (
    <Card className="p-5 flex flex-col gap-4 group relative">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 w-full">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            account.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {account.status === 'Available' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          </div>
          
          {isEditing ? (
            <div className="flex flex-col gap-2 w-full pr-8">
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Name</label>
                <input 
                  className="w-full text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={editData.name}
                  onChange={e => setEditData({...editData, name: e.target.value})}
                  placeholder="Name"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Email</label>
                <input 
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={editData.email}
                  onChange={e => setEditData({...editData, email: e.target.value})}
                  placeholder="Email"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Phone</label>
                <input 
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={editData.phoneNumber}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setEditData({...editData, phoneNumber: val});
                  }}
                  placeholder="Phone Number"
                />
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="primary" className="py-1 text-[10px] h-8" onClick={handleSave}>
                  <Save size={12} /> Save
                </Button>
                <Button variant="ghost" className="py-1 text-[10px] h-8" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <h4 className="font-bold text-slate-800 leading-tight truncate">{account.name}</h4>
              <div className="flex flex-col gap-0.5 mt-1">
                <p className="text-[10px] text-slate-500 truncate max-w-[150px]">
                  {account.email || <span className="italic text-slate-300">Not set (Email)</span>}
                </p>
                <p className="text-[10px] text-slate-500">
                  {account.phoneNumber || <span className="italic text-slate-300">Not set (Phone)</span>}
                </p>
                <p className="text-xs font-bold text-indigo-600 mt-1">
                  Balance: ₱{account.balance.toLocaleString()}
                </p>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 block ${
                account.status === 'Available' ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {account.status}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2 absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="p-1.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Edit Account"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>

      {account.status === 'Restricted' ? (
        <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <Clock size={14} />
            <span className="text-xs font-semibold">Unlocks in:</span>
          </div>
          <span className="font-mono font-bold text-indigo-600">{timeLeft}</span>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex-1">
            <input 
              type="number" 
              value={restrictMins || ''} 
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setRestrictMins(isNaN(val) ? 0 : val);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Mins"
            />
          </div>
          <Button variant="secondary" className="text-xs py-1 px-3" onClick={() => onRestrict(account.id, restrictMins)}>
            Restrict
          </Button>
        </div>
      )}
    </Card>
  );
}

interface ScriptCardProps {
  script: Script;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Script>) => void;
}

const ScriptCard: React.FC<ScriptCardProps> = ({ 
  script, 
  onDelete,
  onEdit
}) => {
  const [addAmount, setAddAmount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: script.name,
    cost: script.cost.toString(),
    expirationDate: script.expirationDate || ''
  });

  const isROI = script.earned >= script.cost;
  const progress = Math.min(100, Math.round((script.earned / script.cost) * 100));
  
  const isExpired = script.expirationDate ? new Date(script.expirationDate) < new Date() : false;

  useEffect(() => {
    if (!script.expirationDate) return;

    const update = () => {
      const expiry = new Date(script.expirationDate!).getTime();
      const diff = expiry - Date.now();
      
      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      if (d > 0) {
        setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [script.expirationDate]);

  const handleSave = () => {
    onEdit(script.id, {
      name: editData.name,
      cost: parseFloat(editData.cost) || 0,
      expirationDate: editData.expirationDate || undefined
    });
    setIsEditing(false);
  };

  return (
    <Card className={`p-6 flex flex-col gap-5 group relative transition-all ${isExpired ? 'border-rose-200 bg-rose-50/30' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="w-full">
          {isEditing ? (
            <div className="flex flex-col gap-3 pr-10">
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Script Name</label>
                <input 
                  className="w-full text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={editData.name}
                  onChange={e => setEditData({...editData, name: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Cost (₱)</label>
                <input 
                  type="number"
                  className="w-full text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={editData.cost}
                  onChange={e => setEditData({...editData, cost: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-slate-400 uppercase ml-1">Expiration Date</label>
                <input 
                  type="date"
                  className="w-full text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={editData.expirationDate.split('T')[0]}
                  onChange={e => setEditData({...editData, expirationDate: e.target.value})}
                />
              </div>
              <div className="flex gap-2 mt-1">
                <Button variant="primary" className="py-1 text-[10px] h-8" onClick={handleSave}>
                  <Save size={12} /> Save
                </Button>
                <Button variant="ghost" className="py-1 text-[10px] h-8" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                {script.name}
                {isExpired && (
                  <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    Expired
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-500 font-medium">Purchased on {new Date(script.date).toLocaleDateString()}</p>
              {script.expirationDate && (
                <div className="mt-2 flex flex-col gap-1">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isExpired ? 'text-rose-500' : 'text-slate-400'}`}>
                    Expires: {new Date(script.expirationDate).toLocaleDateString()}
                  </p>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-mono font-bold w-fit ${
                    isExpired ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                  }`}>
                    <Clock size={12} />
                    {timeLeft}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="flex flex-col gap-2 absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)} 
              className="p-1.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="Edit Script"
            >
              <Pencil size={14} />
            </button>
          )}
          <button 
            onClick={() => onDelete(script.id)} 
            className="p-1.5 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
            title="Delete Script"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cost</p>
          <p className="font-bold text-slate-700">₱{script.cost.toLocaleString()}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Earned</p>
          <p className="font-bold text-indigo-600">₱{script.earned.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
          <span className="text-slate-400">ROI Progress</span>
          <span className={isROI ? 'text-emerald-500' : 'text-indigo-500'}>{progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={`h-full ${isROI ? 'bg-emerald-500' : 'bg-indigo-500'}`}
          />
        </div>
      </div>
    </Card>
  );
}
