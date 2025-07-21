<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { FirebaseStorage } from '../firebase.ts';

  export let showModal = false;

  const dispatch = createEventDispatcher();

  // Form data
  let title = '';
  let description = '';
  let priority: 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C' = 'A';
  let goalCount = 1;
  let energyRequired = 5;
  let schedule: 'flexible' | 'fixed' | 'after_wake' = 'flexible';
  let recurrence: 'once' | 'daily' | 'custom' = 'daily';
  let duration = 30;
  let fixedTime = '';
  let afterWakeHours = 0;
  let afterWakeMinutes = 30;
  let startDate = '';
  let dueDate = '';
  let customDays = [true, true, true, true, true, false, false]; // Mon-Sun
  let isCreating = false;

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function resetForm() {
    title = '';
    description = '';
    priority = 'A';
    goalCount = 1;
    energyRequired = 5;
    schedule = 'flexible';
    recurrence = 'daily';
    duration = 30;
    fixedTime = '';
    afterWakeHours = 0;
    afterWakeMinutes = 30;
    startDate = '';
    dueDate = '';
    customDays = [true, true, true, true, true, false, false];
    isCreating = false;
  }

  function closeModal() {
    showModal = false;
    resetForm();
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    
    isCreating = true;
    
    try {
      const now = new Date();
      const taskId = Date.now() + Math.random() * 1000;
      
      const newTask = {
        id: Math.floor(taskId),
        title: title.trim(),
        description: description.trim(),
        priority,
        goalCount: Math.max(1, goalCount),
        energyRequired: Math.max(1, Math.min(10, energyRequired)),
        schedule,
        recurrence,
        duration: Math.max(5, duration),
        fixedTime: schedule === 'fixed' ? fixedTime : null,
        afterWakeTime: schedule === 'after_wake' ? { hours: afterWakeHours, minutes: afterWakeMinutes } : null,
        startDate: startDate || null,
        dueDate: dueDate || null,
        customDays: recurrence === 'custom' ? [...customDays] : null,
        currentProgress: 0,
        completed: false,
        createdAt: now,
        resetDaily: recurrence === 'daily'
      };

      console.log('Creating new task:', newTask);
      
      // Log task creation to Firebase
      await FirebaseStorage.saveTaskCompletion(`task_created_${newTask.id}`, {
        taskTitle: newTask.title,
        taskPriority: newTask.priority,
        createdAt: now,
        type: 'task_creation',
        goalCount: newTask.goalCount,
        duration: newTask.duration,
        schedule: newTask.schedule,
        recurrence: newTask.recurrence
      });

      dispatch('taskCreated', newTask);
      console.log('Task creation event dispatched');
      
      closeModal();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      isCreating = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    } else if (event.key === 'Enter' && event.ctrlKey) {
      handleSubmit();
    }
  }

  // Format time for fixed schedule
  function formatFixedTime() {
    if (!fixedTime) return '';
    const [hours, minutes] = fixedTime.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const period = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${period}`;
  }

  // Validate form
  $: isValid = title.trim().length > 0 && 
               duration >= 5 && 
               goalCount >= 1 && 
               energyRequired >= 1 && energyRequired <= 10 &&
               (schedule !== 'fixed' || fixedTime) &&
               (schedule !== 'after_wake' || (afterWakeHours >= 0 && afterWakeMinutes >= 0));

  $: if (showModal) {
    document.addEventListener('keydown', handleKeydown);
  } else {
    document.removeEventListener('keydown', handleKeydown);
  }
</script>

{#if showModal}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" on:click={closeModal}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl" on:click|stopPropagation>
      
      <!-- Header -->
      <div class="sticky top-0 bg-gray-900 p-6 border-b border-gray-700 rounded-t-2xl">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
            Create New Task
          </h2>
          <button
            class="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-xl flex items-center justify-center transition-all hover:scale-105"
            on:click={closeModal}
            aria-label="Close modal"
          >
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Form Content -->
      <div class="p-6 space-y-6">
        
        <!-- Basic Info -->
        <div class="space-y-4">
          <div>
            <label for="task-title" class="block text-sm font-semibold mb-2 text-gray-300">Task Title *</label>
            <input
              id="task-title"
              type="text"
              bind:value={title}
              class="w-full p-4 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-purple-500 focus:outline-none transition-colors text-lg"
              placeholder="Enter your task..."
              maxlength="100"
              disabled={isCreating}
            />
            <div class="text-xs text-gray-500 mt-1">{title.length}/100 characters</div>
          </div>
          
          <div>
            <label for="task-description" class="block text-sm font-semibold mb-2 text-gray-300">Description</label>
            <textarea
              id="task-description"
              bind:value={description}
              class="w-full p-4 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-purple-500 focus:outline-none transition-colors resize-none"
              placeholder="Optional description..."
              rows="3"
              maxlength="500"
              disabled={isCreating}
            ></textarea>
            <div class="text-xs text-gray-500 mt-1">{description.length}/500 characters</div>
          </div>
        </div>

        <!-- Priority & Goals -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-semibold mb-2 text-gray-300">Priority</label>
            <select
              bind:value={priority}
              class="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-purple-500 focus:outline-none transition-colors"
              disabled={isCreating}
            >
              <option value="SSS">SSS - Ultra Critical</option>
              <option value="SS">SS - Very High</option>
              <option value="S">S - High</option>
              <option value="A">A - Medium</option>
              <option value="B">B - Low</option>
              <option value="C">C - Optional</option>
            </select>
          </div>
          
          <div>
            <label for="goal-count" class="block text-sm font-semibold mb-2 text-gray-300">Goal Count</label>
            <input
              id="goal-count"
              type="number"
              bind:value={goalCount}
              min="1"
              max="50"
              class="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-purple-500 focus:outline-none transition-colors"
              disabled={isCreating}
            />
            <div class="text-xs text-gray-500 mt-1">1 = single task, >1 = progress tracker</div>
          </div>
          
          <div>
            <label for="energy-required" class="block text-sm font-semibold mb-2 text-gray-300">Energy Required</label>
            <input
              id="energy-required"
              type="number"
              bind:value={energyRequired}
              min="1"
              max="10"
              class="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-purple-500 focus:outline-none transition-colors"
              disabled={isCreating}
            />
            <div class="text-xs text-gray-500 mt-1">1-10 scale</div>
          </div>
        </div>

        <!-- Duration -->
        <div>
          <label for="duration" class="block text-sm font-semibold mb-2 text-gray-300">Duration (minutes)</label>
          <input
            id="duration"
            type="number"
            bind:value={duration}
            min="5"
            max="480"
            step="5"
            class="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-purple-500 focus:outline-none transition-colors"
            disabled={isCreating}
          />
          <div class="text-xs text-gray-500 mt-1">Estimated time to complete (5-480 minutes)</div>
        </div>

        <!-- Schedule -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-2 text-gray-300">Schedule Type</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                class="p-3 rounded-xl border-2 transition-all {schedule === 'flexible' ? 'border-purple-500 bg-purple-500/20' : 'border-gray-600 bg-gray-800'}"
                on:click={() => schedule = 'flexible'}
                disabled={isCreating}
              >
                <div class="text-sm font-medium">Flexible</div>
                <div class="text-xs text-gray-400">Anytime</div>
              </button>
              <button
                type="button"
                class="p-3 rounded-xl border-2 transition-all {schedule === 'fixed' ? 'border-purple-500 bg-purple-500/20' : 'border-gray-600 bg-gray-800'}"
                on:click={() => schedule = 'fixed'}
                disabled={isCreating}
              >
                <div class="text-sm font-medium">Fixed Time</div>
                <div class="text-xs text-gray-400">Specific hour</div>
              </button>
              <button
                type="button"
                class="p-3 rounded-xl border-2 transition-all {schedule === 'after_wake' ? 'border-purple-500 bg-purple-500/20' : 'border-gray-600 bg-gray-800'}"
                on:click={() => schedule = 'after_wake'}
                disabled={isCreating}
              >
                <div class="text-sm font-medium">After Wake</div>
                <div class="text-xs text-gray-400">Relative to waking</div>
              </button>
            </div>
          </div>

          <!-- Fixed Time Input -->
          {#if schedule === 'fixed'}
            <div>
              <label for="fixed-time" class="block text-sm font-semibold mb-2 text-gray-300">Fixed Time</label>
              <input
                id="fixed-time"
                type="time"
                bind:value={fixedTime}
                class="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-purple-500 focus:outline-none transition-colors"
                disabled={isCreating}
              />
              {#if fixedTime}
                <div class="text-xs text-green-400 mt-1">Scheduled for {formatFixedTime()}</div>
              {/if}
            </div>
          {/if}

          <!-- After Wake Input -->
          {#if schedule === 'after_wake'}
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="wake-hours" class="block text-sm font-semibold mb-2 text-gray-300">Hours After Wake</label>
                <input
                  id="wake-hours"
                  type="number"
                  bind:value={afterWakeHours}
                  min="0"
                  max="16"
                  class="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-purple-500 focus:outline-none transition-colors"
                  disabled={isCreating}
                />
              </div>
              <div>
                <label for="wake-minutes" class="block text-sm font-semibold mb-2 text-gray-300">Minutes After Wake</label>
                <input
                  id="wake-minutes"
                  type="number"
                  bind:value={afterWakeMinutes}
                  min="0"
                  max="59"
                  step="5"
                  class="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-purple-500 focus:outline-none transition-colors"
                  disabled={isCreating}
                />
              </div>
            </div>
            <div class="text-xs text-green-400">Task will appear {afterWakeHours}h {afterWakeMinutes}m after waking up</div>
          {/if}
        </div>

        <!-- Recurrence -->
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-2 text-gray-300">Recurrence</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                class="p-3 rounded-xl border-2 transition-all {recurrence === 'once' ? 'border-purple-500 bg-purple-500/20' : 'border-gray-600 bg-gray-800'}"
                on:click={() => recurrence = 'once'}
                disabled={isCreating}
              >
                <div class="text-sm font-medium">Once</div>
                <div class="text-xs text-gray-400">Single task</div>
              </button>
              <button
                type="button"
                class="p-3 rounded-xl border-2 transition-all {recurrence === 'daily' ? 'border-purple-500 bg-purple-500/20' : 'border-gray-600 bg-gray-800'}"
                on:click={() => recurrence = 'daily'}
                disabled={isCreating}
              >
                <div class="text-sm font-medium">Daily</div>
                <div class="text-xs text-gray-400">Every day</div>
              </button>
              <button
                type="button"
                class="p-3 rounded-xl border-2 transition-all {recurrence === 'custom' ? 'border-purple-500 bg-purple-500/20' : 'border-gray-600 bg-gray-800'}"
                on:click={() => recurrence = 'custom'}
                disabled={isCreating}
              >
                <div class="text-sm font-medium">Custom</div>
                <div class="text-xs text-gray-400">Select days</div>
              </button>
            </div>
          </div>

          <!-- Custom Days Selection -->
          {#if recurrence === 'custom'}
            <div>
              <label class="block text-sm font-semibold mb-2 text-gray-300">Select Days</label>
              <div class="grid grid-cols-7 gap-2">
                {#each dayNames as day, index}
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { FirebaseStorage } from '../firebase.ts';
  
  export let showModal = false;
  
  const dispatch = createEventDispatcher();
  
  type Priority = 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C';
  type Schedule = 'flexible' | 'fixed' | 'after_wake';
  type Recurrence = 'once' | 'daily' | 'custom';
  
  // Task data
  let title = '';
  let description = '';
  let priority: Priority = 'A';
  let goalCount = '';
  let energyRequired = 50; // 0-100 percentage
  let schedule: Schedule = 'flexible';
  let recurrence: Recurrence = 'once';
  let durationHours = 0;
  let durationMinutes = 30;
  let fixedTime = '08:00';
  let afterWakeHours = 2;
  let afterWakeMinutes = 30;
  let startDate = '';
  let dueDate = '';
  let customDays = [true, true, true, true, true, true, true]; // Mon-Sun
  
  // UI state
  let showPriorityDropdown = false;
  let showFixedTimePicker = false;
  let showAfterWakeTimePicker = false;
  let showStartDatePicker = false;
  let showDueDatePicker = false;
  let showDurationPicker = false;
  let showCustomDaysPicker = false;
  let isCreating = false;
  let isOnline = true;
  
  const priorities = [
    { value: 'SSS', label: 'SSS', color: '#FF3B30', description: 'Life-changing', bgColor: 'bg-red-500' },
    { value: 'SS', label: 'SS', color: '#FF9500', description: 'Ultra critical', bgColor: 'bg-orange-500' },
    { value: 'S', label: 'S', color: '#FFCC00', description: 'Very important', bgColor: 'bg-yellow-500' },
    { value: 'A', label: 'A', color: '#34C759', description: 'Important', bgColor: 'bg-green-500' },
    { value: 'B', label: 'B', color: '#007AFF', description: 'Normal', bgColor: 'bg-blue-500' },
    { value: 'C', label: 'C', color: '#8E8E93', description: 'Optional', bgColor: 'bg-gray-500' }
  ];
  
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayAbbreviations = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  function capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  function handleTitleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    title = capitalizeFirst(target.value);
  }
  
  function handleDescriptionInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    description = capitalizeFirst(target.value);
  }
  
  function getEnergyColor(): string {
    if (energyRequired >= 90) return '#FF3B30'; // Red
    if (energyRequired >= 80) return '#FF6B00'; // Red-Orange
    if (energyRequired >= 70) return '#FF9500'; // Orange  
    if (energyRequired >= 60) return '#FFCC00'; // Yellow-Orange
    if (energyRequired >= 50) return '#FFD60A'; // Yellow
    if (energyRequired >= 40) return '#A7F43D'; // Yellow-Green
    if (energyRequired >= 30) return '#32D74B'; // Green
    if (energyRequired >= 20) return '#34C759'; // Light Green
    if (energyRequired >= 10) return '#8E8E93'; // Gray-Green
    return '#6D6D70'; // Gray
  }
  
  function getPriorityInfo() {
    return priorities.find(p => p.value === priority) || priorities[3];
  }
  
  function formatAfterWakeTime(): string {
    const hours = afterWakeHours.toString().padStart(2, '0');
    const minutes = afterWakeMinutes.toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  function formatDuration(): string {
    if (durationHours === 0) return `${durationMinutes}min`;
    if (durationMinutes === 0) return `${durationHours}h`;
    return `${durationHours}h ${durationMinutes}min`;
  }
  
  function getSelectedDaysText(): string {
    const selected = customDays.map((selected, index) => selected ? dayAbbreviations[index] : null).filter(Boolean);
    if (selected.length === 7) return 'Every day';
    if (selected.length === 0) return 'No days';
    return selected.join(', ');
  }
  
  function closeModal() {
    showModal = false;
    resetForm();
  }
  
  function resetForm() {
    title = '';
    description = '';
    priority = 'A';
    goalCount = '';
    energyRequired = 50;
    schedule = 'flexible';
    recurrence = 'once';
    durationHours = 0;
    durationMinutes = 30;
    fixedTime = '08:00';
    afterWakeHours = 2;
    afterWakeMinutes = 30;
    startDate = '';
    dueDate = '';
    customDays = [true, true, true, true, true, true, true];
    isCreating = false;
  }
  
  // Check connection status
  function updateOnlineStatus() {
    isOnline = navigator.onLine;
  }
  
  // Initialize connection monitoring
  if (typeof window !== 'undefined') {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
  }
  
  async function createTask() {
    if (!title.trim()) {
      console.log('Task creation failed: No title provided');
      return;
    }
    
    isCreating = true;
    
    try {
      console.log('Creating task with data:', {
        title: title.trim(),
        description: description.trim(),
        priority,
        goalCount,
        energyRequired,
        schedule,
        recurrence,
        duration: durationHours * 60 + durationMinutes
      });
      
      const now = new Date();
      const taskId = Date.now() + Math.random() * 1000;
      
      const newTask = {
        id: Math.floor(taskId),
        title: title.trim(),
        description: description.trim(),
        priority,
        goalCount: parseInt(goalCount) || 1,
        energyRequired,
        schedule,
        recurrence,
        duration: durationHours * 60 + durationMinutes,
        fixedTime: schedule === 'fixed' ? fixedTime : null,
        afterWakeTime: schedule === 'after_wake' ? { hours: afterWakeHours, minutes: afterWakeMinutes } : null,
        startDate: startDate || null,
        dueDate: dueDate || null,
        customDays: recurrence === 'custom' ? customDays : null,
        currentProgress: 0,
        completed: false,
        createdAt: now,
        resetDaily: recurrence === 'daily'
      };
      
      // Log task creation to Firebase (if online)
      if (isOnline) {
        try {
          await FirebaseStorage.saveTaskCompletion(`task_created_${newTask.id}`, {
            taskTitle: newTask.title,
            taskPriority: newTask.priority,
            createdAt: now,
            type: 'task_creation',
            goalCount: newTask.goalCount,
            duration: newTask.duration,
            schedule: newTask.schedule,
            recurrence: newTask.recurrence,
            energyRequired: newTask.energyRequired
          });
          console.log('Task creation logged to Firebase');
        } catch (error) {
          console.error('Failed to log task creation to Firebase:', error);
        }
      }
      
      console.log('Dispatching taskCreated event with:', newTask);
      dispatch('taskCreated', newTask);
      closeModal();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      isCreating = false;
    }
  }
  
  // Validate form
  $: isValid = title.trim().length > 0 && 
               (durationHours > 0 || durationMinutes >= 5) && 
               (schedule !== 'fixed' || fixedTime) &&
               (recurrence !== 'custom' || customDays.some(day => day));
</script>

{#if showModal}
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end justify-center">
    <!-- Main Modal -->
    <div class="w-full max-w-md bg-gray-900/95 backdrop-blur-xl rounded-t-[20px] transform transition-all duration-300 ease-out">
      
      <!-- Header -->
      <div class="flex justify-between items-center px-6 py-4 border-b border-gray-700/50">
        <button class="text-red-400 font-semibold text-[17px]" on:click={closeModal} disabled={isCreating}>
          Cancel
        </button>
        <div class="text-center">
          <h3 class="text-[17px] font-semibold text-white">New Task</h3>
          {#if !isOnline}
            <p class="text-xs text-orange-400">Offline - will sync later</p>
          {/if}
        </div>
        <button 
          class="font-semibold text-[17px] transition-colors disabled:opacity-50 {isValid && !isCreating ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 cursor-not-allowed'}" 
          on:click={createTask}
          disabled={!isValid || isCreating}
        >
          {isCreating ? 'Adding...' : 'Add'}
        </button>
      </div>
      
      <!-- Content -->
      <div class="px-6 py-6 space-y-6 max-h-[75vh] overflow-y-auto">
        
        <!-- Task Title -->
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
            <label for="task-title-input" class="text-white font-semibold">Task Title *</label>
          </div>
          <input
            id="task-title-input"
            type="text"
            value={title}
            on:input={handleTitleInput}
            class="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors text-[16px]"
            placeholder="What needs to be done?"
            maxlength="100"
            disabled={isCreating}
          />
          <div class="text-xs text-gray-500">{title.length}/100 characters</div>
        </div>
        
        <!-- Description -->
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <label for="task-description-input" class="text-white font-semibold">Description</label>
          </div>
          <textarea
            id="task-description-input"
            bind:value={description}
            on:input={handleDescriptionInput}
            class="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors text-[16px] resize-none"
            rows="3"
            placeholder="Add more details..."
            maxlength="300"
            disabled={isCreating}
          ></textarea>
          <div class="text-xs text-gray-500">{description.length}/300 characters</div>
        </div>
        
        <!-- Priority -->
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="text-white font-semibold">Priority</span>
          </div>
          <button
            class="w-full px-4 py-4 bg-gray-800/60 border border-gray-600/30 rounded-xl flex items-center justify-between transition-colors hover:bg-gray-700/60 disabled:opacity-50"
            on:click={() => showPriorityDropdown = true}
            aria-label="Select priority level. Current: {getPriorityInfo().label} - {getPriorityInfo().description}"
            disabled={isCreating}
          >
            <div class="flex items-center gap-3">
              <div class="w-5 h-5 rounded-full {getPriorityInfo().bgColor}"></div>
              <span class="text-white font-medium">{getPriorityInfo().label}</span>
              <span class="text-gray-400 text-sm">{getPriorityInfo().description}</span>
            </div>
            <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        
        <!-- Goal Count -->
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <label for="goal-count-input" class="text-white font-semibold">Goal Count</label>
          </div>
          <input
            id="goal-count-input"
            type="number"
            bind:value={goalCount}
            class="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/30 rounded-xl text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors text-[16px]"
            placeholder="1"
            min="1"
            max="150"
            aria-label="Goal count - number of times to complete this task"
            disabled={isCreating}
          />
          <div class="text-xs text-gray-400">1 = single task, >1 = progress tracker</div>
        </div>
        
        <!-- Energy -->
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
              </svg>
            </div>
            <label for="energy-slider-input" class="text-white font-semibold">Energy Required</label>
          </div>
          <div class="bg-gray-800/60 rounded-xl p-4">
            <input
              id="energy-slider-input"
              type="range"
              min="1"
              max="100"
              bind:value={energyRequired}
              class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer energy-slider"
              style="--energy-color: {getEnergyColor()}; --energy-percent: {energyRequired}%"
              aria-label="Energy required from 1% to 100%. Current: {energyRequired}%"
              disabled={isCreating}
            />
            <div class="flex justify-between items-center mt-3">
              <span class="text-gray-400 text-sm">Low</span>
              <span class="font-bold text-lg" style="color: {getEnergyColor()}">{energyRequired}%</span>
              <span class="text-gray-400 text-sm">High</span>
            </div>
          </div>
        </div>
        
        <!-- Schedule -->
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="text-white font-semibold">Schedule</span>
          </div>
          <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Schedule type">
            <button
              class="px-3 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 {schedule === 'flexible' ? 'bg-blue-500 text-white' : 'bg-gray-800/60 text-gray-300 border border-gray-600/30'}"
              on:click={() => schedule = 'flexible'}
              role="radio"
              aria-checked={schedule === 'flexible'}
              aria-label="Flexible schedule - no specific time"
              disabled={isCreating}
            >
              Flexible
            </button>
            <button
              class="px-3 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 {schedule === 'fixed' ? 'bg-blue-500 text-white' : 'bg-gray-800/60 text-gray-300 border border-gray-600/30'}"
              on:click={() => schedule = 'fixed'}
              role="radio"
              aria-checked={schedule === 'fixed'}
              aria-label="Fixed schedule - specific time"
              disabled={isCreating}
            >
              Fixed
            </button>
            <button
              class="px-3 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 {schedule === 'after_wake' ? 'bg-blue-500 text-white' : 'bg-gray-800/60 text-gray-300 border border-gray-600/30'}"
              on:click={() => schedule = 'after_wake'}
              role="radio"
              aria-checked={schedule === 'after_wake'}
              aria-label="After wake schedule - starts after waking up"
              disabled={isCreating}
            >
              After Wake
            </button>
          </div>
          
          <!-- Fixed Time Selector -->
          {#if schedule === 'fixed'}
            <button
              class="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/30 rounded-xl text-white transition-colors hover:bg-gray-700/60 flex justify-between items-center disabled:opacity-50"
              on:click={() => showFixedTimePicker = true}
              aria-label="Set fixed time. Current: {fixedTime}"
              disabled={isCreating}
            >
              <span>Fixed Time</span>
              <span class="text-blue-400 font-semibold">{fixedTime}</span>
            </button>
          {/if}
          
          <!-- After Wake Time Selector -->
          {#if schedule === 'after_wake'}
            <button
              class="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/30 rounded-xl text-white transition-colors hover:bg-gray-700/60 flex justify-between items-center disabled:opacity-50"
              on:click={() => showAfterWakeTimePicker = true}
              aria-label="Set after wake time. Current: {formatAfterWakeTime()} after waking"
              disabled={isCreating}
            >
              <span>After Wake</span>
              <span class="text-blue-400 font-semibold">{formatAfterWakeTime()} later</span>
            </button>
          {/if}
        </div>
        
        <!-- Recurrence -->
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="text-white font-semibold">Recurrence</span>
          </div>
          <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Recurrence frequency">
            <button
              class="px-3 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 {recurrence === 'once' ? 'bg-purple-500 text-white' : 'bg-gray-800/60 text-gray-300 border border-gray-600/30'}"
              on:click={() => recurrence = 'once'}
              role="radio"
              aria-checked={recurrence === 'once'}
              aria-label="Once - task completes once and is archived"
              disabled={isCreating}
            >
              Once
            </button>
            <button
              class="px-3 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 {recurrence === 'daily' ? 'bg-purple-500 text-white' : 'bg-gray-800/60 text-gray-300 border border-gray-600/30'}"
              on:click={() => recurrence = 'daily'}
              role="radio"
              aria-checked={recurrence === 'daily'}
              aria-label="Daily - task repeats every day"
              disabled={isCreating}
            >
              Daily
            </button>
            <button
              class="px-3 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 {recurrence === 'custom' ? 'bg-purple-500 text-white' : 'bg-gray-800/60 text-gray-300 border border-gray-600/30'}"
              on:click={() => recurrence = 'custom'}
              role="radio"
              aria-checked={recurrence === 'custom'}
              aria-label="Custom - select specific days of the week"
              disabled={isCreating}
            >
              Custom
            </button>
          </div>
          
          <!-- Custom Days Selector -->
          {#if recurrence === 'custom'}
            <button
              class="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/30 rounded-xl text-white transition-colors hover:bg-gray-700/60 flex justify-between items-center disabled:opacity-50"
              on:click={() => showCustomDaysPicker = true}
              aria-label="Select custom days. Current: {getSelectedDaysText()}"
              disabled={isCreating}
            >
              <span>Custom Days</span>
              <span class="text-purple-400 font-semibold text-sm">{getSelectedDaysText()}</span>
            </button>
          {/if}
        </div>
        
        <!-- Duration -->
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="text-white font-semibold">Duration</span>
          </div>
          <button
            class="w-full px-4 py-3 bg-gray-800/60 border border-gray-600/30 rounded-xl text-white transition-colors hover:bg-gray-700/60 flex justify-between items-center disabled:opacity-50"
            on:click={() => showDurationPicker = true}
            aria-label="Set task duration. Current: {formatDuration()}"
            disabled={isCreating}
          >
            <span>Duration</span>
            <span class="text-indigo-400 font-semibold">{formatDuration()}</span>
          </button>
        </div>
        
        <!-- Optional Dates -->
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="text-white font-semibold">Timeline</span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button
              class="px-4 py-3 bg-gray-800/60 border border-gray-600/30 rounded-xl text-white transition-colors hover:bg-gray-700/60 text-left disabled:opacity-50"
              on:click={() => showStartDatePicker = true}
              aria-label="Set start date. Current: {startDate || 'Not set'}"
              disabled={isCreating}
            >
              <div class="text-xs text-gray-400 mb-1">Start Date</div>
              <div class="text-sm font-medium">{startDate || 'Not set'}</div>
            </button>
            <button
              class="px-4 py-3 bg-gray-800/60 border border-gray-600/30 rounded-xl text-white transition-colors hover:bg-gray-700/60 text-left disabled:opacity-50"
              on:click={() => showDueDatePicker = true}
              aria-label="Set due date. Current: {dueDate || 'Not set'}"
              disabled={isCreating}
            >
              <div class="text-xs text-gray-400 mb-1">Due Date</div>
              <div class="text-sm font-medium">{dueDate || 'Not set'}</div>
            </button>
          </div>
        </div>
        
        <!-- Task Summary -->
        <div class="bg-gray-800/40 rounded-xl p-4 border border-gray-600/30">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <h4 class="text-white font-semibold">Task Summary</h4>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-blue-900/40 rounded-lg p-3 border border-blue-500/30">
              <div class="text-xs text-blue-400 mb-1">Priority</div>
              <div class="text-white font-semibold">{getPriorityInfo().label}</div>
            </div>
            <div class="bg-purple-900/40 rounded-lg p-3 border border-purple-500/30">
              <div class="text-xs text-purple-400 mb-1">Goal</div>
              <div class="text-white font-semibold">{goalCount || 1}x</div>
            </div>
            <div class="bg-orange-900/40 rounded-lg p-3 border border-orange-500/30">
              <div class="text-xs text-orange-400 mb-1">Energy</div>
              <div class="text-white font-semibold">{energyRequired}%</div>
            </div>
            <div class="bg-cyan-900/40 rounded-lg p-3 border border-cyan-500/30">
              <div class="text-xs text-cyan-400 mb-1">Schedule</div>
              <div class="text-white font-semibold capitalize">{schedule.replace('_', ' ')}</div>
            </div>
            <div class="bg-purple-900/40 rounded-lg p-3 border border-purple-500/30 col-span-2">
              <div class="text-xs text-purple-400 mb-1">Recurrence</div>
              <div class="text-white font-semibold capitalize">{recurrence === 'custom' ? getSelectedDaysText() : recurrence}</div>
            </div>
          </div>
          
          <!-- Cloud Sync Status -->
          <div class="mt-3 p-2 rounded-lg {isOnline ? 'bg-green-900/40 border border-green-500/30' : 'bg-orange-900/40 border border-orange-500/30'}">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full {isOnline ? 'bg-green-400' : 'bg-orange-400'}"></div>
              <span class="text-xs {isOnline ? 'text-green-400' : 'text-orange-400'}">
                {isOnline ? '✓ Will sync to cloud immediately' : '⚠ Will sync when connection restored'}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Safe area for iOS -->
        <div class="h-4"></div>
      </div>
    </div>
  </div>
{/if}

<!-- Priority Dropdown Modal -->
{#if showPriorityDropdown}
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-gray-900/95 backdrop-blur-xl rounded-2xl overflow-hidden">
      <div class="flex justify-between items-center px-6 py-4 border-b border-gray-700/50">
        <button class="text-red-400 font-semibold" on:click={() => showPriorityDropdown = false}>Cancel</button>
        <h3 class="text-[17px] font-semibold text-white">Select Priority</h3>
        <button class="text-blue-400 font-semibold" on:click={() => showPriorityDropdown = false}>Done</button>
      </div>
      <div class="py-2">
        {#each priorities as prio}
          <button
            class="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-800/50 transition-colors"
            on:click={() => { priority = prio.value as Priority; showPriorityDropdown = false; }}
          >
            <div class="w-8 h-8 rounded-full {prio.bgColor}"></div>
            <div class="flex-1 text-left">
              <div class="text-white font-semibold">{prio.label}</div>
              <div class="text-gray-400 text-sm">{prio.description}</div>
            </div>
            {#if priority === prio.value}
              <svg class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

<!-- Fixed Time Picker Modal -->
{#if showFixedTimePicker}
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-gray-900/95 backdrop-blur-xl rounded-2xl overflow-hidden">
      <div class="flex justify-between items-center px-6 py-4 border-b border-gray-700/50">
        <button class="text-red-400 font-semibold" on:click={() => showFixedTimePicker = false}>Cancel</button>
        <h3 class="text-[17px] font-semibold text-white">Fixed Time</h3>
        <button class="text-blue-400 font-semibold" on:click={() => showFixedTimePicker = false}>Done</button>
      </div>
      <div class="p-6">
        <input
          type="time"
          bind:value={fixedTime}
          class="w-full px-4 py-4 bg-gray-800/60 border border-gray-600/30 rounded-xl text-white text-lg text-center focus:border-blue-500 focus:outline-none"
        />
      </div>
    </div>
  </div>
{/if}

<!-- After Wake Time Picker Modal -->
{#if showAfterWakeTimePicker}
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-gray-900/95 backdrop-blur-xl rounded-2xl overflow-hidden">
      <div class="flex justify-between items-center px-6 py-4 border-b border-gray-700/50">
        <button class="text-red-400 font-semibold" on:click={() => showAfterWakeTimePicker = false}>Cancel</button>
        <h3 class="text-[17px] font-semibold text-white">After Wake Time</h3>
        <button class="text-blue-400 font-semibold" on:click={() => showAfterWakeTimePicker = false}>Done</button>
      </div>
      <div class="p-6 space-y-4">
        <div class="text-center text-gray-400 text-sm mb-4">Start task this many hours after waking up</div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-gray-300 text-sm mb-2" for="wake-hours-slider">Hours</label>
            <input
              id="wake-hours-slider"
              type="range"
              min="0"
              max="23"
              bind:value={afterWakeHours}
              class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer wake-slider"
              aria-label="Hours after waking up"
            />
            <div class="text-center mt-2 text-blue-400 font-bold text-lg">{afterWakeHours}h</div>
          </div>
          <div>
            <label class="block text-gray-300 text-sm mb-2" for="wake-minutes-slider">Minutes</label>
            <input
              id="wake-minutes-slider"
              type="range"
              min="0"
              max="59"
              step="15"
              bind:value={afterWakeMinutes}
              class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer wake-slider"
              aria-label="Minutes after waking up"
            />
            <div class="text-center mt-2 text-blue-400 font-bold text-lg">{afterWakeMinutes}m</div>
          </div>
        </div>
        <div class="text-center text-white font-semibold text-lg bg-gray-800/60 rounded-xl py-3">
          {formatAfterWakeTime()} after wake
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Duration Picker Modal -->
{#if showDurationPicker}
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-gray-900/95 backdrop-blur-xl rounded-2xl overflow-hidden">
      <div class="flex justify-between items-center px-6 py-4 border-b border-gray-700/50">
        <button class="text-red-400 font-semibold" on:click={() => showDurationPicker = false}>Cancel</button>
        <h3 class="text-[17px] font-semibold text-white">Duration</h3>
        <button class="text-blue-400 font-semibold" on:click={() => showDurationPicker = false">Done</button>
      </div>
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-gray-300 text-sm mb-2" for="duration-hours-slider">Hours</label>
            <input
              id="duration-hours-slider"
              type="range"
              min="0"
              max="12"
              bind:value={durationHours}
              class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer duration-slider"
              aria-label="Duration in hours"
            />
            <div class="text-center mt-2 text-indigo-400 font-bold text-lg">{durationHours}h</div>
          </div>
          <div>
            <label class="block text-gray-300 text-sm mb-2" for="duration-minutes-slider">Minutes</label>
            <input
              id="duration-minutes-slider"
              type="range"
              min="0"
              max="59"
              step="5"
              bind:value={durationMinutes}
              class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer duration-slider"
              aria-label="Duration in minutes"
            />
            <div class="text-center mt-2 text-indigo-400 font-bold text-lg">{durationMinutes}m</div>
          </div>
        </div>
        <div class="text-center text-white font-semibold text-lg bg-gray-800/60 rounded-xl py-3">
          Total: {formatDuration()}
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Custom Days Picker Modal -->
{#if showCustomDaysPicker}
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-gray-900/95 backdrop-blur-xl rounded-2xl overflow-hidden">
      <div class="flex justify-between items-center px-6 py-4 border-b border-gray-700/50">
        <button class="text-red-400 font-semibold" on:click={() => showCustomDaysPicker = false}>Cancel</button>
        <h3 class="text-[17px] font-semibold text-white">Custom Days</h3>
        <button class="text-blue-400 font-semibold" on:click={() => showCustomDaysPicker = false}>Done</button>
      </div>
      <div class="p-6 space-y-4">
        {#each dayNames as dayName, index}
          <button
            class="w-full px-4 py-3 rounded-xl flex items-center justify-between transition-colors {customDays[index] ? 'bg-purple-500 text-white' : 'bg-gray-800/60 text-gray-300 border border-gray-600/30'}"
            on:click={() => customDays[index] = !customDays[index]}
          >
            <span class="font-semibold">{dayName}</span>
            {#if customDays[index]}
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </div>
{/if}

<!-- Start Date Picker Modal -->
{#if showStartDatePicker}
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-gray-900/95 backdrop-blur-xl rounded-2xl overflow-hidden">
      <div class="flex justify-between items-center px-6 py-4 border-b border-gray-700/50">
        <button class="text-red-400 font-semibold" on:click={() => showStartDatePicker = false}>Cancel</button>
        <h3 class="text-[17px] font-semibold text-white">Start Date</h3>
        <button class="text-blue-400 font-semibold" on:click={() => showStartDatePicker = false}>Done</button>
      </div>
      <div class="p-6">
        <input
          type="date"
          bind:value={startDate}
          class="w-full px-4 py-4 bg-gray-800/60 border border-gray-600/30 rounded-xl text-white text-lg text-center focus:border-blue-500 focus:outline-none"
          aria-label="Select start date for task"
        />
        <button
          class="w-full mt-3 px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
          on:click={() => { startDate = ''; showStartDatePicker = false; }}
        >
          Clear Date
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Due Date Picker Modal -->
{#if showDueDatePicker}
  <div class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-gray-900/95 backdrop-blur-xl rounded-2xl overflow-hidden">
      <div class="flex justify-between items-center px-6 py-4 border-b border-gray-700/50">
        <button class="text-red-400 font-semibold" on:click={() => showDueDatePicker = false}>Cancel</button>
        <h3 class="text-[17px] font-semibold text-white">Due Date</h3>
        <button class="text-blue-400 font-semibold" on:click={() => showDueDatePicker = false}>Done</button>
      </div>
      <div class="p-6">
        <input
          type="date"
          bind:value={dueDate}
          class="w-full px-4 py-4 bg-gray-800/60 border border-gray-600/30 rounded-xl text-white text-lg text-center focus:border-blue-500 focus:outline-none"
          aria-label="Select due date for task"
        />
        <button
          class="w-full mt-3 px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
          on:click={() => { dueDate = ''; showDueDatePicker = false; }}
        >
          Clear Date
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Energy Slider */
  .energy-slider {
    -webkit-appearance: none;
    appearance: none;
    background: linear-gradient(to right, 
      var(--energy-color) 0%, 
      var(--energy-color) var(--energy-percent), 
      #4B5563 var(--energy-percent), 
      #4B5563 100%);
  }
  
  .energy-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--energy-color);
    cursor: pointer;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    transition: all 0.2s ease;
  }
  
  .energy-slider::-moz-range-thumb {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--energy-color);
    cursor: pointer;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    -moz-appearance: none;
    transition: all 0.2s ease;
  }
  
  .energy-slider::-moz-range-track {
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right, 
      var(--energy-color) 0%, 
      var(--energy-color) var(--energy-percent), 
      #4B5563 var(--energy-percent), 
      #4B5563 100%);
    border: none;
  }
  
  /* Wake and Duration Sliders */
  .wake-slider::-webkit-slider-thumb,
  .duration-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3B82F6;
    cursor: pointer;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
  
  .wake-slider::-moz-range-thumb,
  .duration-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3B82F6;
    cursor: pointer;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    -moz-appearance: none;
  }
  
  /* Custom scrollbar */
  .max-h-\[75vh\]::-webkit-scrollbar {
    width: 4px;
  }
  
  .max-h-\[75vh\]::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .max-h-\[75vh\]::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.3);
    border-radius: 2px;
  }
  
  /* Date and time inputs */
  input[type="date"],
  input[type="time"] {
    color-scheme: dark;
  }
</style>