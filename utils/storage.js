// 本地存储管理工具
class StorageManager {
  constructor() {
    this.prefix = 'audio_player_'
  }

  // 生成带前缀的key
  getKey(key) {
    return this.prefix + key
  }

  // 设置数据
  set(key, data) {
    try {
      const storageKey = this.getKey(key)
      wx.setStorageSync(storageKey, data)
      return true
    } catch (error) {
      console.error('存储数据失败:', error)
      return false
    }
  }

  // 获取数据
  get(key, defaultValue = null) {
    try {
      const storageKey = this.getKey(key)
      const data = wx.getStorageSync(storageKey)
      return data !== '' ? data : defaultValue
    } catch (error) {
      console.error('获取数据失败:', error)
      return defaultValue
    }
  }

  // 删除数据
  remove(key) {
    try {
      const storageKey = this.getKey(key)
      wx.removeStorageSync(storageKey)
      return true
    } catch (error) {
      console.error('删除数据失败:', error)
      return false
    }
  }

  // 清空所有数据
  clear() {
    try {
      // 只清空本应用相关的数据
      const keys = wx.getStorageInfoSync().keys
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          wx.removeStorageSync(key)
        }
      })
      return true
    } catch (error) {
      console.error('清空数据失败:', error)
      return false
    }
  }

  // 获取所有key
  getAllKeys() {
    try {
      const keys = wx.getStorageInfoSync().keys
      return keys.filter(key => key.startsWith(this.prefix))
    } catch (error) {
      console.error('获取key列表失败:', error)
      return []
    }
  }

  // 获取存储信息
  getStorageInfo() {
    try {
      return wx.getStorageInfoSync()
    } catch (error) {
      console.error('获取存储信息失败:', error)
      return null
    }
  }

  // 保存用户数据
  saveUserData(data) {
    return this.set('user_data', {
      ...this.getUserData(),
      ...data,
      updateTime: Date.now()
    })
  }

  // 获取用户数据
  getUserData() {
    return this.get('user_data', {
      favorites: [],
      volume: 0.8,
      playMode: 'sequence',
      playHistory: [],
      settings: {}
    })
  }

  // 保存收藏列表
  saveFavorites(favorites) {
    return this.saveUserData({ favorites })
  }

  // 获取收藏列表
  getFavorites() {
    return this.getUserData().favorites || []
  }

  // 保存播放历史
  savePlayHistory(history) {
    return this.saveUserData({ playHistory: history })
  }

  // 获取播放历史
  getPlayHistory() {
    return this.getUserData().playHistory || []
  }

  // 保存播放器设置
  savePlayerSettings(settings) {
    return this.saveUserData({ settings })
  }

  // 获取播放器设置
  getPlayerSettings() {
    return this.getUserData().settings || {}
  }
}

// 创建单例实例
const storageManager = new StorageManager()

module.exports = {
  StorageManager,
  storageManager
}