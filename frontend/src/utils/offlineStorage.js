import { openDB } from 'idb';

class OfflineStorage {
  constructor() {
    this.dbName = 'TaskManagerDB';
    this.version = 1;
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    this.db = await openDB(this.dbName, this.version, {
      upgrade(db) {
        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const tasksStore = db.createObjectStore('tasks', { keyPath: '_id' });
          tasksStore.createIndex('project', 'project');
          tasksStore.createIndex('assignedTo', 'assignedTo');
          tasksStore.createIndex('status', 'status');
          tasksStore.createIndex('priority', 'priority');
          tasksStore.createIndex('dueDate', 'dueDate');
          tasksStore.createIndex('createdAt', 'createdAt');
        }

        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectsStore = db.createObjectStore('projects', { keyPath: '_id' });
          projectsStore.createIndex('owner', 'owner');
          projectsStore.createIndex('status', 'status');
          projectsStore.createIndex('createdAt', 'createdAt');
        }

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: '_id' });
          usersStore.createIndex('role', 'role');
          usersStore.createIndex('email', 'email');
        }

        // Time entries store
        if (!db.objectStoreNames.contains('timeEntries')) {
          const timeEntriesStore = db.createObjectStore('timeEntries', { keyPath: '_id' });
          timeEntriesStore.createIndex('user', 'user');
          timeEntriesStore.createIndex('task', 'task');
          timeEntriesStore.createIndex('project', 'project');
          timeEntriesStore.createIndex('startTime', 'startTime');
        }

        // Offline actions store
        if (!db.objectStoreNames.contains('offlineActions')) {
          const actionsStore = db.createObjectStore('offlineActions', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          actionsStore.createIndex('timestamp', 'timestamp');
          actionsStore.createIndex('type', 'type');
          actionsStore.createIndex('synced', 'synced');
        }

        // Sync metadata store
        if (!db.objectStoreNames.contains('syncMetadata')) {
          const syncStore = db.createObjectStore('syncMetadata', { keyPath: 'key' });
        }
      },
    });

    return this.db;
  }

  // Generic CRUD operations
  async store(storeName, data) {
    const db = await this.init();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    if (Array.isArray(data)) {
      for (const item of data) {
        await store.put(item);
      }
    } else {
      await store.put(data);
    }
    
    await tx.done;
  }

  async get(storeName, key) {
    const db = await this.init();
    return db.get(storeName, key);
  }

  async getAll(storeName, query = null) {
    const db = await this.init();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    
    if (query) {
      const index = store.index(query.index);
      return index.getAll(query.value);
    }
    
    return store.getAll();
  }

  async delete(storeName, key) {
    const db = await this.init();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).delete(key);
    await tx.done;
  }

  async clear(storeName) {
    const db = await this.init();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).clear();
    await tx.done;
  }

  // Task-specific operations
  async storeTasks(tasks) {
    await this.store('tasks', tasks);
    await this.updateSyncMetadata('tasks', new Date().toISOString());
  }

  async getTasks(filters = {}) {
    let tasks = await this.getAll('tasks');
    
    // Apply filters
    if (filters.project) {
      tasks = tasks.filter(task => task.project === filters.project);
    }
    if (filters.status) {
      tasks = tasks.filter(task => task.status === filters.status);
    }
    if (filters.assignedTo) {
      tasks = tasks.filter(task => task.assignedTo === filters.assignedTo);
    }
    if (filters.priority) {
      tasks = tasks.filter(task => task.priority === filters.priority);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      tasks = tasks.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return tasks;
  }

  async getTask(id) {
    return this.get('tasks', id);
  }

  // Project-specific operations
  async storeProjects(projects) {
    await this.store('projects', projects);
    await this.updateSyncMetadata('projects', new Date().toISOString());
  }

  async getProjects(filters = {}) {
    let projects = await this.getAll('projects');
    
    if (filters.status) {
      projects = projects.filter(project => project.status === filters.status);
    }
    
    return projects;
  }

  async getProject(id) {
    return this.get('projects', id);
  }

  // User-specific operations
  async storeUsers(users) {
    await this.store('users', users);
    await this.updateSyncMetadata('users', new Date().toISOString());
  }

  async getUsers() {
    return this.getAll('users');
  }

  async getUser(id) {
    return this.get('users', id);
  }

  // Time entry operations
  async storeTimeEntries(entries) {
    await this.store('timeEntries', entries);
    await this.updateSyncMetadata('timeEntries', new Date().toISOString());
  }

  async getTimeEntries(filters = {}) {
    let entries = await this.getAll('timeEntries');
    
    if (filters.user) {
      entries = entries.filter(entry => entry.user === filters.user);
    }
    if (filters.task) {
      entries = entries.filter(entry => entry.task === filters.task);
    }
    if (filters.project) {
      entries = entries.filter(entry => entry.project === filters.project);
    }
    
    return entries;
  }

  // Offline actions management
  async storeOfflineAction(action) {
    const db = await this.init();
    const tx = db.transaction('offlineActions', 'readwrite');
    const store = tx.objectStore('offlineActions');
    
    await store.add({
      ...action,
      timestamp: Date.now(),
      synced: false,
      retryCount: 0
    });
    
    await tx.done;
  }

  async getPendingActions() {
    const db = await this.init();
    const tx = db.transaction('offlineActions', 'readonly');
    const store = tx.objectStore('offlineActions');
    const index = store.index('synced');
    
    return index.getAll(false);
  }

  async markActionSynced(actionId) {
    const db = await this.init();
    const tx = db.transaction('offlineActions', 'readwrite');
    const store = tx.objectStore('offlineActions');
    
    const action = await store.get(actionId);
    if (action) {
      action.synced = true;
      action.syncedAt = Date.now();
      await store.put(action);
    }
    
    await tx.done;
  }

  async incrementRetryCount(actionId) {
    const db = await this.init();
    const tx = db.transaction('offlineActions', 'readwrite');
    const store = tx.objectStore('offlineActions');
    
    const action = await store.get(actionId);
    if (action) {
      action.retryCount = (action.retryCount || 0) + 1;
      action.lastRetry = Date.now();
      await store.put(action);
    }
    
    await tx.done;
  }

  async deleteAction(actionId) {
    await this.delete('offlineActions', actionId);
  }

  // Sync metadata management
  async updateSyncMetadata(key, value) {
    await this.store('syncMetadata', { key, value, timestamp: Date.now() });
  }

  async getSyncMetadata(key) {
    return this.get('syncMetadata', key);
  }

  async getLastSyncTime(dataType) {
    const metadata = await this.getSyncMetadata(dataType);
    return metadata ? new Date(metadata.value) : null;
  }

  // Database management
  async clearAllData() {
    const db = await this.init();
    const storeNames = ['tasks', 'projects', 'users', 'timeEntries', 'offlineActions', 'syncMetadata'];
    
    for (const storeName of storeNames) {
      await this.clear(storeName);
    }
  }

  async getStorageInfo() {
    const db = await this.init();
    const info = {};
    
    const storeNames = ['tasks', 'projects', 'users', 'timeEntries', 'offlineActions'];
    
    for (const storeName of storeNames) {
      const count = await db.count(storeName);
      info[storeName] = count;
    }
    
    // Get pending actions count
    const pendingActions = await this.getPendingActions();
    info.pendingActions = pendingActions.length;
    
    return info;
  }

  // Search functionality
  async searchTasks(query) {
    const tasks = await this.getAll('tasks');
    const searchLower = query.toLowerCase();
    
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower) ||
      task.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  async searchProjects(query) {
    const projects = await this.getAll('projects');
    const searchLower = query.toLowerCase();
    
    return projects.filter(project => 
      project.name.toLowerCase().includes(searchLower) ||
      project.description?.toLowerCase().includes(searchLower)
    );
  }
}

export const offlineStorage = new OfflineStorage();