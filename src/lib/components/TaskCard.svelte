<script lang="ts">
  import ShineBorder from "./ShineBorder.svelte";
  
  export let task: {
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
    availableToday?: boolean;
  };
  
  export let onTaskClick: (taskId: number) => void;
  export let onTaskLongPress: (taskId: number, options: {delete: boolean, skip: boolean, edit: boolean}) => void;
  
  let pressTimer: any;
  let isPressed = false;
  let showContextMenu = false;
  
  function getPriorityColor(): string {
    switch(task.priority) {
      case 'SSS': return '#FF3B30';
      case 'SS': return '#FF9500';
      case 'S': return '#FFCC00';
      case 'A': return '#34C759';
      case 'B': return '#007AFF';
      case 'C': return '#8E8E93';
      default: return '#8E8E93';
    }
  }
  
  function getShineColors(): [string, string] {
    const color = getPriorityColor();
    // Create a slightly lighter version for the second color
    const lighterColor = adjustBrightness(color, 20);
    return [color, lighterColor];
  }
  
  function adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
  
  function formatDuration(): string {
    const hours = Math.floor(task.duration / 60);
    const minutes = task.duration % 60;
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }
  
  function getCompletionText(): { text: string; isOvertime: boolean } {
    if (!task.completed || !task.actualDuration) {
      return { text: '', isOvertime: false };
    }
    
    const plannedMinutes = task.duration;
    const actualMinutes = task.actualDuration;
    const isOvertime = actualMinutes > plannedMinutes;
    
    const hours = Math.floor(actualMinutes / 60);
    const minutes = actualMinutes % 60;
    
    let timeText;
    if (hours === 0) timeText = `${minutes}m`;
    else if (minutes === 0) timeText = `${hours}h`;
    else timeText = `${hours}h ${minutes}m`;
    
    return {
      text: `DONE in ${timeText}`,
      isOvertime
    };
  }
  
  function getProgressPercentage(): number {
    if (task.goalCount === 1) return task.completed ? 100 : 0;
    if (task.goalCount <= 0) return 0;
    return Math.round((task.currentProgress / task.goalCount) * 100);
  }
  
  function getScheduleDisplay(): string {
    if (task.schedule === 'fixed' && task.fixedTime) return task.fixedTime;
    if (task.schedule === 'after_wake' && task.afterWakeTime) {
      const { hours, minutes } = task.afterWakeTime;
      return `${hours}h${minutes}mafterwake`;
    }
    return 'AnyTime';
  }
  
  function handleMouseDown() {
    isPressed = true;
    pressTimer = setTimeout(() => {
      showContextMenu = true;
      isPressed = false;
    }, 800); // 800ms for long press
  }
  
  function handleMouseUp() {
    if (pressTimer) clearTimeout(pressTimer);
    
    if (isPressed && !showContextMenu && !task.completed && task.availableToday !== false) {
      // Regular click only if task is available today
      onTaskClick(task.id);
    }
    isPressed = false;
  }
  
  function handleContextAction(action: 'delete' | 'skip' | 'edit') {
    showContextMenu = false;
    onTaskLongPress(task.id, {
      delete: action === 'delete',
      skip: action === 'skip', 
      edit: action === 'edit'
    });
  }
  
  function getCircleState(): 'empty' | 'plus' | 'checkmark' {
    if (task.completed) return 'checkmark';
    if (task.goalCount > 1 && task.currentProgress > 0) return 'plus';
    return 'empty';
  }
  
  // Reactive statements for immediate updates
  $: priorityColor = getPriorityColor();
  $: [shineFrom, shineTo] = getShineColors();
  $: progressPercentage = getProgressPercentage();
  $: circleState = getCircleState();
  $: completionInfo = getCompletionText();
  $: isMultiGoal = task.goalCount > 1;
  
  // Create a unique reactive key that changes whenever important properties change
  $: reactiveKey = `${task.id}-${task.currentProgress}-${task.completed}-${task.goalCount}`;
  
  // Debug logging with reactive updates
  $: {
    console.log(`TaskCard ${task.id} reactive update:`, {
      title: task.title,
      currentProgress: task.currentProgress,
      goalCount: task.goalCount,
      completed: task.completed,
      progressPercentage,
      circleState,
      reactiveKey
    });
  }
