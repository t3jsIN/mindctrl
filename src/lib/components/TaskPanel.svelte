<script lang="ts">
  import BorderBeam from "./BorderBeam.svelte";
  
  interface Task {
    id: number;
    title: string;
    priority: string;
    goalCount: number;
    energyRequired: number;
    duration: number;
    schedule: string;
    currentProgress: number;
    completed: boolean;
  }
  
  export let tasks: Task[] = [];
  export let onTaskComplete: (id: number) => void;
  export let onTaskDelete: (id: number) => void;
  export let onAddTask: () => void;
  
  interface PriorityColors {
    [key: string]: string;
  }
  
  const priorityColors: PriorityColors = {
    SSS: '#FF0000',
    SS: '#FF4500', 
    S: '#FFA500',
    A: '#FFFF00',
    B: '#00FF00',
    C: '#808080'
  };
</script>

<div class="relative rounded-2xl p-6 bg-gray-900/50 backdrop-blur-sm">
  <BorderBeam size={300} duration={16} colorFrom="#FFD700" colorTo="#FF6B6B" />
  
  <div class="flex justify-between items-center mb-6">
    <div>
      <h3 class="text-lg font-semibold">Tasks</h3>
      <p class="text-xs text-gray-400 mt-1">Auto-resets daily at midnight & when you wake up</p>
    </div>
    <button
      class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg"
      on:click={onAddTask}
    >
      <span class="text-xl font-bold">+</span>
    </button>
  </div>
  
  <div class="space-y-4 max-h-96 overflow-y-auto">
    {#each tasks as task (task.id)}
      <div class="relative rounded-xl overflow-hidden hover:scale-[1.02] transition-transform">
        <div 
          class="p-4 bg-gray-800/70 backdrop-blur-sm border-l-4"
          style="border-color: {priorityColors[task.priority]};"
        >
          <div class="flex items-center gap-4">
            <button
              class="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 {task.completed ? 'bg-green-500 border-green-500 text-white' : task.goalCount > 1 && task.currentProgress > 0 ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-400 hover:border-white'}"
              on:click={() => onTaskComplete(task.id)}
              disabled={task.completed}
            >
              {#if task.completed}
                ✓
              {:else if task.goalCount > 1 && task.currentProgress > 0}
                +
              {/if}
            </button>
            
            <div class="flex-1">
              <h4 class="font-semibold text-lg {task.completed ? 'line-through text-gray-500' : ''}">{task.title}</h4>
              <div class="flex gap-4 text-sm text-gray-400 mt-1">
                <span class="bg-gray-700 px-2 py-1 rounded-md">⚡ {task.energyRequired}/10</span>
                <span class="bg-gray-700 px-2 py-1 rounded-md">⏱️ {task.duration}min</span>
                <span class="bg-gray-700 px-2 py-1 rounded-md capitalize">📅 {task.schedule}</span>
                {#if task.goalCount > 1}
                  <span class="bg-gray-700 px-2 py-1 rounded-md">🎯 {task.currentProgress}/{task.goalCount}</span>
                {/if}
              </div>
            </div>
            
            <div class="flex gap-2 items-center">
              <div 
                class="px-3 py-1 rounded-full text-sm font-bold shadow-lg" 
                style="background-color: {priorityColors[task.priority]}; color: {task.priority === 'A' ? '#000' : '#fff'};"
              >
                {task.priority}
              </div>
              <button
                class="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all text-white"
                on:click={() => onTaskDelete(task.id)}
              >
                ×
              </button>
            </div>
          </div>
          
          {#if task.goalCount > 1 && !task.completed}
            <div class="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 rounded-full"
                style="width: {(task.currentProgress / task.goalCount) * 100}%;"
              ></div>
            </div>
          {/if}
        </div>
      </div>
    {/each}
    
    {#if tasks.length === 0}
      <div class="text-center py-16 text-gray-400">
        <div class="text-6xl mb-4">📝</div>
        <p class="text-xl mb-2">No tasks yet</p>
        <p>Click the + button to add your first task</p>
      </div>
    {/if}
  </div>
</div>