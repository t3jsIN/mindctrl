<script lang="ts">
  import BorderBeam from "./BorderBeam.svelte";
  
  export let onClick: () => void = () => {};
</script>

<button
  class="relative w-full rounded-2xl p-6 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-800/60 transition-all duration-300 hover:scale-[1.02] group"
  on:click={onClick}
>
  <BorderBeam size={300} duration={18} colorFrom="#FF1744" colorTo="#8E24AA" />
  
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <div class="w-16 h-16 bg-gradient-to-br from-red-600 via-purple-600 to-violet-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      </div>
      
      <div class="text-left">
        <h3 class="text-2xl font-bold tracking-wider">TASKMASTER</h3>
        <p class="text-sm text-gray-400 mt-1">Advanced task management system</p>
        <div class="flex gap-2 mt-2">
          <span class="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-md">PRIORITY</span>
          <span class="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-md">GOALS</span>
          <span class="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs rounded-md">TRACKING</span>
        </div>
      </div>
    </div>
    
    <div class="flex items-center gap-3">
      <div class="text-right">
        <p class="text-xs text-gray-400">Click to access</p>
        <p class="text-lg font-bold text-white">Task Matrix</p>
      </div>
      <svg class="w-6 h-6 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </div>
</button>