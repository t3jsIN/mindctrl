<script lang="ts">
  import { onMount } from 'svelte';
  
  export let selectedMood: string = '';
  export let onMoodChange: (mood: string, stressLevel: number) => void;
  
  let isOpen = false;
  let dropdownElement: HTMLDivElement;
  
  interface MoodOption {
    emoji: string;
    label: string;
    stressLevel: number;
    gradient: string[];
  }
  
  const moodOptions: MoodOption[] = [
    // Happy & Positive
    { emoji: '😄', label: 'Happy', stressLevel: 2, gradient: ['#3C8CE7', '#00B4DB'] },
    { emoji: '😎', label: 'Focused', stressLevel: 2, gradient: ['#2C5364', '#203A43'] },
    { emoji: '🔥', label: 'Game Mode', stressLevel: 1, gradient: ['#FF8A00', '#E52E71'] },
    { emoji: '🤠', label: 'Motivated', stressLevel: 3, gradient: ['#6DD5FA', '#2980B9'] },
    { emoji: '🤓', label: 'Productive', stressLevel: 2, gradient: ['#607D8B', '#37474F'] },
    { emoji: '😍', label: 'Love Mode', stressLevel: 1, gradient: ['#FC466B', '#3F5EFB'] },
    { emoji: '💃', label: 'Vibing', stressLevel: 1, gradient: ['#FF6B6B', '#4ECDC4'] },
    { emoji: '🧘', label: 'Zen', stressLevel: 1, gradient: ['#2C5364', '#0F2027'] },
    { emoji: '📈', label: 'Rising', stressLevel: 2, gradient: ['#56CCF2', '#2F80ED'] },
    { emoji: '💫', label: 'Spiritual High', stressLevel: 2, gradient: ['#FFB347', '#FFCC33'] },
    { emoji: '🚀', label: 'Launch Mode', stressLevel: 2, gradient: ['#FF0000', '#FF512F'] },
    { emoji: '🎯', label: 'Laser Focus', stressLevel: 1, gradient: ['#1F1C2C', '#928DAB'] },
    { emoji: '⚡', label: 'Ultra Charged', stressLevel: 3, gradient: ['#FFA500', '#FF4500'] },
    
    // Neutral & Mild
    { emoji: '😐', label: 'Neutral', stressLevel: 3, gradient: ['#888888', '#555555'] },
    { emoji: '😴', label: 'Tired', stressLevel: 5, gradient: ['#3E3E3E', '#1A1A1A'] },
    { emoji: '💼', label: 'Work Mode', stressLevel: 5, gradient: ['#485563', '#29323C'] },
    { emoji: '🤔', label: 'Reflective', stressLevel: 4, gradient: ['#0F0C29', '#24243E'] },
    { emoji: '🧠', label: 'Thinking Hard', stressLevel: 5, gradient: ['#434343', '#000000'] },
    { emoji: '🛌', label: 'Sleepy AF', stressLevel: 4, gradient: ['#414345', '#232526'] },
    { emoji: '🛠️', label: 'Repairing Self', stressLevel: 5, gradient: ['#3E5151', '#DECBA4'] },
    { emoji: '🤹', label: 'Multitasking', stressLevel: 5, gradient: ['#FC5C7D', '#6A82FB'] },
    { emoji: '🔮', label: 'Intuitive', stressLevel: 3, gradient: ['#41295A', '#2F0743'] },
    { emoji: '🎲', label: 'Chaotic Neutral', stressLevel: 6, gradient: ['#1D4350', '#A43931'] },
    
    // Negative & Stressed
    { emoji: '😞', label: 'Sad', stressLevel: 6, gradient: ['#009FFD', '#2A2A72'] },
    { emoji: '😡', label: 'Frustrated', stressLevel: 7, gradient: ['#B71C1C', '#8E0000'] },
    { emoji: '😬', label: 'Anxious', stressLevel: 8, gradient: ['#32327A', '#1E1E3F'] },
    { emoji: '😢', label: 'Depressed', stressLevel: 10, gradient: ['#243B55', '#141E30'] },
    { emoji: '🤯', label: 'Overwhelmed', stressLevel: 9, gradient: ['#4B0082', '#301934'] },
    { emoji: '😠', label: 'Irritated', stressLevel: 7, gradient: ['#D32F2F', '#B71C1C'] },
    { emoji: '💩', label: 'Burned Out', stressLevel: 9, gradient: ['#6E3B3B', '#4A2828'] },
    { emoji: '🤬', label: 'Pissed Off', stressLevel: 10, gradient: ['#8E0E00', '#5A0900'] },
    { emoji: '💀', label: 'Downer', stressLevel: 10, gradient: ['#434343', '#000000'] },
    { emoji: '📉', label: 'Hopeless', stressLevel: 10, gradient: ['#434343', '#1A1A1A'] },
    { emoji: '🧨', label: 'Explosive', stressLevel: 10, gradient: ['#FF512F', '#DD2476'] },
    { emoji: '🌪️', label: 'Tornado Inside', stressLevel: 10, gradient: ['#000428', '#004e92'] },
    { emoji: '🥶', label: 'Panic Mode', stressLevel: 9, gradient: ['#3A6073', '#16222A'] },
    { emoji: '🧱', label: 'Blocked', stressLevel: 8, gradient: ['#414345', '#232526'] },
    { emoji: '🪞', label: 'Self-Critical', stressLevel: 9, gradient: ['#283048', '#859398'] },
    
    // Weird & Dissociated  
    { emoji: '😵‍💫', label: 'Confused', stressLevel: 7, gradient: ['#D76D77', '#3A6073'] },
    { emoji: '🥴', label: 'On Acid', stressLevel: 6, gradient: ['#302B63', '#0F0C29'] },
    { emoji: '🌀', label: 'Spaced Out', stressLevel: 5, gradient: ['#3A6073', '#16222A'] },
    { emoji: '😶‍🌫️', label: 'Foggy Head', stressLevel: 6, gradient: ['#9D8BB9', '#4A4A4A'] },
    { emoji: '👽', label: 'Dissociated', stressLevel: 7, gradient: ['#91FF00', '#00B4DB'] },
    { emoji: '🤖', label: 'Robot Mode', stressLevel: 5, gradient: ['#DECBA4', '#3E5151'] },
    { emoji: '👻', label: 'Hollow Mood', stressLevel: 8, gradient: ['#605C3C', '#3C3C3C'] },
    { emoji: '🫥', label: 'Emotionless', stressLevel: 7, gradient: ['#232526', '#414345'] },
    { emoji: '🧊', label: 'Cold AF', stressLevel: 6, gradient: ['#2980B9', '#6BB6FF'] },
    { emoji: '🫠', label: 'Melting', stressLevel: 7, gradient: ['#F00000', '#DC281E'] },
    
    // Fun & Silly
    { emoji: '😈', label: 'Mischievous', stressLevel: 4, gradient: ['#B100E8', '#667eea'] },
    { emoji: '🤡', label: 'Silly', stressLevel: 3, gradient: ['#8E2DE2', '#4A00E0'] },
    { emoji: '🤒', label: 'Sick', stressLevel: 6, gradient: ['#D7D2CC', '#304352'] },
    { emoji: '🥹', label: 'Emotional', stressLevel: 7, gradient: ['#CBB4D4', '#20002C'] },
    { emoji: '🌿', label: 'INNER PEACE', stressLevel: 1, gradient: ['#A8D5BA', '#000000'] },
    
    // Dank & Raw New Ones
    { emoji: '🧍', label: 'Socially Awkward', stressLevel: 6, gradient: ['#4C4C4C', '#000000'] },
    { emoji: '🙃', label: 'Internally Screaming', stressLevel: 8, gradient: ['#B06AB3', '#000000'] },
    { emoji: '🫃', label: 'Bloated AF', stressLevel: 7, gradient: ['#6A9113', '#000000'] },
    { emoji: '🐌', label: 'Slowed Down', stressLevel: 4, gradient: ['#1F1C2C', '#000000'] },
    { emoji: '🧛', label: 'Energy Vampire', stressLevel: 5, gradient: ['#5C258D', '#000000'] },
    { emoji: '🎭', label: 'Wearing A Mask', stressLevel: 9, gradient: ['#141E30', '#000000'] },
    { emoji: '🌚', label: 'Dark Mode Mind', stressLevel: 8, gradient: ['#232526', '#000000'] },
    { emoji: '🙈', label: 'Avoiding Reality', stressLevel: 6, gradient: ['#614385', '#516395'] },
    { emoji: '💣', label: 'One Trigger Away', stressLevel: 10, gradient: ['#FF416C', '#FF4B2B'] },
    { emoji: '📵', label: 'Done With Everything', stressLevel: 9, gradient: ['#4B6CB7', '#182848'] },
    { emoji: '💤', label: 'Brain Offline', stressLevel: 4, gradient: ['#3E5151', '#DECBA4'] },
    { emoji: '📺', label: 'Background NPC', stressLevel: 5, gradient: ['#1D2B64', '#F8CDDA'] },
    { emoji: '🍷', label: 'Wine Mom Energy', stressLevel: 3, gradient: ['#614385', '#516395'] },
    { emoji: '🫨', label: 'Shooketh', stressLevel: 9, gradient: ['#D38312', '#A83279'] },
    { emoji: '🪫', label: 'Battery 1%', stressLevel: 10, gradient: ['#000000', '#4B4B4B'] },
    { emoji: '💅', label: 'Too Glam to Give a Damn', stressLevel: 2, gradient: ['#FFC0CB', '#FF69B4'] },
    { emoji: '🛸', label: 'Mentally Not Here', stressLevel: 6, gradient: ['#3A1C71', '#D76D77'] },
    { emoji: '📎', label: 'Paperclipped to Sanity', stressLevel: 8, gradient: ['#606C88', '#3F4C6B'] },
    { emoji: '🎢', label: 'Mood Rollercoaster', stressLevel: 9, gradient: ['#7F00FF', '#E100FF'] },
    { emoji: '🥱', label: 'Bored Outta Brain', stressLevel: 5, gradient: ['#0F2027', '#2C5364'] }
  ];
  
  function selectMood(mood: MoodOption) {
    selectedMood = mood.emoji;
    onMoodChange(mood.emoji, mood.stressLevel);
    isOpen = false;
  }
  
  function toggleDropdown() {
    isOpen = !isOpen;
  }
  
  function closeDropdown(event: MouseEvent) {
    if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
      isOpen = false;
    }
  }
  
  $: selectedMoodData = moodOptions.find(m => m.emoji === selectedMood);
  
  onMount(() => {
    document.addEventListener('click', closeDropdown);
    return () => {
      document.removeEventListener('click', closeDropdown);
    };
  });
