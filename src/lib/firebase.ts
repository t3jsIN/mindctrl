// src/lib/firebase.ts
// Enhanced Firebase setup for MindCTRL - SSR Safe

// Browser check without SvelteKit dependency
const browser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  type Firestore,
  type DocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe
} from "firebase/firestore";

// Type definitions
interface UserData {
  data: any;
  timestamp: any;
  userId: string;
  key: string;
  lastModified?: string;
}

interface HydrationData {
  userWeight: number;
  userHeight: number;
  bmi: number;
  dailyWaterTarget: number;
  waterBottles: number[];
  totalConsumed: number;
  isSetupComplete: boolean;
  lastResetDate: string;
  date?: string;
  savedAt?: string;
}

interface SleepData {
  isAwake: boolean;
  sleepStartTime: Date | null;
  wakeTime: Date | null;
  totalSleepToday: number;
  dailyAverage: number;
  lastSaveDate: string;
  date?: string;
  savedAt?: string;
}

interface TaskData {
  id: number;
  title: string;
  description: string;
  priority: string;
  goalCount: number;
  energyRequired: number;
  schedule: string;
  recurrence: string;
  duration: number;
  currentProgress: number;
  completed: boolean;
  createdAt: Date;
  [key: string]: any;
}

interface TaskCompletionData {
  taskTitle?: string;
  taskPriority?: string;
  createdAt?: Date;
  completedAt?: Date;
  actualDuration?: number;
  type?: string;
  goalCount?: number;
  duration?: number;
  schedule?: string;
  recurrence?: string;
  energyRequired?: number;
  finalProgress?: number;
}

interface AnalyticsData {
  hydration: any[];
  sleep: any[];
  tasks: any[];
  period: number;
}

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-Gi8LzzIGOcu-Y-qi-YKIx_CpkoAU6aw",
  authDomain: "mindctrl-da117.firebaseapp.com",
  projectId: "mindctrl-da117",
  storageBucket: "mindctrl-da117.firebasestorage.app",
  messagingSenderId: "139906444439",
  appId: "1:139906444439:web:266a2353a8ce90b43ccdd2"
};

// Initialize Firebase (only in browser)
let app: any = null;
let db: Firestore | null = null;

if (browser) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

// Generate a simple user ID based on browser/device (browser only)
function generateUserId(): string {
  if (!browser) {
    return 'ssr_placeholder'; // Placeholder for SSR
  }
  
  let userId = localStorage.getItem('mindctrl_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('mindctrl_user_id', userId);
  }
  return userId;
}

export const USER_ID: string = browser ? generateUserId() : 'ssr_placeholder';

// Enhanced storage class with specific methods for different data types
export class FirebaseStorage {
  
  // Generic storage methods
  static async setItem(key: string, value: any, userId: string = USER_ID): Promise<boolean> {
    if (!browser || !db) {
      // Fallback to localStorage only in browser
      if (browser) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (error) {
          console.error('LocalStorage error:', error);
          return false;
        }
      }
      return false;
    }

