<script lang="ts">
  import { cn } from "$lib/utils";
  
  export let max: number = 100;
  export let value: number = 0;
  export let min: number = 0;
  export let gaugePrimaryColor: string = "#f00";
  export let gaugeSecondaryColor: string = "#333";
  export let size: number = 80;
  
  let className: string = "";
  export { className as class };
  
  $: circumference = 2 * Math.PI * 45;
  $: percentPx = circumference / 100;
  $: currentPercent = ((value - min) / (max - min)) * 100;
</script>

<div
  class={cn("relative flex items-center justify-center font-semibold", className)}
  style:--circle-size="{size}px"
  style:--circumference={circumference}
  style:--percent-to-px="{percentPx}px"
  style:--gap-percent="5"
  style:--offset-factor="0"
  style:--transition-length="1s"
  style:--transition-step="200ms"
  style:--delay="0s"
  style:--percent-to-deg="3.6deg"
  style="transform: translateZ(0); width: {size}px; height: {size}px;"
>
  <svg fill="none" class="absolute inset-0 w-full h-full" stroke-width="2" viewBox="0 0 100 100">
    {#if currentPercent <= 90 && currentPercent >= 0}
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke-width="8"
        stroke-dashoffset="0"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="opacity-100"
        style="
      stroke:{gaugeSecondaryColor};
      stroke-dasharray: calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference);
      transform: rotate(calc(1turn - 90deg - (var(--gap-percent) * var(--percent-to-deg) * var(--offset-factor-secondary)))) scaleY(-1);
      transition: all var(--transition-length) ease var(--delay);
      transform-origin:calc(var(--circle-size) / 2) calc(var(--circle-size) / 2);
      "
        style:--stroke-percent={90 - currentPercent}
        style:--offset-factor-secondary="calc(1 - var(--offset-factor))"
      />
    {/if}
    <circle
      cx="50"
      cy="50"
      r="45"
      stroke-width="8"
      stroke-dashoffset="0"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="opacity-100"
      style="
      stroke:{gaugePrimaryColor};
      stroke-dasharray:calc(var(--stroke-percent) * var(--percent-to-px)) var(--circumference);
      transition:var(--transition-length) ease var(--delay),stroke var(--transition-length) ease var(--delay);
      transition-property: stroke-dasharray,transform;
      transform:rotate(calc(-90deg + var(--gap-percent) * var(--offset-factor) * var(--percent-to-deg)));
        transform-origin:calc(var(--circle-size) / 2) calc(var(--circle-size) / 2);
      "
      style:--stroke-percent={currentPercent}
    />
  </svg>
</div>