</script>

<div class="relative" bind:this={dropdownElement}>
  <button
    class="w-full p-3 rounded-xl bg-gray-800 border border-gray-600 text-white focus:border-blue-500 transition-all hover:scale-105 flex items-center justify-between"
    on:click={toggleDropdown}
    style={selectedMoodData ? `background: linear-gradient(135deg, ${selectedMoodData.gradient[0]}, ${selectedMoodData.gradient[1]})` : ''}
  >
    <span class="flex items-center gap-2">
      {#if selectedMoodData}
        <span class="text-xl">{selectedMoodData.emoji}</span>
        <span class="font-medium">{selectedMoodData.label}</span>
        <span class="text-xs bg-black/30 px-2 py-1 rounded">Stress: {selectedMoodData.stressLevel}/10</span>
      {:else}
        <span class="text-gray-400">Select your mood...</span>
      {/if}
    </span>
    <span class="transform transition-transform {isOpen ? 'rotate-180' : ''}">▼</span>
  </button>
  {#if isOpen}
  <div class="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-600 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
    <div class="p-2">
      <input
        type="text"
        placeholder="Search moods..."
        class="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-blue-500"
        on:input={(e) => {
          const target = e.target as HTMLInputElement;
          const searchTerm = target.value.toLowerCase();
          const items = dropdownElement.querySelectorAll('.mood-item');
          items.forEach(item => {
            const text = item.textContent?.toLowerCase() || '';
            const element = item as HTMLElement;
            element.style.display = text.includes(searchTerm) ? 'flex' : 'none';
          });
        }}
      />
    </div>
    <div class="max-h-80 overflow-y-auto">
      {#each moodOptions as mood}
        <button
          class="mood-item w-full p-3 hover:bg-gray-700 transition-colors flex items-center justify-between text-left"
          style="background: linear-gradient(135deg, {mood.gradient[0]}20, {mood.gradient[1]}20);"
          on:click={() => selectMood(mood)}
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">{mood.emoji}</span>
            <div>
              <div class="font-medium text-white">{mood.label}</div>
              <div class="text-xs text-gray-400">Stress Level: {mood.stressLevel}/10</div>
            </div>
          </div>
          <div 
            class="w-3 h-3 rounded-full"
            style="background: linear-gradient(135deg, {mood.gradient[0]}, {mood.gradient[1]});"
          ></div>
        </button>
      {/each}
    </div>
  </div>
{/if}
</div>