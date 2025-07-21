<script lang="ts">
  import AnimatedHeader from "$lib/components/AnimatedHeader.svelte";
  import Particles from "$lib/components/Particles.svelte";
  import HydrationMatrix from "$lib/components/HydrationMatrix.svelte";
  import TaskMaster from "$lib/components/TaskMaster.svelte";
  import SleepPanel from "$lib/components/SleepPanel.svelte";
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { FirebaseStorage, startAutoSync, stopAutoSync } from '$lib/firebase.ts';

  let isOnline = true;
  let lastSyncTime = '';
  let isSyncing = false;

  function openTaskMaster() {
    goto('/taskmaster');
  }

  function handleWakeStateChange(isAwake: boolean) {
    console.log('Wake state changed:', isAwake);
    
    // Trigger auto-sync when wake state changes
    if (isAwake) {
      // When waking up, sync all data
      setTimeout(async () => {
        await FirebaseStorage.syncAllData();
        lastSyncTime = new Date().toLocaleTimeString();
      }, 1000);
    }
  }

  // Force sync all data
  async function forceSync() {
    if (isSyncing) return;
    
    isSyncing = true;
    try {
      await FirebaseStorage.syncAllData();
      lastSyncTime = new Date().toLocaleTimeString();
      console.log('Manual sync completed');
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      isSyncing = false;
    }
  }

  // Check connection status
  function updateOnlineStatus() {
    const wasOffline = !isOnline;
    isOnline = navigator.onLine;
    
    if (wasOffline && isOnline) {
      // Just came back online - sync everything
      setTimeout(forceSync, 2000);
    }
  }

  // Initialize sync status
  function initSyncStatus() {
    const lastSync = localStorage.getItem('last_sync_time');
    if (lastSync) {
      lastSyncTime = new Date(lastSync).toLocaleTimeString();
    }
  }

  onMount(() => {
    // Initialize sync status
    initSyncStatus();
    
    // Monitor connection status
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    
    // Start auto-sync service
    startAutoSync();
    
    // Initial sync after page load
    setTimeout(async () => {
      if (isOnline) {
        await forceSync();
      }
    }, 3000);
    
    // Periodic sync every 5 minutes when online
    const syncInterval = setInterval(() => {
      if (isOnline && !isSyncing) {
        forceSync();
      }
    }, 5 * 60 * 1000);
    
    // Sync before page unload
    const handleBeforeUnload = () => {
      if (isOnline) {
        FirebaseStorage.syncAllData();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(syncInterval);
      stopAutoSync();
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });
</script>

<svelte:head>
  <title>MindCTRL - Take Control of Your Mind</title>
  <meta name="description" content="Comprehensive life management system with hydration tracking, sleep monitoring, and advanced task management. All data automatically synced to the cloud." />
  <meta name="keywords" content="productivity, task management, hydration tracking, sleep monitoring, life optimization" />
</svelte:head>

<div class="min-h-screen bg-black text-white relative overflow-hidden">
  <!-- Particles Background -->
  <div class="absolute inset-0">
    <Particles
      className="w-full h-full"
      quantity={150}
      color="#ffffff"
      size={0.6}
      staticity={30}
      ease={20}
    />
  </div>

  <!-- Header -->
  <AnimatedHeader />

  <!-- Sync Status Bar -->
  <div class="relative z-10 max-w-4xl mx-auto px-3">
    <div class="flex items-center justify-between py-2 px-4 bg-gray-900/40 backdrop-blur-sm rounded-lg mb-4 border border-gray-700/30">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full {isOnline ? 'bg-green-400' : 'bg-red-400'} {isSyncing ? 'animate-pulse' : ''}"></div>
          <span class="text-xs font-medium {isOnline ? 'text-green-400' : 'text-red-400'}">
            {#if isSyncing}
              Syncing to cloud...
            {:else if isOnline}
              Connected & Synced
            {:else}
              Offline Mode
            {/if}
          </span>
        </div>
        
        {#if lastSyncTime && !isSyncing}
          <span class="text-xs text-gray-500">Last sync: {lastSyncTime}</span>
        {/if}
      </div>
      
      <div class="flex items-center gap-2">
        {#if isOnline && !isSyncing}
          <button
            on:click={forceSync}
            class="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded transition-colors"
          >
            Sync Now
          </button>
        {/if}
        
        <div class="text-xs text-gray-500">
          🔒 Auto-backup enabled
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="relative z-10 p-3 space-y-4 max-w-4xl mx-auto">
    <!-- Sleep Panel -->
    <SleepPanel onWakeStateChange={handleWakeStateChange} />
    
    <!-- Hydration Matrix Panel -->
    <HydrationMatrix />
    
    <!-- TaskMaster Panel -->
    <TaskMaster onClick={openTaskMaster} />
    
    <!-- Data Privacy Notice -->
    <div class="mt-8 p-4 bg-gray-900/30 backdrop-blur-sm rounded-xl border border-gray-700/30">
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="text-sm font-semibold text-blue-400 mb-1">Your Data is Secure</h4>
          <p class="text-xs text-gray-400 leading-relaxed">
            All your hydration, sleep, and task data is automatically encrypted and synced to Firebase Cloud. 
            Your personal information stays private and is only accessible to you. Data is backed up daily 
            and you can access it from any device.
          </p>
          <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>✅ End-to-end encryption</span>
            <span>✅ Daily backups</span>
            <span>✅ Cross-device sync</span>
            <span>✅ Offline capable</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Quick Stats Overview -->
    <div class="grid grid-cols-2 gap-4 mt-6">
      <div class="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30">
        <h4 class="text-sm font-semibold text-gray-300 mb-2">Today's Progress</h4>
        <div class="space-y-2">
          <div class="flex justify-between text-xs">
            <span class="text-gray-400">Hydration</span>
            <span class="text-blue-400 font-medium">Track in Matrix</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-gray-400">Sleep Quality</span>
            <span class="text-purple-400 font-medium">Monitor Active</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-gray-400">Tasks</span>
            <span class="text-green-400 font-medium">TaskMaster Ready</span>
          </div>
        </div>
      </div>
      
      <div class="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 border border-gray-700/30">
        <h4 class="text-sm font-semibold text-gray-300 mb-2">System Status</h4>
        <div class="space-y-2">
          <div class="flex justify-between text-xs">
            <span class="text-gray-400">Cloud Sync</span>
            <span class="text-green-400 font-medium">{isOnline ? 'Active' : 'Offline'}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-gray-400">Auto-backup</span>
            <span class="text-green-400 font-medium">Enabled</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-gray-400">Data Security</span>
            <span class="text-green-400 font-medium">Protected</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Background Effects -->
  <div class="fixed inset-0 pointer-events-none">
    <!-- Ambient glow effects -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-3xl"></div>
  </div>
</div>