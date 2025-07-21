<script lang="ts">
  export let tasks: any[] = [];
  export let onClose: () => void;
  
  interface DayData {
    date: string;
    dayName: string;
    completed: number;
    total: number;
    taskPercentage: number;
    sleepPercentage: number;
    waterPercentage: number;
    waterIntake: number;
    sleepHours: number;
    rawSleepData: any;
    rawWaterData: any;
  }
  
  function getWeeklyData(): DayData[] {
    const weekData: DayData[] = [];
    const today = new Date();
    
    // Get last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const dateStr = date.toDateString();
      const dayName = date.toLocaleDateString('en', { weekday: 'short' });
      
      // Calculate task completion for this day
      const dayTasks = tasks.filter(task => {
        if (task.completedAt) {
          const completedDate = new Date(task.completedAt);
          return completedDate.toDateString() === dateStr;
        }
        return false;
      });
      
      const totalTasksForDay = tasks.filter(task => {
        const createdDate = new Date(task.createdAt);
        return createdDate <= date;
      }).length;
      
      const completed = dayTasks.length;
      const total = Math.max(1, totalTasksForDay);
      const taskPercentage = Math.round((completed / total) * 100);
      
      // Get detailed water and sleep data
      const { waterData, waterPercentage } = getDetailedWaterData(dateStr);
      const { sleepData, sleepPercentage } = getDetailedSleepData(dateStr);
      
      weekData.push({
        date: dateStr,
        dayName: i === 0 ? 'Today' : dayName,
        completed,
        total,
        taskPercentage,
        sleepPercentage,
        waterPercentage,
        waterIntake: waterData.totalConsumed / 1000, // Convert to liters
        sleepHours: sleepData.totalSleep,
        rawSleepData: sleepData,
        rawWaterData: waterData
      });
    }
    
    return weekData;
  }
  
  function getDetailedWaterData(dateStr: string): { waterData: any, waterPercentage: number } {
    const hydrationData = localStorage.getItem('hydration_matrix_data');
    let waterData = { 
      totalConsumed: 0, 
      dailyTarget: 4000, 
      userWeight: 70,
      bmi: 0
    }; // Default values
    
    if (hydrationData) {
      try {
        const data = JSON.parse(hydrationData);
        if (dateStr === new Date().toDateString()) {
          // Today's actual data
          waterData = {
            totalConsumed: data.totalConsumed || 0,
            dailyTarget: (data.dailyWaterTarget || 4) * 1000, // Convert L to ml
            userWeight: data.userWeight || 70,
            bmi: data.bmi || 0
          };
        } else {
          // Historical data (demo data for previous days)
          const userWeight = data.userWeight || 70;
          const targetML = userWeight * 35; // 35ml per kg
          const demoIntake = Math.random() * targetML; // Random intake up to target
          waterData = {
            totalConsumed: demoIntake,
            dailyTarget: targetML,
            userWeight: userWeight,
            bmi: data.bmi || 0
          };
        }
      } catch (error) {
        console.error('Error reading hydration data:', error);
      }
    }
    
    const waterPercentage = Math.min(100, Math.round((waterData.totalConsumed / waterData.dailyTarget) * 100));
    return { waterData, waterPercentage };
  }
  
  function getDetailedSleepData(dateStr: string): { sleepData: any, sleepPercentage: number } {
    const sleepData = localStorage.getItem('mindctrl_sleep_data');
    let data = { totalSleep: 0, dailyAverage: 7, isAwake: true }; // Default values
    
    if (sleepData) {
      try {
        const parsed = JSON.parse(sleepData);
        if (dateStr === new Date().toDateString()) {
          // Today's actual data
          data = {
            totalSleep: parsed.totalSleepToday || 0,
            dailyAverage: parsed.dailyAverage || 7,
            isAwake: parsed.isAwake !== undefined ? parsed.isAwake : true
          };
        } else {
          // Historical data (demo data for previous days)
          data = {
            totalSleep: 6 + Math.random() * 4, // 6-10 hours
            dailyAverage: parsed.dailyAverage || 7,
            isAwake: true
          };
        }
      } catch (error) {
        console.error('Error reading sleep data:', error);
      }
    }
    
    // Sleep percentage based on 9 hours = 100%
    const sleepPercentage = Math.min(100, Math.round((data.totalSleep / 9) * 100));
    return { sleepData: data, sleepPercentage };
  }
  
  function getPriorityDistribution() {
    const priorities: Record<string, number> = { SSS: 0, SS: 0, S: 0, A: 0, B: 0, C: 0 };
    tasks.forEach(task => {
      const priority = task.priority as keyof typeof priorities;
      priorities[priority] = (priorities[priority] || 0) + 1;
    });
    return priorities;
  }
  
  function getCompletionStats() {
    const completed = tasks.filter(task => task.completed).length;
    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const totalPlannedTime = tasks.reduce((sum, task) => sum + (task.duration || 0), 0);
    const totalActualTime = tasks.filter(task => task.actualDuration).reduce((sum, task) => sum + task.actualDuration, 0);
    
    return {
      completed,
      total,
      completionRate,
      totalPlannedTime: Math.round(totalPlannedTime / 60 * 10) / 10,
      totalActualTime: Math.round(totalActualTime / 60 * 10) / 10,
      efficiency: totalPlannedTime > 0 ? Math.round((totalPlannedTime / Math.max(totalActualTime, 1)) * 100) : 100
    };
  }
  
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      onClose();
    }
  }
  
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
  
  function getWeeklyAverages(data: DayData[]) {
    return {
      taskAvg: Math.round(data.reduce((sum, day) => sum + day.taskPercentage, 0) / data.length),
      sleepAvg: Math.round(data.reduce((sum, day) => sum + day.sleepPercentage, 0) / data.length),
      waterAvg: Math.round(data.reduce((sum, day) => sum + day.waterPercentage, 0) / data.length),
      sleepHoursAvg: Math.round(data.reduce((sum, day) => sum + day.sleepHours, 0) / data.length * 10) / 10,
      waterLitersAvg: Math.round(data.reduce((sum, day) => sum + day.waterIntake, 0) / data.length * 10) / 10
    };
  }
  
  $: weeklyData = getWeeklyData();
  $: priorityDist = getPriorityDistribution();
  $: completionStats = getCompletionStats();
  $: averages = getWeeklyAverages(weeklyData);
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Analytics Modal -->
<div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div class="bg-gray-900 rounded-2xl w-full max-w-7xl h-[90vh] border border-gray-700 flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-6 border-b border-gray-700">
      <div>
        <h2 class="text-2xl font-bold text-white">Analytics Dashboard</h2>
        <p class="text-sm text-gray-400">Your productivity insights and health trends</p>
      </div>
      <button
        class="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-all"
        on:click={onClose}
        aria-label="Close analytics"
      >
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6">
      
      <!-- Multi-line Performance Chart -->
      <div class="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl p-6 border border-gray-600/50 mb-6 backdrop-blur-sm">
        <h3 class="text-xl font-bold text-white mb-2">Weekly Performance Trends</h3>
        <p class="text-sm text-gray-400 mb-6">Tasks, Sleep (9h = 100%), and Hydration progress over the week</p>
        
        <!-- Chart Area -->
        <div class="relative h-80 bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
          <!-- Y-axis labels -->
          <div class="absolute left-0 top-0 h-full flex flex-col justify-between py-4 pr-2 text-xs text-gray-400">
            <span>100%</span>
            <span>80%</span>
            <span>60%</span>
            <span>40%</span>
            <span>20%</span>
            <span>0%</span>
          </div>
          
          <!-- Chart Container -->
          <div class="ml-8 mr-4 h-full relative">
            <!-- Grid lines -->
            <div class="absolute inset-0 grid grid-rows-5 grid-cols-7 opacity-20">
              {#each Array(5) as _, i}
                <div class="col-span-7 border-b border-gray-600"></div>
              {/each}
              {#each Array(7) as _, i}
                <div class="row-span-5 border-r border-gray-600"></div>
              {/each}
            </div>
            
            <!-- SVG for the lines -->
            <svg class="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <!-- Task Completion Line (Green) -->
              <polyline
                fill="none"
                stroke="#10B981"
                stroke-width="0.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                points={weeklyData.map((day, i) => `${(i * 100) / 6},${100 - day.taskPercentage}`).join(' ')}
              />
              
              <!-- Sleep Line (Purple) -->
              <polyline
                fill="none"
                stroke="#8B5CF6"
                stroke-width="0.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                points={weeklyData.map((day, i) => `${(i * 100) / 6},${100 - day.sleepPercentage}`).join(' ')}
              />
              
              <!-- Water Intake Line (Blue) -->
              <polyline
                fill="none"
                stroke="#3B82F6"
                stroke-width="0.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                points={weeklyData.map((day, i) => `${(i * 100) / 6},${100 - day.waterPercentage}`).join(' ')}
              />
              
              <!-- Data points -->
              {#each weeklyData as day, i}
                <!-- Task points -->
                <circle
                  cx={i * 100 / 6}
                  cy={100 - day.taskPercentage}
                  r="1.2"
                  fill="#10B981"
                  class="drop-shadow-sm"
                />
                <!-- Sleep points -->
                <circle
                  cx={i * 100 / 6}
                  cy={100 - day.sleepPercentage}
                  r="1.2"
                  fill="#8B5CF6"
                  class="drop-shadow-sm"
                />
                <!-- Water points -->
                <circle
                  cx={i * 100 / 6}
                  cy={100 - day.waterPercentage}
                  r="1.2"
                  fill="#3B82F6"
                  class="drop-shadow-sm"
                />
              {/each}
            </svg>
            
            <!-- X-axis labels -->
            <div class="absolute bottom-0 left-0 right-0 flex justify-between transform translate-y-6 text-xs text-gray-400">
              {#each weeklyData as day}
                <span class="text-center">{day.dayName}</span>
              {/each}
            </div>
          </div>
        </div>
        
        <!-- Legend -->
        <div class="flex justify-center gap-8 mt-8">
          <div class="flex items-center gap-2">
            <div class="w-4 h-0.5 bg-emerald-500 rounded"></div>
            <span class="text-sm text-gray-300">Tasks ({averages.taskAvg}%)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-0.5 bg-purple-500 rounded"></div>
            <span class="text-sm text-gray-300">Sleep ({averages.sleepAvg}%)</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-0.5 bg-blue-500 rounded"></div>
            <span class="text-sm text-gray-300">Hydration ({averages.waterAvg}%)</span>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        <!-- Task Progress Chart -->
        <div class="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <h3 class="text-lg font-bold text-white mb-4">Task Progress</h3>
          <div class="space-y-3">
            {#each weeklyData as day}
              <div class="flex items-center gap-3">
                <div class="w-16 text-sm text-gray-400 text-right">{day.dayName}</div>
                <div class="flex-1 bg-gray-700/50 rounded-full h-6 relative">
                  <div 
                    class="bg-gradient-to-r from-green-500 to-emerald-400 h-6 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                    style="width: {day.taskPercentage}%"
                  >
                    {#if day.taskPercentage > 15}
                      <span class="text-xs font-bold text-white">{day.taskPercentage}%</span>
                    {/if}
                  </div>
                  {#if day.taskPercentage <= 15 && day.taskPercentage > 0}
                    <span class="absolute right-2 top-1 text-xs font-bold text-gray-300">{day.taskPercentage}%</span>
                  {/if}
                </div>
                <div class="w-16 text-sm text-gray-400">{day.completed}/{day.total}</div>
              </div>
            {/each}
          </div>
        </div>
        
        <!-- Completion Stats -->
        <div class="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <h3 class="text-lg font-bold text-white mb-4"> Overall Stats</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <p class="text-3xl font-bold text-green-400">{completionStats.completionRate}%</p>
              <p class="text-sm text-gray-400">Completion Rate</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-blue-400">{completionStats.completed}</p>
              <p class="text-sm text-gray-400">Tasks Done</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-purple-400">{completionStats.totalPlannedTime}h</p>
              <p class="text-sm text-gray-400">Planned Time</p>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold text-orange-400">{completionStats.efficiency}%</p>
              <p class="text-sm text-gray-400">Efficiency</p>
            </div>
          </div>
        </div>
        
        <!-- Priority Distribution -->
        <div class="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <h3 class="text-lg font-bold text-white mb-4"> Priority Distribution</h3>
          <div class="space-y-3">
            {#each Object.entries(priorityDist) as [priority, count]}
              {#if count > 0}
                <div class="flex items-center gap-3">
                  <div 
                    class="w-8 h-6 rounded flex items-center justify-center text-xs font-bold text-white"
                    style="background-color: {getPriorityColor(priority)}"
                  >
                    {priority}
                  </div>
                  <div class="flex-1 bg-gray-700/50 rounded-full h-4">
                    <div 
                      class="h-4 rounded-full transition-all duration-700"
                      style="width: {(count / Math.max(...Object.values(priorityDist))) * 100}%; background-color: {getPriorityColor(priority)}"
                    ></div>
                  </div>
                  <div class="w-8 text-sm text-gray-400 text-right">{count}</div>
                </div>
              {/if}
            {/each}
          </div>
        </div>
        
        <!-- Sleep Analytics -->
        <div class="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <h3 class="text-lg font-bold text-white mb-4">Sleep Analysis</h3>
          <div class="space-y-4">
            <div class="flex items-end gap-1 h-24">
              {#each weeklyData as day}
                <div class="flex-1 bg-gray-700/50 rounded-t flex flex-col justify-end relative group">
                  <div 
                    class="bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t transition-all duration-500"
                    style="height: {Math.min((day.sleepHours / 10) * 100, 100)}%"
                  ></div>
                  <div class="absolute -bottom-5 left-0 right-0 text-center">
                    <span class="text-xs text-gray-500">{day.dayName.slice(0, 3)}</span>
                  </div>
                  <!-- Tooltip -->
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.sleepHours.toFixed(1)}h ({day.sleepPercentage}%)
                  </div>
                </div>
              {/each}
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-purple-400">{averages.sleepHoursAvg}h</p>
              <p class="text-sm text-gray-400">Weekly Average</p>
            </div>
          </div>
        </div>
        
        <!-- Hydration Analytics (Simplified) -->
        <div class="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <h3 class="text-lg font-bold text-white mb-4">Hydration Analysis</h3>
          <div class="space-y-4">
            <div class="flex items-end gap-1 h-24">
              {#each weeklyData as day}
                <div class="flex-1 bg-gray-700/50 rounded-t flex flex-col justify-end relative group">
                  <div 
                    class="bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t transition-all duration-500"
                    style="height: {Math.min((day.waterIntake / 5) * 100, 100)}%"
                  ></div>
                  <div class="absolute -bottom-5 left-0 right-0 text-center">
                    <span class="text-xs text-gray-500">{day.dayName.slice(0, 3)}</span>
                  </div>
                  <!-- Tooltip -->
                  <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {day.waterIntake.toFixed(1)}L ({day.waterPercentage}%)
                  </div>
                </div>
              {/each}
            </div>
            <div class="text-center">
              <p class="text-2xl font-bold text-cyan-400">{averages.waterLitersAvg}L</p>
              <p class="text-sm text-gray-400">Weekly Average</p>
            </div>
          </div>
        </div>
        
        <!-- Weekly Summary -->
        <div class="bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-xl p-6 border border-gray-600/50 backdrop-blur-sm">
          <h3 class="text-lg font-bold text-white mb-4">Weekly Summary</h3>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-gray-400"> Task Completion:</span>
              <span class="text-green-400 font-bold">{averages.taskAvg}%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-400"> Sleep Quality:</span>
              <span class="text-purple-400 font-bold">{averages.sleepAvg}%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-400"> Hydration Goal:</span>
              <span class="text-blue-400 font-bold">{averages.waterAvg}%</span>
            </div>
            <div class="pt-2 border-t border-gray-600">
              <div class="text-center">
                <p class="text-xs text-gray-500 mb-1">Overall Wellness Score</p>
                <p class="text-2xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {Math.round((averages.taskAvg + averages.sleepAvg + averages.waterAvg) / 3)}%
                </p>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  </div>
</div>