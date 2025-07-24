// Replace your existing saveData() and loadData() functions with these:

const STORAGE_KEY = 'hydration_matrix_data';
const PROFILE_KEY = 'hydration_profile_data'; // New key for permanent profile data

async function saveData() {
  // Save daily consumption data (resets daily)
  const dailyData = {
    waterBottles,
    totalConsumed,
    lastResetDate,
    lastSyncTime: new Date().toISOString()
  };
  
  // Save permanent profile data (persists across resets)
  const profileData = {
    userWeight,
    userHeight,
    bmi,
    dailyWaterTarget,
    isSetupComplete
  };
  
  try {
    // Save both to Firebase
    const dailySuccess = await FirebaseStorage.saveHydrationData(dailyData, STORAGE_KEY);
    const profileSuccess = await FirebaseStorage.saveHydrationData(profileData, PROFILE_KEY);
    
    if (dailySuccess && profileSuccess) {
      lastSyncTime = new Date().toLocaleTimeString();
      console.log('Hydration data synced to cloud');
    }
    
    // Always save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dailyData));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
  } catch (error) {
    console.error('Error saving data:', error);
    // Fallback to localStorage only
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dailyData));
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
  }
}

async function loadData() {
  try {
    // Load profile data from Firebase first
    const cloudProfileData = await FirebaseStorage.getItem(PROFILE_KEY);
    const cloudDailyData = await FirebaseStorage.getItem(STORAGE_KEY);
    
    if (cloudProfileData) {
      // Load permanent profile data
      userWeight = cloudProfileData.userWeight || 0;
      userHeight = cloudProfileData.userHeight || 0;
      bmi = cloudProfileData.bmi || 0;
      dailyWaterTarget = cloudProfileData.dailyWaterTarget || 0;
      isSetupComplete = cloudProfileData.isSetupComplete || false;
      console.log('Profile data loaded from cloud');
    }
    
    if (cloudDailyData) {
      // Load daily consumption data
      waterBottles = cloudDailyData.waterBottles || [0, 0, 0, 0];
      totalConsumed = cloudDailyData.totalConsumed || 0;
      lastResetDate = cloudDailyData.lastResetDate || '';
      lastSyncTime = cloudDailyData.lastSyncTime ? new Date(cloudDailyData.lastSyncTime).toLocaleTimeString() : '';
      console.log('Daily data loaded from cloud');
    }
    
    // If cloud data exists, we're done
    if (cloudProfileData || cloudDailyData) {
      return;
    }
  } catch (error) {
    console.error('Error loading from cloud, trying localStorage:', error);
  }
  
  // Fallback to localStorage
  try {
    // Load profile data
    const savedProfile = localStorage.getItem(PROFILE_KEY);
    if (savedProfile) {
      const profileData = JSON.parse(savedProfile);
      userWeight = profileData.userWeight || 0;
      userHeight = profileData.userHeight || 0;
      bmi = profileData.bmi || 0;
      dailyWaterTarget = profileData.dailyWaterTarget || 0;
      isSetupComplete = profileData.isSetupComplete || false;
    }
    
    // Load daily data
    const savedDaily = localStorage.getItem(STORAGE_KEY);
    if (savedDaily) {
      const dailyData = JSON.parse(savedDaily);
      waterBottles = dailyData.waterBottles || [0, 0, 0, 0];
      totalConsumed = dailyData.totalConsumed || 0;
      lastResetDate = dailyData.lastResetDate || '';
    }
    
    console.log('Data loaded from localStorage');
  } catch (error) {
    console.error('Error loading hydration data:', error);
    // Reset to defaults if everything fails
    waterBottles = [0, 0, 0, 0];
    totalConsumed = 0;
    userWeight = 0;
    userHeight = 0;
    bmi = 0;
    dailyWaterTarget = 0;
    isSetupComplete = false;
  }
}

// Also update your resetDailyProgress function to only reset daily data
function resetDailyProgress() {
  waterBottles = [0, 0, 0, 0];
  totalConsumed = 0;
  // Don't reset userWeight, userHeight, bmi, dailyWaterTarget, or isSetupComplete
}
