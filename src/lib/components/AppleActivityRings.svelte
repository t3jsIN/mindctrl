<script lang="ts">
  interface RingData {
    value: number;
    max: number;
    color: string;
    label: string;
    unit: string;
  }
  
  export let rings: RingData[] = [];
  export let size: number = 200;
  
  const strokeWidth = 12;
  const gap = 16;
  
  function getRingRadius(index: number): number {
    const baseRadius = (size / 2) - strokeWidth - 10;
    return baseRadius - (index * gap);
  }
  
  function getCircumference(radius: number): number {
    return 2 * Math.PI * radius;
  }
  
  function getStrokeDasharray(value: number, max: number, circumference: number): string {
    const percentage = Math.min(value / max, 1);
    const dashLength = circumference * percentage;
    const gapLength = circumference - dashLength;
    return `${dashLength} ${gapLength}`;
  }
  
  function getRotation(): string {
    return 'rotate(-90 50 50)';
  }
</script>

<div class="relative flex items-center justify-center" style="width: {size}px; height: {size}px;">
  <svg width={size} height={size} class="absolute">
    {#each rings as ring, index}
      {@const radius = getRingRadius(index)}
      {@const circumference = getCircumference(radius)}
      {@const center = size / 2}
      {@const strokeDasharray = getStrokeDasharray(ring.value, ring.max, circumference)}
      
      <!-- Background ring -->
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="{ring.color}30"
        stroke-width={strokeWidth}
        stroke-linecap="round"
      />
      
      <!-- Progress ring -->
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={ring.color}
        stroke-width={strokeWidth}
        stroke-linecap="round"
        stroke-dasharray={strokeDasharray}
        transform={getRotation()}
        class="transition-all duration-1000 ease-out"
        style="filter: drop-shadow(0 0 6px {ring.color}60);"
      />
    {/each}
  </svg>
  
  <!-- Center content -->
  <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
    <div class="text-2xl font-bold text-white mb-1">
      {Math.round((rings.reduce((sum, ring) => sum + (ring.value / ring.max), 0) / rings.length) * 100)}%
    </div>
    <div class="text-xs text-gray-400">Complete</div>
  </div>
  
  <!-- Ring labels -->
  <div class="absolute inset-0 pointer-events-none">
    {#each rings as ring, index}
      {@const radius = getRingRadius(index)}
      {@const angle = (ring.value / ring.max) * 360 - 90}
      {@const centerX = size / 2}
      {@const centerY = size / 2}
      {@const x = centerX + radius * Math.cos((angle * Math.PI) / 180)}
      {@const y = centerY + radius * Math.sin((angle * Math.PI) / 180)}
      
      {#if ring.value > 0}
        <div
          class="absolute w-3 h-3 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2"
          style="left: {x}px; top: {y}px; background-color: {ring.color}; box-shadow: 0 0 8px {ring.color}80;"
        ></div>
      {/if}
    {/each}
  </div>
</div>

<!-- Ring Statistics -->
<div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
  {#each rings as ring, index}
    <div class="text-center">
      <div class="text-2xl font-bold mb-1" style="color: {ring.color};">
        {Math.round(ring.value)}{ring.unit}
      </div>
      <div class="text-sm text-gray-400 mb-1">{ring.label}</div>
      <div class="text-xs text-gray-500">
        {Math.round((ring.value / ring.max) * 100)}% of {ring.max}{ring.unit}
      </div>
    </div>
  {/each}
</div>