</script>

<div class="relative">
  <!-- Context Menu -->
  {#if showContextMenu}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" on:click={() => showContextMenu = false}>
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="bg-gray-900 rounded-2xl p-4 min-w-[200px]" on:click|stopPropagation>
        <div class="space-y-2">
          <button 
            class="w-full p-3 text-white bg-red-500/20 hover:bg-red-500/30 rounded-xl text-left"
            on:click={() => handleContextAction('delete')}
            type="button"
          >
            🗑️ Delete Task
          </button>
          <button 
            class="w-full p-3 text-white bg-yellow-500/20 hover:bg-yellow-500/30 rounded-xl text-left"
            on:click={() => handleContextAction('skip')}
            type="button"
          >
            ⏭️ Skip for Today
          </button>
          <button 
            class="w-full p-3 text-white bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-left"
            on:click={() => handleContextAction('edit')}
            type="button"
          >
            ✏️ Edit Task
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- TASK CARD WITH SHINEBORDER - ENHANCED REACTIVITY -->
  <div class="relative w-full {task.availableToday === false ? 'opacity-50' : ''}">
    <!-- Not Available Today Overlay -->
    {#if task.availableToday === false}
      <div class="absolute inset-0 z-20 bg-gray-900/80 rounded-2xl flex items-center justify-center">
        <div class="text-center">
          <p class="text-sm font-semibold text-gray-300">Not Scheduled Today</p>
          <p class="text-xs text-gray-500">Custom schedule</p>
        </div>
      </div>
    {/if}
    
    <!-- Force recreate entire component when key changes -->
    {#key reactiveKey}
      <ShineBorder 
        class="w-full"
        color={task.availableToday === false ? ['#6B7280', '#6B7280'] : [shineFrom, shineTo]}
        borderRadius={16}
        borderWidth={task.completed ? 3 : 2}
        duration={task.completed ? 8 : (task.currentProgress > 0 && isMultiGoal ? 10 : 15)}
      >
        <!-- PERFECTLY FITTED CONTAINER -->
        <div class="bg-[#1A1A1A] relative overflow-hidden h-[80px] flex items-center w-full" style="border-radius: 16px;">
        
        <!-- MAIN PROGRESS FILL - ONLY FOR MULTI GOAL TASKS -->
        {#if isMultiGoal && task.currentProgress > 0 && !task.completed}
          {#key `${task.id}-progress-${task.currentProgress}`}
            <div 
              class="absolute inset-0 transition-all duration-700 ease-out"
              style="background: linear-gradient(90deg, {priorityColor}40 0%, {priorityColor}30 {progressPercentage}%, transparent {progressPercentage}%, transparent 100%);"
            ></div>
          {/key}
        {/if}
        
        <!-- Completed Full Overlay -->
        {#if task.completed}
          {#key `${task.id}-completed-${task.completed}`}
            <div 
              class="absolute inset-0 transition-all duration-500"
              style="background: linear-gradient(90deg, {priorityColor}60 0%, {priorityColor}40 50%, {priorityColor}30 100%);"
            ></div>
          {/key}
        {/if}
        
        <!-- MAIN CONTENT ROW -->
        <button 
          class="relative z-10 flex items-center w-full h-full bg-transparent border-none cursor-pointer select-none text-left px-4 {task.availableToday === false ? 'cursor-not-allowed' : ''}"
          on:mousedown={handleMouseDown}
          on:mouseup={handleMouseUp}
          on:mouseleave={handleMouseUp}
          on:touchstart={handleMouseDown}
          on:touchend={handleMouseUp}
          type="button"
          aria-label="Task: {task.title}"
          disabled={task.availableToday === false}
        >
          
          <!-- LEFT: COMPLETION CIRCLE -->
          <div class="flex-shrink-0 mr-4">
            <div 
              class="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 {task.completed ? 'bg-green-500 border-green-500 scale-110' : task.currentProgress > 0 && isMultiGoal ? 'border-current bg-current/20 scale-105' : 'border-current'}"
              style={task.completed ? '' : `border-color: ${priorityColor}; color: ${priorityColor};`}
            >
              {#if circleState === 'checkmark'}
                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              {:else if circleState === 'plus'}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              {/if}
            </div>
          </div>
          
          <!-- CENTER: TASK CONTENT -->
          <div class="flex-1 min-w-0">
            
            {#if task.completed}
              <!-- COMPLETED STATE -->
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <h3 class="text-white font-bold text-lg leading-tight mb-1">Task Complete</h3>
                  <div class="flex items-center gap-2 text-sm">
                    <span class="text-white/80 font-medium line-through">{task.title}</span>
                    {#if completionInfo.text}
                      <span class="text-gray-400">•</span>
                      <span class="text-white/90 font-medium {completionInfo.isOvertime ? 'text-red-400' : ''}">{completionInfo.text}</span>
                    {/if}
                  </div>
                </div>
              </div>
            {:else}
              <!-- ACTIVE STATE -->
              <div>
                <!-- Title Row -->
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-white font-semibold text-base leading-tight flex-1 min-w-0 pr-2">{task.title}</h3>
                </div>
                
                <!-- Meta Row -->
                <div class="flex items-center gap-3">
                  <!-- Multi-Goal Progress WITH PRIORITY COLOR -->
                  {#if isMultiGoal}
                    {#key `${task.id}-multigoal-${task.currentProgress}`}
                      <div class="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all duration-300" style="background-color: {priorityColor}20; color: {priorityColor};">
                        <span>{task.currentProgress}/{task.goalCount}</span>
                        <div class="w-8 h-1 bg-gray-600/50 rounded-full ml-1">
                          <div 
                            class="h-full rounded-full transition-all duration-500 ease-out"
                            style="width: {progressPercentage}%; background-color: {priorityColor};"
                          ></div>
                        </div>
                      </div>
                    {/key}
                  {/if}
                  
                  <!-- Duration -->
                  <div class="flex items-center gap-1 px-2 py-1 bg-gray-800/50 rounded-md text-xs">
                    <svg class="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                    </svg>
                    <span class="text-gray-300 font-medium">{formatDuration()}</span>
                  </div>
                  
                  <!-- Energy -->
                  <div class="flex items-center gap-1 px-2 py-1 bg-gray-800/50 rounded-md text-xs">
                    <svg class="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
                    </svg>
                    <span class="text-orange-400 font-medium">{task.energyRequired}%</span>
                  </div>
                  
                  <!-- Schedule Tag (REPLACED XP) -->
                  <div class="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md text-xs font-medium">
                    {getScheduleDisplay()}
                  </div>
                </div>
              </div>
            {/if}
          </div>
          
          <!-- RIGHT: PRIORITY BADGE -->
          <div class="flex-shrink-0 ml-3">
            <div 
              class="px-3 py-1 rounded-lg text-sm font-bold text-white shadow-sm transition-all duration-300 {task.completed ? 'scale-110' : ''}"
              style="background-color: {priorityColor}; color: {['S', 'A'].includes(task.priority) ? '#000' : '#fff'};"
            >
              {task.priority}
            </div>
          </div>
        </button>
        
        <!-- BOTTOM PROGRESS BAR (For Multi-Goal) -->
        {#if isMultiGoal && !task.completed && task.currentProgress > 0}
          {#key `${task.id}-bottom-progress-${task.currentProgress}`}
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/30">
              <div 
                class="h-full transition-all duration-700 ease-out"
                style="width: {progressPercentage}%; background-color: {priorityColor};"
              ></div>
            </div>
          {/key}
        {/if}
        
        <!-- COMPLETION CELEBRATION PULSE -->
        {#if task.completed}
          <div class="absolute inset-0 rounded-2xl animate-pulse" style="background: linear-gradient(45deg, {priorityColor}10, transparent, {priorityColor}10);"></div>
        {/if}
      </div>
    </ShineBorder>
    {/key}
  </div>
</div>

<style>
  /* Custom styles for enhanced TaskCard */
</style>