<script lang="ts">
  import { cn } from "$lib/utils";

  type TColorProp = string | string[];

  export let borderRadius: number = 8;
  export let borderWidth: number = 1;
  export let duration: number = 14;
  export let color: TColorProp = ["#4FF9FF"];
  let className: string = "";
  export { className as class };

  // Create reactive color string for better performance
  $: colorString = Array.isArray(color) ? color.join(',') : color;

  // Create a unique key for forcing re-renders when needed
  $: componentKey = `${borderRadius}-${borderWidth}-${duration}-${colorString}`;
</script>

<!-- Use key to force re-render when properties change -->
{#key componentKey}
<div
  style="--border-radius: {borderRadius}px;"
  class={cn(
    "relative w-full rounded-[var(--border-radius)]",
    className
  )}
>
  <!-- Border effect container - FIXED: Added proper overflow and positioning -->
  <div
    style="
      --border-width: {borderWidth}px;
      --border-radius: {borderRadius}px;
      --shine-pulse-duration: {duration}s;
      --mask-linear-gradient: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      --background-radial-gradient: radial-gradient(transparent, transparent, {colorString}, transparent, transparent);
    "
    class="absolute inset-[-2px] rounded-[var(--border-radius)] p-[var(--border-width)] 
           before:absolute before:inset-0 before:rounded-[var(--border-radius)] 
           before:bg-[length:300%_300%] 
           before:animate-[shine-pulse_var(--shine-pulse-duration)_infinite_linear] 
           before:[background-image:var(--background-radial-gradient)] 
           before:[mask:var(--mask-linear-gradient)] 
           before:[mask-composite:exclude] 
           before:[-webkit-mask-composite:xor]
           before:opacity-100"
  ></div>
  
  <!-- Content container - FIXED: Proper z-index and positioning -->
  <div class="relative z-10 rounded-[var(--border-radius)] overflow-hidden bg-[#1A1A1A]">
    <slot></slot>
  </div>
</div>
{/key}

<style>
  @keyframes shine-pulse {
    0% {
      background-position: 0% 0%;
    }
    50% {
      background-position: 100% 100%;
    }
    100% {
      background-position: 0% 0%;
    }
  }
</style>