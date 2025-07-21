<script lang="ts">
  import AnimatedHeader from "$lib/components/AnimatedHeader.svelte";
  import Particles from "$lib/components/Particles.svelte";
  import CreateTaskModal from "$lib/components/CreateTaskModal.svelte";
  import TaskCard from "$lib/components/TaskCard.svelte";
  import TaskLogs from "$lib/components/TaskLogs.svelte";
  import TaskAnalytics from "$lib/components/TaskAnalytics.svelte";
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { FirebaseStorage } from '$lib/firebase.ts';

  interface Task {
    id: number;
    title: string;
    description: string;
    priority: 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C';
    goalCount: number;
    energyRequired: number;
    schedule: 'flexible' | 'fixed' | 'after_wake';
    recurrence: 'once' | 'daily' | 'custom';
    duration: number;
    fixedTime?: string | null;
    afterWakeTime?: { hours: number; minutes: number } | null;
    startDate?: string | null;
    dueDate?: string | null;
    customDays?: boolean[] | null;
    currentProgress: number;
    completed: boolean;
    createdAt: Date;
    resetDaily: boolean;
    completedAt?: Date;
    actualDuration?: number;
    skippedToday?: boolean;
  }

  let showTaskModal = false;
  let showLogs = false;
  let showAnalytics = false;
  let tasks: Task[] = [];
  let isAwake = true;
  let lastResetDate = '';
  let lastWakeReset = '';
  let isOnline = true;
  let lastSyncTime = '';
  let isSyncing = false;
  
  // Add reactive counter to force updates
  let updateCounter = 0;

  const STORAGE_KEY = 'taskmaster_tasks';
  const WAKE_KEY = 'mindctrl_wake_state';

  function goBack(): void {
    goto('/');
  }

  function openTaskModal(): void {
    console.log('Opening task modal');
    showTaskModal = true;
  }

  function openLogs(): void {
    showLogs = true;
  }

  function openAnalytics(): void {
    showAnalytics = true;
  }

  async function handleTaskCreated(event: CustomEvent<Task>): Promise<void> {
    console.log('handleTaskCreated called with event:', event);
    
    const newTask = event.detail;
    console.log('New task received:', newTask);
    
    // Create completely new array to trigger reactivity
    tasks = [...tasks, newTask];
    updateCounter++;
    console.log('Tasks after assignment:', tasks.length, 'tasks');
    
    await saveTasks();
    console.log('Tasks saved to cloud and localStorage');
  }

  async function handleTaskClick(taskId: number): Promise<void> {
    console.log('Task clicked:', taskId);
    
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;
    
    const completedAt = new Date();
    const actualDuration = Math.floor((completedAt.getTime() - new Date(task.createdAt).getTime()) / (1000 * 60));
    
    // Create new array with updated task
    tasks = tasks.map(t => {
      if (t.id === taskId) {
        if (t.goalCount === 1) {
          // Single goal - complete immediately
          console.log(`Completing single-goal task: ${t.title}`);
          return { ...t, completed: true, currentProgress: 1, completedAt, actualDuration };
        } else {
          // Multi-goal - increment progress
          const newProgress = t.currentProgress + 1;
          console.log(`Updating multi-goal task: ${t.title}, progress: ${t.currentProgress} -> ${newProgress}`);
          
          if (newProgress >= t.goalCount) {
            console.log(`Completing multi-goal task: ${t.title}`);
            return { ...t, completed: true, currentProgress: newProgress, completedAt, actualDuration };
          }
          return { ...t, currentProgress: newProgress };
        }
      }
      return t;
    });
    
    updateCounter++;
    
    // Save task completion to Firebase
    if (task.completed || task.currentProgress >= task.goalCount) {
      await FirebaseStorage.saveTaskCompletion(taskId, {
        taskTitle: task.title,
        taskPriority: task.priority,
        completedAt,
        actualDuration,
        goalCount: task.goalCount,
        finalProgress: task.currentProgress
      });
    }
    
    await saveTasks();
    console.log('Task updated and saved');
  }

  async function handleDeleteTask(taskId: number): Promise<void> {
    console.log('Task deleted:', taskId);
    tasks = tasks.filter(task => task.id !== taskId);
    updateCounter++;
    await saveTasks();
  }

  async function handleTaskLongPress(taskId: number, options: {delete: boolean, skip: boolean, edit: boolean}): Promise<void> {
    console.log('Task long press:', taskId, options);
    
    if (options.delete) {
      await handleDeleteTask(taskId);
    } else if (options.skip) {
      // Skip for today - mark as completed but reset tomorrow
      tasks = tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, completed: true, skippedToday: true, completedAt: new Date() };
        }
        return task;
      });
      updateCounter++;
      await saveTasks();
    } else if (options.edit) {
      // TODO: Open edit modal
      console.log('Edit task:', taskId);
    }
  }

  async function saveTasks(): Promise<void> {
    console.log('Saving tasks:', tasks.length, 'tasks');
    isSyncing = true;
    
    try {
      // Save to Firebase
      const success = await FirebaseStorage.saveTasks(tasks);
      if (success) {
        lastSyncTime = new Date().toLocaleTimeString();
        console.log('Tasks synced to cloud');
      }
      
      // Always save to localStorage as backup
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    } finally {
      isSyncing = false;
    }
  }

  async function loadTasks(): Promise<void> {
    try {
      // Try to load from Firebase first
      const cloudTasks = await FirebaseStorage.getItem(STORAGE_KEY);
      
      if (cloudTasks) {
        console.log('Tasks loaded from cloud:', cloudTasks.length, 'tasks');
        tasks = cloudTasks;
        lastSyncTime = new Date().toLocaleTimeString();
        updateCounter++;
        return;
      }
    } catch (error) {
      console.error('Error loading from cloud, trying localStorage:', error);
    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    console.log('Loading tasks from localStorage:', saved ? 'Found data' : 'No data');
    if (saved) {
      try {
        const parsedTasks = JSON.parse(saved);
        console.log('Parsed tasks:', parsedTasks.length, 'tasks loaded');
        tasks = parsedTasks;
        updateCounter++;
      } catch (error) {
        console.error('Error loading tasks:', error);
        tasks = [];
      }
    }
  }

  async function saveWakeState(): Promise<void> {
    const wakeState = {
      isAwake,
      lastResetDate,
      lastWakeReset
    };
    
    // Save to Firebase
    await FirebaseStorage.setItem(WAKE_KEY, wakeState);
    
    // Save to localStorage as backup
    localStorage.setItem(WAKE_KEY, JSON.stringify(wakeState));
  }

  async function loadWakeState(): Promise<void> {
    try {
      // Try Firebase first
      const cloudState = await FirebaseStorage.getItem(WAKE_KEY);
      if (cloudState) {
        isAwake = cloudState.isAwake ?? true;
        lastResetDate = cloudState.lastResetDate || '';
        lastWakeReset = cloudState.lastWakeReset || '';
        return;
      }
    } catch (error) {
      console.error('Error loading wake state from cloud:', error);
    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem(WAKE_KEY);
    if (saved) {
      try {
        const wakeState = JSON.parse(saved);
        isAwake = wakeState.isAwake ?? true;
        lastResetDate = wakeState.lastResetDate || '';
        lastWakeReset = wakeState.lastWakeReset || '';
      } catch (error) {
        console.error('Error loading wake state:', error);
      }
    }
  }

  function checkMidnightReset(): void {
    const today = new Date().toDateString();
    if (lastResetDate !== today) {
      resetDailyTasks('midnight');
      lastResetDate = today;
      saveWakeState();
    }
  }

  async function resetDailyTasks(resetType: 'midnight' | 'wake'): Promise<void> {
    console.log(`Resetting daily tasks: ${resetType}`);
    
    tasks = tasks.map(task => {
      // Handle "once" tasks - archive them after completion
      if (task.recurrence === 'once' && task.completed && resetType === 'midnight') {
        return task;
      }
      
      // Reset daily tasks at midnight
      if (task.recurrence === 'daily' && resetType === 'midnight') {
        return { ...task, currentProgress: 0, completed: false, skippedToday: false };
      }
      
      // Reset after-wake tasks when waking up
      if ((task.schedule === 'after_wake' || task.recurrence === 'daily') && resetType === 'wake') {
        return { ...task, currentProgress: 0, completed: false, skippedToday: false };
      }
      
      return task;
    });
    
    // Remove completed "once" tasks after a day
    if (resetType === 'midnight') {
      tasks = tasks.filter(task => {
        if (task.recurrence === 'once' && task.completed) {
          const completedDate = new Date(task.createdAt).toDateString();
          const today = new Date().toDateString();
          return completedDate === today;
        }
        return true;
      });
    }
    
    updateCounter++;
    await saveTasks();
  }

  // Check if task should be available today
  function isTaskAvailableToday(task: Task): boolean {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayIndex = today === 0 ? 6 : today - 1; // Convert to Monday = 0 index
    
    // Handle future start dates
    if (task.startDate) {
      const startDate = new Date(task.startDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      if (startDate > now) {
        return false;
      }
    }
    
    // Handle custom day selection ONLY for custom recurrence
    if (task.recurrence === 'custom' && task.customDays) {
      return task.customDays[mondayIndex];
    }
    
    // Show 'once' and 'daily' tasks by default
    return true;
  }

  // Filter and sort tasks based on current day and priority
  function getVisibleTasks(taskList: Task[]): Task[] {
    const filtered = taskList.filter(task => {
      return true; // Show all tasks, handle availability in component
    });
    
    // Sort by priority: SSS -> SS -> S -> A -> B -> C
    const priorityOrder = { 'SSS': 0, 'SS': 1, 'S': 2, 'A': 3, 'B': 4, 'C': 5 };
    const sorted = filtered.sort((a, b) => {
      // Available tasks first, then unavailable
      const aAvailable = isTaskAvailableToday(a);
      const bAvailable = isTaskAvailableToday(b);
      
      if (aAvailable && !bAvailable) return -1;
      if (!aAvailable && bAvailable) return 1;
      
      // Within same availability, completed tasks go to bottom
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      
      // Sort by priority
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    console.log(`Filtering ${taskList.length} total tasks -> ${sorted.length} visible tasks`);
    return sorted;
  }

  // Calculate stats
  function getStats() {
    const availableTasks = tasks.filter(task => isTaskAvailableToday(task));
    const completedTasks = availableTasks.filter(task => task.completed);
    const totalDuration = availableTasks.reduce((sum, task) => sum + task.duration, 0);
    const completedDuration = completedTasks.reduce((sum, task) => sum + task.duration, 0);
    const freeTime = Math.max(0, (16 * 60) - totalDuration); // 16 hours in minutes
    
    return {
      totalTasks: tasks.length,
      availableTasks: availableTasks.length,
      completedTasks: completedTasks.length,
      progressPercentage: availableTasks.length > 0 ? Math.round((completedTasks.length / availableTasks.length) * 100) : 0,
      totalDuration: Math.round(totalDuration / 60 * 10) / 10, // hours with 1 decimal
      completedDuration: Math.round(completedDuration / 60 * 10) / 10,
      freeTime: Math.round(freeTime / 60 * 10) / 10
    };
  }

  // Force sync with cloud
  async function forceSync(): Promise<void> {
    if (isSyncing) return;
    
    isSyncing = true;
    try {
      await FirebaseStorage.syncAllData();
      await loadTasks();
      lastSyncTime = new Date().toLocaleTimeString();
    } catch (error) {
      console.error('Force sync failed:', error);
    } finally {
      isSyncing = false;
    }
  }

  // Check connection status
  function updateOnlineStatus() {
    isOnline = navigator.onLine;
    if (isOnline && !isSyncing) {
      // Auto-sync when coming back online
      setTimeout(forceSync, 1000);
    }
  }

  // Make reactivity explicit by including updateCounter
  $: visibleTasks = getVisibleTasks(tasks);
  $: stats = getStats();
  
  // Debug reactive updates
  $: {
    console.log('Reactive update:', { 
      tasksLength: tasks.length, 
      visibleTasksLength: visibleTasks.length, 
      updateCounter,
      stats
    });
  }

  // Handle keyboard navigation
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (showTaskModal) {
        showTaskModal = false;
      } else if (showLogs) {
        showLogs = false;
      } else if (showAnalytics) {
        showAnalytics = false;
      } else {
        goBack();
      }
    }
  }

  // Handle touch gestures for mobile
  let touchStartX = 0;
  let touchStartY = 0;

  function handleTouchStart(event: TouchEvent): void {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }

  function handleTouchEnd(event: TouchEvent): void {
    if (!event.changedTouches[0]) return;
    
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Check if it's a horizontal swipe (more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 100) {
      // Swipe right to go back
      if (deltaX > 0 && touchStartX < 50) { // Started from left edge
        if (showLogs) {
          showLogs = false;
        } else if (showAnalytics) {
          showAnalytics = false;
        } else if (!showTaskModal) {
          goBack();
        }
      }
    }
  }

  onMount(() => {
    loadTasks();
    loadWakeState();
    checkMidnightReset();
    
    // Monitor connection status
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    
    // Check for midnight reset every minute
    const resetInterval = setInterval(checkMidnightReset, 60000);
    
    // Auto-sync every 2 minutes when online
    const syncInterval = setInterval(() => {
      if (isOnline && !isSyncing) {
        forceSync();
      }
    }, 120000);
    
    // Add keyboard listener
    document.addEventListener('keydown', handleKeydown);
    
    // Add touch listeners for mobile swipe gestures
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      clearInterval(resetInterval);
      clearInterval(syncInterval);
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  });
</script>

<svelte:head>
  <title>TaskMaster - MindCTRL</title>
  <meta name="description" content="Advanced task management system with cloud sync" />
</svelte:head>

<div class="min-h-screen text-white relative overflow-hidden taskmaster-bg">
  <!-- Custom Mesh Gradient Background -->
  <div class="fixed inset-0 taskmaster-mesh"></div>
  
  <!-- Particles Background -->
  <div class="fixed inset-0">
    <Particles
      className="w-full h-full"
      quantity={80}
      color="#ffffff"
      size={0.4}
      staticity={50}
      ease={40}
    />
  </div>

  <!-- Fixed Header -->
  <div class="fixed top-0 left-0 right-0 z-50">
    <AnimatedHeader />
  </div>

  <!-- Main Content Area -->
  <div class="relative z-10 pt-20 pb-32 px-4">
    <div class="max-w-4xl mx-auto">
      
      <!-- Stats Panel with Sync Status -->
      <div class="mb-6 bg-gray-900/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-700/50">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-bold text-white">Daily Progress</h2>
            <div class="flex items-center gap-3">
              <p class="text-sm text-gray-400">{stats.completedTasks}/{stats.availableTasks} tasks • {stats.completedDuration}h/{stats.totalDuration}h</p>
              
              <!-- Sync Status -->
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full {isOnline ? 'bg-green-400' : 'bg-red-400'} {isSyncing ? 'animate-pulse' : ''}"></div>
                <span class="text-xs text-gray-500">
                  {#if isSyncing}
                    Syncing...
                  {:else if isOnline}
                    {lastSyncTime ? `Synced ${lastSyncTime}` : 'Online'}
                  {:else}
                    Offline
                  {/if}
                </span>
                {#if isOnline && !isSyncing}
                  <button 
                    on:click={forceSync}
                    class="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Sync Now
                  </button>
                {/if}
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              class="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-all"
              on:click={openLogs}
            >
            Logs
            </button>
            <button
              class="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition-all"
              on:click={openAnalytics}
            >
            Analytics
            </button>
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="mb-3">
          <div class="w-full bg-gray-700/50 rounded-full h-3">
            <div 
              class="bg-gradient-to-r from-green-500 to-emerald-400 h-3 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
              style="width: {stats.progressPercentage}%"
            >
              {#if stats.progressPercentage > 20}
                <span class="text-xs font-bold text-white">{stats.progressPercentage}%</span>
              {/if}
            </div>
          </div>
        </div>
        
        <!-- Quick Stats -->
        <div class="grid grid-cols-3 gap-3">
          <div class="text-center">
            <p class="text-xs text-gray-400">Free Time</p>
            <p class="text-sm font-bold text-green-400">{stats.freeTime}h</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-400">Completed</p>
            <p class="text-sm font-bold text-blue-400">{stats.completedTasks}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-400">Remaining</p>
            <p class="text-sm font-bold text-orange-400">{stats.availableTasks - stats.completedTasks}</p>
          </div>
        </div>
      </div>
      
      <!-- Tasks with key-based reactivity -->
      <div class="space-y-4">
        {#each visibleTasks as task, index (task.id)}
          {#key `task-${task.id}-${task.currentProgress}-${task.completed}-${updateCounter}`}
            <TaskCard 
              task={{...task, availableToday: isTaskAvailableToday(task)}}
              onTaskClick={handleTaskClick}
              onTaskLongPress={handleTaskLongPress}
            />
          {/key}
        {:else}
          <div class="text-center py-16">
            <div class="text-6xl mb-4 opacity-50">📝</div>
            <p class="text-xl text-gray-400 mb-2">No tasks yet</p>
            <p class="text-sm text-gray-500">Tap "ADD TASK" to create your first task</p>
            {#if !isOnline}
              <p class="text-xs text-orange-400 mt-2">You're offline - tasks will sync when connection is restored</p>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Fixed Footer -->
  <div class="fixed bottom-0 left-0 right-0 z-50">
    <div class="bg-black/70 backdrop-blur-md border-t border-gray-800/50 p-4">
      <div class="max-w-4xl mx-auto">
        <button
          class="w-full py-4 bg-gradient-to-r from-red-600/80 to-purple-600/80 hover:from-red-600 hover:to-purple-600 rounded-xl font-bold text-lg tracking-wide transition-all hover:scale-[1.02] shadow-lg disabled:opacity-50"
          on:click={openTaskModal}
          disabled={isSyncing}
        >
          {isSyncing ? 'SYNCING...' : 'ADD TASK'}
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Task Creation Modal -->
<CreateTaskModal 
  bind:showModal={showTaskModal} 
  on:taskCreated={handleTaskCreated}
/>

<!-- Task Logs Modal -->
{#if showLogs}
  <TaskLogs 
    {tasks}
    onClose={() => showLogs = false}
    onTasksUpdate={(newTasks) => { tasks = newTasks; updateCounter++; saveTasks(); }}
  />
{/if}

<!-- Task Analytics Modal -->
{#if showAnalytics}
  <TaskAnalytics 
    {tasks}
    onClose={() => showAnalytics = false}
  />
{/if}

<style>
  .taskmaster-bg {
    background: #000000;
  }
  
  .taskmaster-mesh {
    background: 
      radial-gradient(circle at 20% 50%, rgba(120, 20, 60, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(80, 30, 120, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(140, 30, 30, 0.12) 0%, transparent 50%),
      radial-gradient(circle at 60% 30%, rgba(70, 30, 140, 0.12) 0%, transparent 50%),
      radial-gradient(circle at 90% 90%, rgba(100, 15, 50, 0.12) 0%, transparent 50%),
      radial-gradient(circle at 10% 10%, rgba(50, 80, 120, 0.12) 0%, transparent 50%),
      linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(15, 15, 15, 0.98) 100%);
    animation: meshMove 25s ease-in-out infinite;
  }
  
  @keyframes meshMove {
    0%, 100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
    33% {
      opacity: 0.8;
      transform: scale(1.05) rotate(0.5deg);
    }
    66% {
      opacity: 0.9;
      transform: scale(0.98) rotate(-0.5deg);
    }
  }
</style>