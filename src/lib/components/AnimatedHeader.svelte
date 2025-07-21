<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Meteors from "./Meteors.svelte";

  let currentTime = new Date();
  let timeInterval: number;

  function updateTime() {
    currentTime = new Date();
  }

  function getMonthAbbr(month: number): string {
    const months = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];
    return months[month - 1];
  }

  function formatTime(): string {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const day = currentTime.getDate().toString().padStart(2, '0');
    const month = getMonthAbbr(currentTime.getMonth() + 1);
    const year = currentTime.getFullYear().toString().substring(2);
    
    return `${hours}${minutes}${day}${month}${year}`;
  }

  onMount(() => {
    timeInterval = setInterval(updateTime, 1000);
  });

  onDestroy(() => {
    if (timeInterval) clearInterval(timeInterval);
  });
</script>

<div class="relative w-full bg-black border border-gray-800 px-5 py-4 overflow-hidden">
  <!-- Meteors Background -->
  <div class="absolute inset-0">
    <Meteors number={20} />
  </div>
  
  <!-- Header Content -->
  <div class="relative z-10 flex justify-between items-center">
    <!-- Animated MindCTRL Logo -->
    <div class="text-2xl font-bold bg-gradient-to-r from-teal-400 to-orange-500 bg-clip-text text-transparent">
      MINDCTRL
    </div>
    
    <!-- Time Display -->
    <div class="text-white text-sm font-bold font-mono">
      {formatTime()}
    </div>
  </div>
</div>