<script lang="ts">
  import BorderBeam from "./BorderBeam.svelte";
  import CircularProgressBar from "./CircularProgressBar.svelte";
  
  export let sleepProgress: number = 0;
  export let taskProgress: number = 0;
  export let circadianProgress: number = 85;
  export let waterProgress: number = 0;
</script>

<div class="relative rounded-2xl p-6 bg-gray-900/50 backdrop-blur-sm">
  <BorderBeam size={250} duration={15} colorFrom="#FF6B6B" colorTo="#4ECDC4" />
  
  <h3 class="text-lg font-semibold mb-6">Progress Overview</h3>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
    {#each [
      { label: 'Sleep', value: sleepProgress, color: '#4ECDC4', suffix: 'hrs' },
      { label: 'Tasks', value: taskProgress, color: '#45B7D1', suffix: '%' },
      { label: 'Circadian', value: circadianProgress, color: '#96CEB4', suffix: '%' },
      { label: 'Water', value: waterProgress, color: '#FFD700', suffix: '%' }
    ] as ring}
      <div class="text-center">
        <div class="relative mb-3">
          <CircularProgressBar
            value={ring.value}
            gaugePrimaryColor={ring.color}
            gaugeSecondaryColor="#374151"
            size={90}
          />
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <div class="text-lg font-bold">{Math.round(ring.value)}</div>
              <div class="text-xs text-gray-400">{ring.suffix}</div>
            </div>
          </div>
        </div>
        <p class="text-sm text-gray-300 font-medium">{ring.label}</p>
      </div>
    {/each}
  </div>
</div>