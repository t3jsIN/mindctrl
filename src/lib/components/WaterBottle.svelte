<script lang="ts">
  export let fillLevel: number = 0; // 0-4 (0=empty, 1=25%, 2=50%, 3=75%, 4=100%)
  export let onClick: () => void = () => {};
  
  // Reactive declarations to ensure updates
  $: fillHeight = `${fillLevel * 25}%`;
  $: fillColor = getFillColor(fillLevel);
  $: opacity = getOpacity(fillLevel);
  
  function getFillColor(level: number): string {
    if (level === 0) return 'transparent';
    if (level === 1) return '#3B82F6'; // Blue-500
    if (level === 2) return '#2563EB'; // Blue-600
    if (level === 3) return '#1D4ED8'; // Blue-700
    return '#1E40AF'; // Blue-800 (full)
  }
  
  function getOpacity(level: number): number {
    return Math.min(1, level * 0.3 + 0.7); // Start at 70% opacity, increase with fill
  }
</script>

<button
  class="relative w-16 h-20 rounded-lg border-2 transition-all duration-300 hover:scale-105 {fillLevel > 0 ? 'border-blue-400' : 'border-gray-600 hover:border-blue-400'}"
  on:click={onClick}
  aria-label="Water bottle - {fillLevel * 250}ml of 1000ml filled. Click to add 250ml."
>
  <!-- Bottle outline -->
  <div class="absolute inset-1 rounded-md overflow-hidden bg-gray-900/80">
    <!-- Water fill with progressive levels -->
    {#if fillLevel > 0}
      <div 
        class="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
        style="height: {fillHeight}; background: linear-gradient(to top, {fillColor}, {fillColor}E6, {fillColor}B3); opacity: {opacity};"
      >
        <!-- Water surface animation -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-white to-blue-200 opacity-80 animate-pulse"></div>
        
        <!-- Bubbles effect -->
        <div class="absolute inset-0">
          <div class="absolute bottom-1 left-1 w-0.5 h-0.5 bg-white/50 rounded-full animate-ping" style="animation-delay: 0s; animation-duration: 2s;"></div>
          <div class="absolute bottom-2 right-2 w-1 h-1 bg-white/30 rounded-full animate-ping" style="animation-delay: 1s; animation-duration: 3s;"></div>
        </div>
        
        <!-- Highlight effect -->
        <div class="absolute left-1 top-1 bottom-1 w-1 bg-gradient-to-b from-white/40 to-transparent rounded-full"></div>
      </div>
    {/if}
    
    <!-- Bottle inner shadow -->
    <div class="absolute inset-0 rounded-md shadow-inner pointer-events-none" style="box-shadow: inset 0 0 10px rgba(0,0,0,0.3);"></div>
  </div>
  
  <!-- Bottle cap -->
  <div class="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-gray-400 rounded-t-sm"></div>
</button>