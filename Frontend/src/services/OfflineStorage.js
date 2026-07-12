import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Keys ────────────────────────────────────────────────────────────
const KEYS = {
  DASHBOARD_CACHE: 'ms_dashboard_cache',
  USER_PROFILE: 'ms_user_profile',
  SYNC_QUEUE: 'ms_sync_queue',
  USER_ID: 'ms_user_id',
};

// ─── Save dashboard data to local cache ─────────────────────────────────────
export async function cacheDashboardData(userId, data) {
  try {
    const payload = {
      userId,
      data,
      cachedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(KEYS.DASHBOARD_CACHE, JSON.stringify(payload));
  } catch (e) {
    console.warn('OfflineStorage: Failed to cache dashboard', e);
  }
}

// ─── Load cached dashboard data ──────────────────────────────────────────────
export async function getCachedDashboardData(userId) {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DASHBOARD_CACHE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Only return cache for the same user
    if (parsed.userId !== userId) return null;
    return parsed;
  } catch (e) {
    console.warn('OfflineStorage: Failed to load dashboard cache', e);
    return null;
  }
}

// ─── Save logged-in user ID for auto-restore ─────────────────────────────────
export async function saveUserId(userId) {
  try {
    await AsyncStorage.setItem(KEYS.USER_ID, userId);
  } catch (e) {
    console.warn('OfflineStorage: Failed to save userId', e);
  }
}

export async function getSavedUserId() {
  try {
    return await AsyncStorage.getItem(KEYS.USER_ID);
  } catch (e) {
    return null;
  }
}

export async function clearSavedUserId() {
  try {
    await AsyncStorage.removeItem(KEYS.USER_ID);
  } catch (e) { }
}

// ─── Sync Queue (offline actions) ────────────────────────────────────────────
export async function getSyncQueue() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SYNC_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function addToSyncQueue(action) {
  try {
    const queue = await getSyncQueue();
    queue.push({
      ...action,
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      queuedAt: new Date().toISOString(),
    });
    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(queue));
    console.log('OfflineStorage: Queued action:', action.type);
  } catch (e) {
    console.warn('OfflineStorage: Failed to queue action', e);
  }
}

export async function removeFromSyncQueue(actionId) {
  try {
    const queue = await getSyncQueue();
    const updated = queue.filter(item => item.id !== actionId);
    await AsyncStorage.setItem(KEYS.SYNC_QUEUE, JSON.stringify(updated));
  } catch (e) {
    console.warn('OfflineStorage: Failed to remove from queue', e);
  }
}

export async function clearSyncQueue() {
  try {
    await AsyncStorage.removeItem(KEYS.SYNC_QUEUE);
  } catch (e) { }
}

// ─── Sync pending queue to backend ───────────────────────────────────────────
export async function syncQueueToBackend(apiUrl) {
  const queue = await getSyncQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  console.log(`OfflineStorage: Syncing ${queue.length} queued actions...`);

  let synced = 0;
  let failed = 0;

  for (const action of queue) {
    try {
      let url = '';
      let body = action.payload;
      let method = 'POST';

      switch (action.type) {
        case 'LOG_MEAL':
          url = `${apiUrl}/meals`;
          break;
        case 'DELETE_MEAL':
          url = `${apiUrl}/meals/${action.payload.user_id}/${action.payload.id}`;
          method = 'DELETE';
          body = null;
          break;
        case 'LOG_WORKOUT':
          url = `${apiUrl}/workouts`;
          break;
        case 'LOG_WATER':
          url = `${apiUrl}/water`;
          break;
        case 'LOG_WEIGHT':
          url = `${apiUrl}/update-weight`;
          break;
        default:
          // Unknown action, remove it
          await removeFromSyncQueue(action.id);
          continue;
      }

      const fetchOptions = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      if (response.ok) {
        await removeFromSyncQueue(action.id);
        synced++;
        console.log(`OfflineStorage: Synced action ${action.type}`);
      } else {
        failed++;
        console.warn(`OfflineStorage: Failed to sync ${action.type}`, response.status);
      }
    } catch (e) {
      failed++;
      console.warn(`OfflineStorage: Error syncing ${action.type}`, e);
    }
  }

  return { synced, failed };
}

// ─── Helper to incrementally update dashboard cache offline ───────────────────
export async function updateCachedDashboardField(userId, updates) {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DASHBOARD_CACHE);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.userId !== userId) return;

    const updatedData = { ...parsed.data };

    if (updates.nutrition) {
      updatedData.nutrition = {
        ...updatedData.nutrition,
        ...updates.nutrition,
      };
    }
    if (updates.exercise) {
      updatedData.exercise = {
        ...updatedData.exercise,
        ...updates.exercise,
      };
    }
    if (updates.water) {
      updatedData.water = {
        ...updatedData.water,
        ...updates.water,
      };
    }
    if (updates.profile) {
      updatedData.profile = {
        ...updatedData.profile,
        ...updates.profile,
      };
    }
    if (updates.loggedMealIds !== undefined) {
      updatedData.loggedMealIds = updates.loggedMealIds;
    }

    parsed.data = updatedData;
    await AsyncStorage.setItem(KEYS.DASHBOARD_CACHE, JSON.stringify(parsed));
    console.log('OfflineStorage: Updated local cache successfully.');
  } catch (e) {
    console.warn('OfflineStorage: Failed to update cached dashboard field', e);
  }
}

