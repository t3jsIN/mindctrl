<script lang="ts">
  export let tasks: any[] = [];
  export let onClose: () => void;
  // svelte-ignore export_let_unused
    export let onTasksUpdate: (tasks: any[]) => void;

  function getPriorityColor(priority: string): string {
    switch(priority) {
      case 'SSS': return '#FF3B30';
      case 'SS': return '#FF9500';
      case 'S': return '#FFCC00';
      case 'A': return '#34C759';
      case 'B': return '#007AFF';
      case 'C': return '#8E8E93';
      default: return '#8E8E93';
    }
  }
  
  interface TaskLog {
    id: number;
    title: string;
    status: 'ongoing' | 'completed' | 'archived' | 'deleted';
    type: 'daily' | 'custom' | 'once';
    priority: string;
    completedAt?: Date;
    createdAt: Date;
    duration?: number;
    actualDuration?: number;
  }
  
  function getTaskLogs(): TaskLog[] {
    const logs: TaskLog[] = [];
    
    tasks.forEach(task => {
      logs.push({
        id: task.id,
        title: task.title,
        status: task.completed ? 'completed' : 'ongoing',
        type: task.recurrence === 'daily' ? 'daily' : task.recurrence === 'custom' ? 'custom' : 'once',
        priority: task.priority,
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        createdAt: new Date(task.createdAt),
        duration: task.duration,
        actualDuration: task.actualDuration
      });
    });
    
    // Sort by status and then by completion/creation time
    return logs.sort((a, b) => {
      // Ongoing first, then completed, then archived
      const statusOrder = { ongoing: 0, completed: 1, archived: 2, deleted: 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      
      // Within same status, sort by time (most recent first)
      const aTime = a.completedAt || a.createdAt;
      const bTime = b.completedAt || b.createdAt;
      return bTime.getTime() - aTime.getTime();
    });
  }
  
  function getStatusColor(status: string): string {
    switch(status) {
      case 'ongoing': return 'text-blue-400 bg-blue-500/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'archived': return 'text-gray-400 bg-gray-500/20';
      case 'deleted': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  }
  
  function getTypeIcon(type: string): string {
    switch(type) {
      case 'daily': return '🔄';
      case 'custom': return '📅';
      case 'once': return '1️⃣';
      default: return '📋';
    }
  }
  
  function formatDateTime(date: Date): string {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  }
  
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      onClose();
    }
  }
  
  $: taskLogs = getTaskLogs();
  $: ongoingCount = taskLogs.filter(log => log.status === 'ongoing').length;
  $: completedCount = taskLogs.filter(log => log.status === 'completed').length;
  $: totalTasks = taskLogs.length;
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Main Logs Modal -->
<div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div class="bg-gray-900 rounded-2xl w-full max-w-4xl h-[80vh] border border-gray-700 flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-700">
      <div>
        <h2 class="text-2xl font-bold text-white">Task Logs</h2>
        <p class="text-sm text-gray-400">
          {totalTasks} total • {ongoingCount} ongoing • {completedCount} completed
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          class="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-all"
          on:click={onClose}
          aria-label="Close logs"
        >
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Logs List -->
    <div class="flex-1 overflow-y-auto p-6">
      {#if taskLogs.length === 0}
        <div class="text-center py-16">
          <div class="text-6xl mb-4 opacity-50"></div>
          <p class="text-xl text-gray-400 mb-2">No task logs yet</p>
          <p class="text-sm text-gray-500">Start creating and completing tasks to see logs here</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each taskLogs as log (log.id)}
            <div class="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{getTypeIcon(log.type)}</span>
                  <div>
                    <h3 class="text-white font-semibold">{log.title}</h3>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="px-2 py-1 rounded-md text-xs font-medium {getStatusColor(log.status)}">
                        {log.status.toUpperCase()}
                      </span>
                      <span class="px-2 py-1 bg-gray-600/20 text-gray-300 rounded-md text-xs">
                        {log.type.toUpperCase()}
                      </span>
                      <span class="px-2 py-1 rounded-md text-xs font-bold text-white" style="background-color: {getPriorityColor(log.priority)};">
                        {log.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="text-right text-sm text-gray-400">
                  {#if log.completedAt}
                    <p class="font-medium">Completed</p>
                    <p>{formatDateTime(log.completedAt)}</p>
                  {:else}
                    <p class="font-medium">Created</p>
                    <p>{formatDateTime(log.createdAt)}</p>
                  {/if}
                </div>
              </div>
              
              {#if log.duration}
                <div class="flex items-center gap-4 text-sm text-gray-400">
                  <span>Planned: {formatDuration(log.duration)}</span>
                  {#if log.actualDuration}
                    <span class="{log.actualDuration > log.duration ? 'text-red-400' : 'text-green-400'}">
                      Actual: {formatDuration(log.actualDuration)}
                    </span>
                  {/if}
                </div>
              {/if}
            </div>  
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>