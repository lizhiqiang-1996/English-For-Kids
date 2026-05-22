// 音频播放器页面逻辑
const app = getApp()

function sortByNumber(a, b) {
  const aNum = parseInt(String(a).match(/\d+/), 10) || 0
  const bNum = parseInt(String(b).match(/\d+/), 10) || 0
  return aNum - bNum
}

Page({
  data: {
    currentAudio: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    playMode: 'sequence',
    progressPercent: 0,
    isFavorited: false,
    isDraggingProgress: false,
    wasPlayingBeforeDrag: false,
    isDraggingVolume: false,
    displayTotalDuration: '00:00',
    displayCurrentTime: '00:00',
    isBuffering: false,
    preloadProgress: 0
  },

  onLoad(options) {
    console.log('播放器页面加载', options)
    
    // 初始化播放器状态
    this.initPlayer()
    
    // 监听音频状态变化
    this.setupAudioListeners()
  },

  onShow() {
    const { playlist, currentIndex, shouldAutoPlayOnPlayerShow } = app.globalData
    if (shouldAutoPlayOnPlayerShow && playlist && playlist.length > 0 && typeof currentIndex === 'number') {
      app.globalData.shouldAutoPlayOnPlayerShow = false
      this.playByIndex(currentIndex)
    } else {
      app.globalData.shouldAutoPlayOnPlayerShow = false
      this.updatePlayerState()
    }
  },

  onUnload() {
    // 清理监听器
    if (this.progressTimer) {
      clearInterval(this.progressTimer)
    }
  },

  // 初始化播放器
  initPlayer() {
    const { currentAudio, isPlaying, currentTime, duration, volume, playMode, favorites } = app.globalData
    
    this.setData({
      currentAudio,
      isPlaying,
      currentTime,
      duration,
      volume,
      playMode,
      isFavorited: currentAudio ? favorites.includes(currentAudio.id) : false,
      isBuffering: app.globalData.isBuffering,
      preloadProgress: app.globalData.preloadProgress || 0
    })
    
    const total = (this.data.duration && !isNaN(this.data.duration) && this.data.duration > 0) ? this.data.duration : 0
    this.setData({
      displayTotalDuration: this.formatTime(total),
      displayCurrentTime: this.formatTime(this.data.currentTime)
    })
    this.updateProgressPercent()
  },

  // 设置音频监听器（事件驱动，避免仅用轮询）
  setupAudioListeners() {
    const mgr = app.globalData.audioManager
    if (!mgr) return

    // 元数据可用时更新总时长
    mgr.onCanplay(() => {
      const duration = mgr.duration || 0
      this.setData({
        duration,
        displayTotalDuration: this.formatTime(duration)
      })
      this.updateProgressPercent()
    })

    // 播放进度更新
    mgr.onTimeUpdate(() => {
      const currentTime = mgr.currentTime || 0
      const duration = mgr.duration || this.data.duration || 0
      this.setData({
        currentTime,
        duration,
        displayCurrentTime: this.formatTime(currentTime),
        displayTotalDuration: this.formatTime(duration)
      })
      this.updateProgressPercent()
    })

    // 播放状态
    mgr.onPlay(() => this.setData({ isPlaying: true }))
    mgr.onPause(() => this.setData({ isPlaying: false }))
    mgr.onStop(() => this.setData({ isPlaying: false }))
  },

  // 更新播放器状态
  updatePlayerState() {
    const { currentAudio, currentTime, duration, volume, playMode, favorites } = app.globalData
    const mgr = app.globalData.audioManager
    const isPlaying = mgr ? !mgr.paused : app.globalData.isPlaying

    this.setData({
      currentAudio,
      isPlaying,
      currentTime,
      duration,
      volume,
      playMode,
      isFavorited: currentAudio ? favorites.includes(currentAudio.id) : false,
      isBuffering: app.globalData.isBuffering,
      preloadProgress: app.globalData.preloadProgress || 0
    })

    const total = (duration && !isNaN(duration) && duration > 0) ? duration : 0
    this.setData({
      displayTotalDuration: this.formatTime(total),
      displayCurrentTime: this.formatTime(currentTime)
    })
    this.updateProgressPercent()
  },

  // 根据索引播放
  playByIndex(index) {
    app.playAudioByIndex(index)
    setTimeout(() => {
      this.updatePlayerState()
    }, 100)
  },

  // 播放/暂停（改为依赖音频事件更新 isPlaying，避免手动切换导致状态不准）
  onPlayPauseTap() {
    const mgr = app.globalData.audioManager
    if (!mgr) return

    if (mgr.paused) {
      app.resumeAudio()
    } else {
      app.pauseAudio()
    }
    // 不直接 setData isPlaying，交由 onPlay/onPause 事件回调更新
  },

  // 上一首
  onPreviousTap() {
    const { playlist, currentIndex } = app.globalData
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1
    this.playByIndex(prevIndex)
  },

  // 下一首
  onNextTap() {
    const { playlist, currentIndex, playMode } = app.globalData
    let nextIndex
    
    if (playMode === 'random') {
      // 随机播放
      nextIndex = Math.floor(Math.random() * playlist.length)
    } else {
      // 顺序播放
      nextIndex = (currentIndex + 1) % playlist.length
    }
    
    this.playByIndex(nextIndex)
  },

  // 切换播放模式
  onModeTap() {
    const newMode = app.togglePlayMode()
    this.setData({ playMode: newMode })
    
    wx.showToast({
      title: this.getModeText(),
      icon: 'none',
      duration: 1500
    })
  },

  // 切换收藏
  onFavoriteTap() {
    if (!this.data.currentAudio) return
    
    const isFavorited = app.toggleFavorite(this.data.currentAudio.id)
    this.setData({ isFavorited })
    
    wx.showToast({
      title: isFavorited ? '已收藏' : '取消收藏',
      icon: 'success',
      duration: 1500
    })
  },

  onBackToCurrentAudioTap() {
    const currentAudio = this.data.currentAudio
    if (!currentAudio || !currentAudio.bookKey) {
      wx.showToast({
        title: '未找到对应课本',
        icon: 'none'
      })
      return
    }

    const bookAudioList = (app.globalData.audioList || []).filter(item => item.bookKey === currentAudio.bookKey)
    const unitGroups = this.buildBookUnitGroups(bookAudioList, currentAudio)

    app.globalData.bookPageState = {
      ...(app.globalData.bookPageState || {}),
      selectedBookKey: currentAudio.bookKey,
      selectedBookTitle: currentAudio.bookTitle || '',
      selectedBookCover: currentAudio.bookCover || '',
      unitGroups,
      scrollTop: 0,
      targetAudioId: currentAudio.id
    }

    wx.switchTab({
      url: '/pages/books/books'
    })
  },

  buildBookUnitGroups(audioList, currentAudio) {
    const unitMap = {}
    ;(audioList || []).forEach(item => {
      const unitLabel = item.unitLabel || '未分组'
      const lesson = item.lesson || '未分课'
      if (!unitMap[unitLabel]) {
        unitMap[unitLabel] = {}
      }
      if (!unitMap[unitLabel][lesson]) {
        unitMap[unitLabel][lesson] = []
      }
      unitMap[unitLabel][lesson].push(item)
    })

    return Object.keys(unitMap)
      .sort(sortByNumber)
      .map(unitLabel => ({
        unitLabel,
        open: unitLabel === currentAudio.unitLabel,
        lessons: Object.keys(unitMap[unitLabel])
          .sort(sortByNumber)
          .map(lesson => ({
            lesson,
            open: unitLabel === currentAudio.unitLabel && lesson === currentAudio.lesson,
            items: unitMap[unitLabel][lesson]
          }))
      }))
  },

  // 返回列表
  onListTap() {
    wx.navigateBack()
  },

  // 进度条触摸开始（开始拖动时暂停播放）
  onProgressTouchStart(e) {
    if (!this.data.currentAudio || !this.data.duration || this.data.duration <= 0) {
      wx.showToast({ title: '音频未就绪', icon: 'none' })
      return
    }
    this.data.isDraggingProgress = true
    this.updateProgressFromTouch(e)
    // 拖动期间暂停播放
    app.pauseAudio()
  },

  // 进度条触摸移动
  onProgressTouchMove(e) {
    if (this.data.isDraggingProgress) {
      this.updateProgressFromTouch(e)
    }
  },

  // 进度条触摸结束（松开后跳转并继续播放）
  onProgressTouchEnd(e) {
    if (this.data.isDraggingProgress) {
      this.updateProgressFromTouch(e)
      this.data.isDraggingProgress = false

      const seekTime = this.data.progressPercent / 100 * this.data.duration
      app.seekAudio(seekTime)
      // 松开后继续播放
      app.resumeAudio()
    }
  },

  // 根据触摸更新进度（增加边界保护与立即更新显示）
  updateProgressFromTouch(e) {
    const { duration } = this.data
    if (!duration || isNaN(duration) || duration <= 0) return

    const touchX = this.getTouchX(e)
    const query = this.createSelectorQuery()
    query.select('.player-progress-bar').boundingClientRect()
    query.exec((res) => {
      if (res && res[0]) {
        const { left, width } = res[0]
        if (!width || width <= 0) return
        const ratio = Math.max(0, Math.min(1, (touchX - left) / width))
        const newTime = ratio * duration
        this.setData({
          progressPercent: ratio * 100,
          currentTime: newTime,
          displayCurrentTime: this.formatTime(newTime)
        })
      }
    })
  },

  // 音量条触摸开始
  onVolumeTouchStart(e) {
    this.data.isDraggingVolume = true
    this.updateVolumeFromTouch(e)
  },

  // 音量条触摸移动
  onVolumeTouchMove(e) {
    if (this.data.isDraggingVolume) {
      this.updateVolumeFromTouch(e)
    }
  },

  // 音量条触摸结束
  onVolumeTouchEnd(e) {
    if (this.data.isDraggingVolume) {
      this.updateVolumeFromTouch(e)
      this.data.isDraggingVolume = false
    }
  },

  // 根据触摸更新音量
  updateVolumeFromTouch(e) {
    const touchX = this.getTouchX(e)
    const query = this.createSelectorQuery()
    query.select('.player-volume-bar').boundingClientRect()
    query.exec((res) => {
      if (res[0]) {
        const { left, width } = res[0]
        if (!width || width <= 0) return
        const volume = Math.max(0, Math.min(1, (touchX - left) / width))
        this.setData({ volume })
        app.setVolume(volume)
      }
    })
  },

  getTouchX(e) {
    const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || {}
    return touch.pageX || touch.clientX || 0
  },

  // 更新进度百分比
  updateProgressPercent() {
    const { currentTime, duration } = this.data
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
    this.setData({ progressPercent })
  },

  // 格式化时间
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00'
    
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  },

  // 获取播放模式图标
  getModeIcon() {
    const modeIcons = {
      sequence: '/img/repeat-outline-dark.svg',
      single: '/img/repeat-one-outline-dark.svg',
      random: '/img/shuffle-outline-dark.svg'
    }
    return modeIcons[this.data.playMode] || '/img/repeat-outline-dark.svg'
  },

  // 获取播放模式文本
  getModeText() {
    const modeTexts = {
      sequence: '顺序播放',
      single: '单曲循环',
      random: '随机播放'
    }
    return modeTexts[this.data.playMode] || '顺序播放'
  },

  // 分享功能
  onShareAppMessage() {
    if (!this.data.currentAudio) {
      return {
        title: '音频播放器 - 发现好音乐',
        path: '/pages/index/index'
      }
    }
    
    return {
      title: `正在听：${this.data.currentAudio.title} - ${this.data.currentAudio.author}`,
      path: `/pages/player/player?audioId=${this.data.currentAudio.id}`,
      imageUrl: this.data.currentAudio.coverUrl
    }
  }
})