    try {
      const docRef = doc(db, 'userData', `${userId}_${key}`);
      await setDoc(docRef, {
        data: value,
        timestamp: serverTimestamp(),
        userId: userId,
        key: key,
        lastModified: new Date().toISOString()
      }, { merge: true });
      
      // Also save to localStorage as backup
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Firebase setItem error:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (localError) {
        console.error('LocalStorage fallback failed:', localError);
        return false;
      }
    }
  }

  static async getItem(key: string, userId: string = USER_ID): Promise<any> {
    if (!browser || !db) {
      // Fallback to localStorage only in browser
      if (browser) {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        } catch (error) {
          console.error('LocalStorage getItem error:', error);
          return null;
        }
      }
      return null;
    }

    try {
      const docRef = doc(db, 'userData', `${userId}_${key}`);
      const docSnap: DocumentSnapshot = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        // Update localStorage with cloud data
        localStorage.setItem(key, JSON.stringify(data.data));
        return data.data;
      }
      
      // Fallback to localStorage if no cloud data
      const localData = localStorage.getItem(key);
      return localData ? JSON.parse(localData) : null;
    } catch (error) {
      console.error('Firebase getItem error:', error);
      // Fallback to localStorage
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (localError) {
        console.error('LocalStorage fallback failed:', localError);
        return null;
      }
    }
  }

  // HYDRATION DATA METHODS
  static async saveHydrationData(hydrationData: HydrationData): Promise<boolean> {
    if (!browser) return false;
    
    const today = new Date().toDateString();
    const dataWithDate: HydrationData = {
      ...hydrationData,
      date: today,
      savedAt: new Date().toISOString()
    };
    
    try {
      // Save current day data
      await this.setItem('hydration_matrix_data', dataWithDate);
      
      // Save to daily history (only if Firebase available)
      if (db) {
        const historyDoc = doc(db, 'hydrationHistory', `${USER_ID}_${today}`);
        await setDoc(historyDoc, {
          userId: USER_ID,
          date: today,
          ...dataWithDate,
          timestamp: serverTimestamp()
        });
      }
      
      console.log('Hydration data saved');
      return true;
    } catch (error) {
      console.error('Error saving hydration data:', error);
      return false;
    }
  }

  static async getHydrationHistory(days: number = 30): Promise<any[]> {
    if (!browser || !db) return [];
    
    try {
      const historyQuery = query(
        collection(db, 'hydrationHistory'),
        where('userId', '==', USER_ID),
        orderBy('date', 'desc'),
        limit(days)
      );
      
      const snapshot: QuerySnapshot = await getDocs(historyQuery);
      const history: any[] = [];
      
      snapshot.forEach(doc => {
        history.push(doc.data());
      });
      
      return history;
    } catch (error) {
      console.error('Error fetching hydration history:', error);
      return [];
    }
  }

  // SLEEP DATA METHODS
  static async saveSleepData(sleepData: SleepData): Promise<boolean> {
    if (!browser) return false;
    
    const today = new Date().toDateString();
    const dataWithDate: SleepData = {
      ...sleepData,
      date: today,
      savedAt: new Date().toISOString()
    };
    
    try {
      // Save current sleep state
      await this.setItem('mindctrl_sleep_data', dataWithDate);
      
      // Save to daily history if there's actual sleep data (only if Firebase available)
      if (db && sleepData.totalSleepToday > 0) {
        const historyDoc = doc(db, 'sleepHistory', `${USER_ID}_${today}`);
        await setDoc(historyDoc, {
          userId: USER_ID,
          date: today,
          ...dataWithDate,
          timestamp: serverTimestamp()
        });
      }
      
      console.log('Sleep data saved');
      return true;
    } catch (error) {
      console.error('Error saving sleep data:', error);
      return false;
    }
  }

  // TASK DATA METHODS
  static async saveTasks(tasks: TaskData[]): Promise<boolean> {
    if (!browser) return false;
    
    try {
      // Save current tasks
      await this.setItem('taskmaster_tasks', tasks);
      
      // Save to tasks collection for backup and history (only if Firebase available)
      if (db) {
        const tasksDoc = doc(db, 'tasks', `${USER_ID}_current`);
        await setDoc(tasksDoc, {
          userId: USER_ID,
          tasks: tasks,
          lastModified: new Date().toISOString(),
          date: new Date().toDateString(),
          timestamp: serverTimestamp()
        });
      }
      
      console.log('Tasks saved:', tasks.length, 'tasks');
      return true;
    } catch (error) {
      console.error('Error saving tasks:', error);
      return false;
    }
  }

  static async saveTaskCompletion(taskId: string, completionData: TaskCompletionData): Promise<boolean> {
    if (!browser || !db) return false;
    
    try {
      const completionDoc = doc(db, 'taskCompletions', `${USER_ID}_${taskId}_${Date.now()}`);
      await setDoc(completionDoc, {
        userId: USER_ID,
        taskId: taskId,
        ...completionData,
        timestamp: serverTimestamp(),
        date: new Date().toDateString()
      });
      
      console.log('Task completion saved:', taskId);
      return true;
    } catch (error) {
      console.error('Error saving task completion:', error);
      return false;
    }
  }

  // BACKUP AND SYNC METHODS
  static async syncAllData(): Promise<boolean> {
    if (!browser) return false;
    
    try {
      console.log('Starting data sync...');
      
      // Get all data from localStorage
      const hydrationData = JSON.parse(localStorage.getItem('hydration_matrix_data') || '{}');
      const sleepData = JSON.parse(localStorage.getItem('mindctrl_sleep_data') || '{}');
      const tasks = JSON.parse(localStorage.getItem('taskmaster_tasks') || '[]');
      const wakeState = JSON.parse(localStorage.getItem('mindctrl_wake_state') || '{}');
      
      // Sync each data type
      if (Object.keys(hydrationData).length > 0) {
        await this.saveHydrationData(hydrationData);
      }
      
      if (Object.keys(sleepData).length > 0) {
        await this.saveSleepData(sleepData);
      }
      
      if (tasks.length > 0) {
        await this.saveTasks(tasks);
      }
      
      if (Object.keys(wakeState).length > 0) {
        await this.setItem('mindctrl_wake_state', wakeState);
      }
      
      console.log('Data sync completed');
      return true;
    } catch (error) {
      console.error('Error syncing data:', error);
      return false;
    }
  }
}

// Auto-sync every 5 minutes (browser only)
let autoSyncInterval: NodeJS.Timeout | null = null;

export function startAutoSync(): void {
  if (!browser || autoSyncInterval) return;
  
  autoSyncInterval = setInterval(async () => {
    await FirebaseStorage.syncAllData();
  }, 5 * 60 * 1000); // 5 minutes
  
  console.log('Auto-sync started (every 5 minutes)');
}

export function stopAutoSync(): void {
  if (!browser || !autoSyncInterval) return;
  
  clearInterval(autoSyncInterval);
  autoSyncInterval = null;
  console.log('Auto-sync stopped');
}

// Initialize auto-sync when module loads (browser only)
if (browser) {
  startAutoSync();
  
  // Sync on page load
  setTimeout(() => {
    FirebaseStorage.syncAllData();
  }, 2000);
  
  // Sync before page unload
  window.addEventListener('beforeunload', () => {
    FirebaseStorage.syncAllData();
  });
}