<script lang="ts">
  import { onMount } from 'svelte';
  import BorderBeam from "./BorderBeam.svelte";
  import WaterBottle from "./WaterBottle.svelte";
  import { FirebaseStorage } from '../firebase.ts';

  // User data
  let userWeight = 0;
  let userHeight = 0;
  let bmi = 0;
  let dailyWaterTarget = 0;
  let waterBottles: number[] = [0, 0, 0, 0]; // Each bottle stores fill level 0-4 (0=empty, 4=1L full)
  let totalConsumed = 0; // Total ml consumed
  let isSetupComplete = false;
  let lastResetDate = '';
  let showSetup = false;
  let isOnline = true;
  let lastSyncTime = '';

  // Temporary input values
  let inputWeight = '';
  let inputHeight = '';

  const STORAGE_KEY = 'hydration_matrix_data';

  async function saveData() {
    const data = {
      userWeight,
      userHeight,
      bmi,
      dailyWaterTarget,
      waterBottles,
      totalConsumed,
      isSetupComplete,
      lastResetDate,
      lastSyncTime: new Date().toISOString()
    };
    
    // Save to Firebase
    const success = await FirebaseStorage.saveHydrationData(data);
    if (success) {
      lastSyncTime = new Date().toLocaleTimeString();
      console.log('Hydration data synced to cloud');
    }
    
    // Always save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  async function loadData() {
    try {
      // Try to load from Firebase first
      const cloudData = await FirebaseStorage.getItem(STORAGE_KEY);
      
      if (cloudData) {
        userWeight = cloudData.userWeight || 0;
        userHeight = cloudData.userHeight || 0;
        bmi = cloudData.bmi || 0;
        dailyWaterTarget = cloudData.dailyWaterTarget || 0;
        waterBottles = cloudData.waterBottles || [0, 0, 0, 0];
        totalConsumed = cloudData.totalConsumed || 0;
        isSetupComplete = cloudData.isSetupComplete || false;
        lastResetDate = cloudData.lastResetDate || '';
        lastSyncTime = cloudData.lastSyncTime ? new Date(cloudData.lastSyncTime).toLocaleTimeString() : '';
        
        console.log('Hydration data loaded from cloud');
        return;
      }
    } catch (error) {
      console.error('Error loading from cloud, trying localStorage:', error);
    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        userWeight = data.userWeight || 0;
        userHeight = data.userHeight || 0;
        bmi = data.bmi || 0;
        dailyWaterTarget = data.dailyWaterTarget || 0;
        waterBottles = data.waterBottles || [0, 0, 0, 0];
        totalConsumed = data.totalConsumed || 0;
        isSetupComplete = data.isSetupComplete || false;
        lastResetDate = data.lastResetDate || '';
        console.log('Hydration data loaded from localStorage');
      } catch (error) {
        console.error('Error loading hydration data:', error);
        waterBottles = [0, 0, 0, 0];
        totalConsumed = 0;
      }
    }
  }

  function checkDailyReset() {
    const today = new Date().toDateString();
    if (lastResetDate !== today) {
      resetDailyProgress();
      lastResetDate = today;
      saveData();
    }
  }

  function resetDailyProgress() {
    waterBottles = [0, 0, 0, 0];
    totalConsumed = 0;
  }

  async function calculateHydration() {
    if (inputWeight && inputHeight) {
      const weight = parseFloat(inputWeight);
      const height = parseFloat(inputHeight);
      
      if (weight > 0 && height > 0) {
        userWeight = weight;
        userHeight = height;
        bmi = weight / ((height / 100) ** 2);
        
        // Calculate water target: 35ml per kg of body weight
        const targetInML = weight * 35;
        dailyWaterTarget = Math.ceil(targetInML / 1000 * 10) / 10; // Round up to 0.1L
        
        waterBottles = [0, 0, 0, 0];
        totalConsumed = 0;
        
        isSetupComplete = true;
        showSetup = false;
        inputWeight = '';
        inputHeight = '';
        await saveData();
      }
    }
  }

  async function drinkFromBottle(bottleIndex: number) {
    if (waterBottles[bottleIndex] < 4) {
      const newBottles = [...waterBottles];
      newBottles[bottleIndex] = newBottles[bottleIndex] + 1;
      waterBottles = newBottles;
      totalConsumed += 250;
      await saveData();
    }
  }

  function openSetup() {
    showSetup = true;
    inputWeight = userWeight.toString();
    inputHeight = userHeight.toString();
  }

  function closeSetup() {
    showSetup = false;
    inputWeight = '';
    inputHeight = '';
  }

  function getBMICategory(): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  function getBMIColor(): string {
    if (bmi < 18.5) return '#60A5FA';
    if (bmi < 25) return '#34D399';
    if (bmi < 30) return '#FBBF24';
    return '#F87171';
  }

  function getProgressPercentage(): number {
    const totalTargetML = 4000;
    return Math.min(100, Math.round((totalConsumed / totalTargetML) * 100));
  }

  function getHydrationStatus(): string {
    const percentage = getProgressPercentage();
    if (percentage === 0) return 'Not Started';
    if (percentage < 25) return 'Getting Started';
    if (percentage < 50) return 'Making Progress';
    if (percentage < 75) return 'Doing Great';
    if (percentage < 100) return 'Almost There';
    return 'Fully Hydrated';
  }

  function getConsumedLiters(): string {
    return (totalConsumed / 1000).toFixed(1);
  }

  function getCompletedBottles(): number {
    return waterBottles.filter(level => level === 4).length;
  }

  // Check connection status
  function updateOnlineStatus() {
    isOnline = navigator.onLine;
  }

  onMount(() => {
    loadData();
    checkDailyReset();
    
    // Check for daily reset every minute
    const resetInterval = setInterval(checkDailyReset, 60000);
    
    // Monitor connection status
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    
    // Auto-save every 30 seconds if there are changes
    const autoSaveInterval = setInterval(() => {
      if (totalConsumed > 0) {
        saveData();
      }
    }, 30000);
    
    return () => {
      clearInterval(resetInterval);
      clearInterval(autoSaveInterval);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  });

  // Reactive statement to ensure UI updates when bottles change
  $: if (waterBottles) {
    totalConsumed = waterBottles.reduce((sum, level) => sum + (level * 250), 0);
  }
</script>

<div class="relative rounded-2xl p-6 bg-gray-900/50 backdrop-blur-sm">
  <BorderBeam size={280} duration={15} colorFrom="#4ECDC4" colorTo="#45B7D1" />
  
  <!-- Header -->
  <div class="flex justify-between items-center mb-6">
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 2L7.5 4.5L10 7L12.5 4.5L10 2zM4.5 7.5L2 10L4.5 12.5L7 10L4.5 7.5zM13 10L15.5 7.5L18 10L15.5 12.5L13 10zM7.5 15.5L10 18L12.5 15.5L10 13L7.5 15.5z" clip-rule="evenodd" />
        </svg>
      </div>
      <div>
        <h3 class="text-xl font-bold">HYDRATION MATRIX</h3>
        {#if isSetupComplete}
          <p class="text-sm text-blue-400">OPTIMAL: {dailyWaterTarget}L DAILY • Weight-Based Target</p>
        {:else}
          <p class="text-sm text-gray-400">Click the pencil to set up your hydration profile</p>
        {/if}
      </div>
    </div>
    
    <div class="flex items-center gap-3">
      <!-- Connection Status -->
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full {isOnline ? 'bg-green-400' : 'bg-red-400'}"></div>
        <span class="text-xs text-gray-400">{isOnline ? 'Online' : 'Offline'}</span>
      </div>
      
      {#if isSetupComplete}
        <div class="bg-gray-800 rounded-lg px-3 py-2">
          <span class="text-2xl font-bold text-white">{getProgressPercentage()}%</span>
        </div>
      {/if}
      <button
        class="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-all hover:scale-105"
        on:click={openSetup}
        aria-label="Edit hydration settings"
      >
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  </div>

  {#if !isSetupComplete}
    <!-- Initial Setup Message -->
    <div class="text-center py-12">
      <div class="text-6xl mb-4">💧</div>
      <h4 class="text-xl font-semibold mb-2">Set Up Your Hydration Profile</h4>
      <p class="text-gray-400 mb-6">Enter your weight and height to get personalized water targets</p>
      <button
        class="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg"
        on:click={openSetup}
      >
        Get Started
      </button>
    </div>
  {:else}
    <!-- Hydration Status -->
    <div class="grid grid-cols-4 gap-3 mb-6">
      <div class="bg-gray-800/50 rounded-xl p-3 text-center">
        <p class="text-xs text-gray-400 mb-1">BMI</p>
        <p class="text-lg font-bold" style="color: {getBMIColor()}">{bmi.toFixed(1)}</p>
        <p class="text-xs text-gray-500">{getBMICategory()}</p>
      </div>
      <div class="bg-gray-800/50 rounded-xl p-3 text-center">
        <p class="text-xs text-gray-400 mb-1">Target</p>
        <p class="text-lg font-bold text-blue-400">{dailyWaterTarget}L</p>
        <p class="text-xs text-gray-500">daily goal</p>
      </div>
      <div class="bg-gray-800/50 rounded-xl p-3 text-center">
        <p class="text-xs text-gray-400 mb-1">Consumed</p>
        <p class="text-lg font-bold text-cyan-400">{getConsumedLiters()}L</p>
        <p class="text-xs text-gray-500">{totalConsumed}ml</p>
      </div>
      <div class="bg-gray-800/50 rounded-xl p-3 text-center">
        <p class="text-xs text-gray-400 mb-1">Status</p>
        <p class="text-sm font-semibold text-green-400">{getHydrationStatus()}</p>
        <p class="text-xs text-gray-500">{getCompletedBottles()}/4</p>
      </div>
    </div>

    <!-- Water Bottles -->
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h4 class="text-lg font-semibold">Daily Progress</h4>
        <span class="text-xs text-gray-400">Tap bottles to add 250ml each</span>
      </div>
      
      <div class="flex justify-center gap-6">
        {#each waterBottles as bottleFillLevel, index}
          <WaterBottle
            fillLevel={bottleFillLevel}
            onClick={() => drinkFromBottle(index)}
          />
        {/each}
      </div>

      <!-- Progress Bar -->
      <div class="w-full bg-gray-700 rounded-full h-4 mt-6">
        <div 
          class="bg-gradient-to-r from-blue-500 to-cyan-400 h-4 rounded-full transition-all duration-500 flex items-center justify-center"
          style="width: {getProgressPercentage()}%"
        >
          {#if getProgressPercentage() > 20}
            <span class="text-xs font-bold text-white">{getConsumedLiters()}L</span>
          {/if}
        </div>
      </div>
      
      <!-- Sync Status -->
      {#if lastSyncTime}
        <div class="text-center">
          <p class="text-xs text-gray-500">Last synced: {lastSyncTime}</p>
        </div>
      {/if}
    </div>

    {#if totalConsumed === 0}
      <!-- Severe Dehydration Warning -->
      <div class="mt-6 p-4 bg-gradient-to-r from-orange-900/50 to-red-900/50 border border-orange-500/30 rounded-xl">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>
            <p class="font-semibold text-orange-300">SEVERE DEHYDRATION • EMERGENCY INTERVENTION</p>
            <p class="text-sm text-orange-200">Start hydrating immediately to maintain optimal health</p>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Setup Modal -->
{#if showSetup}
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold">Hydration Setup</h3>
        <button
          class="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-all"
          on:click={closeSetup}
          aria-label="Close setup modal"
        >
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label for="weight-input" class="block text-sm font-semibold mb-2 text-gray-300">Weight (kg)</label>
          <input
            id="weight-input"
            type="number"
            bind:value={inputWeight}
            class="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="70"
            step="0.1"
          />
        </div>
        
        <div>
          <label for="height-input" class="block text-sm font-semibold mb-2 text-gray-300">Height (cm)</label>
          <input
            id="height-input"
            type="number"
            bind:value={inputHeight}
            class="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-blue-500 focus:outline-none transition-colors"
            placeholder="175"
            step="1"
          />
        </div>

        <button
          class="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          on:click={calculateHydration}
          disabled={!inputWeight || !inputHeight}
        >
          Calculate & Save
        </button>

        <div class="text-xs text-gray-400 text-center">
          <p>Formula: 35ml per kg of body weight</p>
          <p>4 bottles available (1L each) for optimal hydration</p>
          <p class="mt-2 text-green-400">✓ Auto-syncs to cloud</p>
        </div>
      </div>
    </div>
  </div>
{/if}