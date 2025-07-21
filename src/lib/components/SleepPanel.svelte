<script lang="ts">
  import { onMount } from 'svelte';
  import BorderBeam from "./BorderBeam.svelte";
  import { FirebaseStorage } from '../firebase.ts';
  
  export let onWakeStateChange: (isAwake: boolean) => void = () => {};
  
  let isAwake = true;
  let sleepStartTime: Date | null = null;
  let wakeTime: Date | null = null;
  let totalSleepToday = 0; // in hours
  let dailyAverage = 0; // in hours
  let freeTimeToday = 0; // in hours
  let tasks: any[] = [];
  let isOnline = true;
  let lastSyncTime = '';
  let isSyncing = false;
  
  const SLEEP_STORAGE_KEY = 'mindctrl_sleep_data';
  const TASKS_STORAGE_KEY = 'taskmaster_tasks';
  
  async function saveSleepData() {
    const sleepData = {
      isAwake,
      sleepStartTime,
      wakeTime,
      totalSleepToday,
      dailyAverage,
      lastSaveDate: new Date().toDateString(),
      lastSyncTime: new Date().toISOString()
    };
    
    // Save to Firebase
    if (isOnline) {
      isSyncing = true;
      try {
        const success = await FirebaseStorage.saveSleepData(sleepData);
        if (success) {
          lastSyncTime = new Date().toLocaleTimeString();
          console.log('Sleep data synced to cloud');
        }
      } catch (error) {
        console.error('Firebase sync error:', error);
      } finally {
        isSyncing = false;
      }
    }
    
    // Always save to localStorage as backup
    localStorage.setItem(SLEEP_STORAGE_KEY, JSON.stringify(sleepData));
  }
  
  async function loadSleepData() {
    try {
      // Try to load from Firebase first
      const cloudData = await FirebaseStorage.getItem(SLEEP_STORAGE_KEY);
      
      if (cloudData) {
        isAwake = cloudData.isAwake ?? true;
        sleepStartTime = cloudData.sleepStartTime ? new Date(cloudData.sleepStartTime) : null;
        wakeTime = cloudData.wakeTime ? new Date(cloudData.wakeTime) : null;
        totalSleepToday = cloudData.totalSleepToday || 0;
        dailyAverage = cloudData.dailyAverage || 0;
        lastSyncTime = cloudData.lastSyncTime ? new Date(cloudData.lastSyncTime).toLocaleTimeString() : '';
        
        // Reset if it's a new day
        const today = new Date().toDateString();
        if (cloudData.lastSaveDate !== today) {
          totalSleepToday = 0;
          sleepStartTime = null;
          wakeTime = null;
        }
        
        console.log('Sleep data loaded from cloud');
        return;
      }
    } catch (error) {
      console.error('Error loading from cloud, trying localStorage:', error);
    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem(SLEEP_STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        isAwake = data.isAwake ?? true;
        sleepStartTime = data.sleepStartTime ? new Date(data.sleepStartTime) : null;
        wakeTime = data.wakeTime ? new Date(data.wakeTime) : null;
        totalSleepToday = data.totalSleepToday || 0;
        dailyAverage = data.dailyAverage || 0;
        
        // Reset if it's a new day
        const today = new Date().toDateString();
        if (data.lastSaveDate !== today) {
          totalSleepToday = 0;
          sleepStartTime = null;
          wakeTime = null;
        }
        console.log('Sleep data loaded from localStorage');
      } catch (error) {
        console.error('Error loading sleep data:', error);
      }
    }
  }
  
  async function loadTasks() {
    try {
      // Try to load from Firebase first
      const cloudTasks = await FirebaseStorage.getItem(TASKS_STORAGE_KEY);
      if (cloudTasks) {
        tasks = cloudTasks;
        calculateFreeTime();
        return;
      }
    } catch (error) {
      console.error('Error loading tasks from cloud:', error);
    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem(TASKS_STORAGE_KEY);
    if (saved) {
      try {
        tasks = JSON.parse(saved);
        calculateFreeTime();
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }
  }
  
  function calculateFreeTime() {
    const totalTaskTime = tasks.reduce((total, task) => {
      if (!task.completed) {
        return total + (task.duration || 0);
      }
      return total;
    }, 0);
    
    const totalTaskHours = totalTaskTime / 60;
    const workingHours = 16; // Assuming 16 working hours per day
    freeTimeToday = Math.max(0, workingHours - totalTaskHours);
  }
  
  async function toggleSleepState() {
    const now = new Date();
    
    if (isAwake) {
      // Going to sleep
      isAwake = false;
      sleepStartTime = now;
      wakeTime = null;
    } else {
      // Waking up
      isAwake = true;
      wakeTime = now;
      
      // Calculate sleep duration
      if (sleepStartTime) {
        const sleepDuration = (now.getTime() - sleepStartTime.getTime()) / (1000 * 60 * 60);
        totalSleepToday += sleepDuration;
        
        // Update daily average (simple rolling average)
        dailyAverage = (dailyAverage * 0.9) + (sleepDuration * 0.1);
        
        // Log sleep completion to Firebase
        if (isOnline) {
          try {
            await FirebaseStorage.saveTaskCompletion('sleep_session', {
              startTime: sleepStartTime,
              endTime: now,
              duration: sleepDuration,
              quality: getSleepQuality(),
              type: 'sleep'
            });
          } catch (error) {
            console.error('Error logging sleep completion:', error);
          }
        }
      }
    }
    
    await saveSleepData();
    onWakeStateChange(isAwake);
  }
  
  function formatTime(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours % 1) * 60);
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  }
  
  function getSleepQuality(): string {
    if (totalSleepToday >= 8) return 'Excellent';
    if (totalSleepToday >= 7) return 'Good';
    if (totalSleepToday >= 6) return 'Fair';
    if (totalSleepToday >= 4) return 'Poor';
    return 'Critical';
  }
  
  function getSleepQualityColor(): string {
    if (totalSleepToday >= 8) return 'text-green-400';
    if (totalSleepToday >= 7) return 'text-blue-400';
    if (totalSleepToday >= 6) return 'text-yellow-400';
    if (totalSleepToday >= 4) return 'text-orange-400';
    return 'text-red-400';
  }
  
  // Check connection status
  function updateOnlineStatus() {
    isOnline = navigator.onLine;
  }
  
  onMount(() => {
    loadSleepData();
    loadTasks();
    
    // Monitor connection status
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    
    // Listen for task updates
    const interval = setInterval(() => {
      loadTasks();
    }, 30000); // Every 30 seconds
    
    // Auto-save sleep data every minute
    const autoSaveInterval = setInterval(() => {
      if (totalSleepToday > 0 || !isAwake) {
        saveSleepData();
      }
    }, 60000);
    
    return () => {
      clearInterval(interval);
      clearInterval(autoSaveInterval);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  });
</script>

<div class="relative rounded-2xl p-6 bg-gray-900/50 backdrop-blur-sm">
  <BorderBeam size={280} duration={14} colorFrom="#6366F1" colorTo="#8B5CF6" />
  
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
        </svg>
      </div>
      <div>
        <h3 class="text-lg font-semibold">SLEEP MATRIX</h3>
        <div class="flex items-center gap-2">
          <p class="text-xs text-gray-400">Smart sleep & productivity tracking</p>
          <!-- Connection Status -->
          <div class="flex items-center gap-1">
            <div class="w-1.5 h-1.5 rounded-full {isOnline ? 'bg-green-400' : 'bg-red-400'} {isSyncing ? 'animate-pulse' : ''}"></div>
            <span class="text-xs text-gray-500">{isSyncing ? 'syncing' : isOnline ? 'synced' : 'offline'}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- iPhone-style Toggle -->
    <button
      class="relative w-16 h-8 rounded-full transition-all duration-300 focus:outline-none {isAwake ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-indigo-600 to-purple-700'}"
      on:click={toggleSleepState}
      aria-label="{isAwake ? 'Go to sleep' : 'Wake up'}"
    >
      <!-- Toggle Circle -->
      <div class="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 flex items-center justify-center {isAwake ? 'transform translate-x-8' : ''}">
        {#if isAwake}
          <!-- Sun Icon -->
          <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        {:else}
          <!-- Moon Icon -->
          <svg class="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        {/if}
      </div>
      
      <!-- Background Icons -->
      <div class="absolute inset-0 flex items-center justify-between px-2">
        <svg class="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
        </svg>
        <svg class="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </div>
    </button>
  </div>
  
  <!-- Sleep Stats -->
  <div class="grid grid-cols-3 gap-4">
    <div class="bg-gray-800/50 rounded-xl p-4 text-center">
      <p class="text-xs text-gray-400 mb-1">Today's Sleep</p>
      <p class="text-lg font-bold text-blue-400">{formatTime(totalSleepToday)}</p>
      <p class="text-xs {getSleepQualityColor()}">{getSleepQuality()}</p>
    </div>
    
    <div class="bg-gray-800/50 rounded-xl p-4 text-center">
      <p class="text-xs text-gray-400 mb-1">Daily Average</p>
      <p class="text-lg font-bold text-purple-400">{formatTime(dailyAverage)}</p>
      <p class="text-xs text-gray-500">7-day avg</p>
    </div>
    
    <div class="bg-gray-800/50 rounded-xl p-4 text-center">
      <p class="text-xs text-gray-400 mb-1">Free Time</p>
      <p class="text-lg font-bold text-green-400">{formatTime(freeTimeToday)}</p>
      <p class="text-xs text-gray-500">remaining</p>
    </div>
  </div>
  
  <!-- Current Status -->
  <div class="p-3 rounded-xl {isAwake ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-indigo-500/10 border border-indigo-500/30'} mt-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-3 h-3 rounded-full {isAwake ? 'bg-yellow-400 animate-pulse' : 'bg-indigo-400'}"></div>
        <span class="text-sm font-medium {isAwake ? 'text-yellow-300' : 'text-indigo-300'}">
          {isAwake ? '☀️ Awake & Active' : '🌙 Sleep Mode Active'}
        </span>
      </div>
      
      {#if lastSyncTime}
        <span class="text-xs text-gray-500">Synced: {lastSyncTime}</span>
      {/if}
    </div>
    
    <!-- Sleep Session Info -->
    {#if !isAwake && sleepStartTime}
      <div class="mt-2 text-xs text-indigo-300">
        Sleep started: {sleepStartTime.toLocaleTimeString()}
      </div>
    {/if}
    
    {#if isAwake && wakeTime && sleepStartTime}
      <div class="mt-2 text-xs text-yellow-300">
        Last sleep: {formatTime((wakeTime.getTime() - sleepStartTime.getTime()) / (1000 * 60 * 60))}
      </div>
    {/if}
  </div>
</div>