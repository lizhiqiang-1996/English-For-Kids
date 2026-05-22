// 音频播放管理工具
const app = getApp()

class AudioManager {
  constructor() {
    this.audioContext = null
    this.isInitialized = false
  }

  // 初始化音频管理器
  init() {
    if (this.isInitialized) return
    
    this.audioContext = wx.createInnerAudioContext()
    this.setupEventListeners()
    this.isInitialized = true
  }

  // 设置事件监听器
  setupEventListeners() {
    if (!this.audioContext) return

    this.audioContext.onPlay(() => {
      console.log('音频开始播放')
      this.notifyStateChange('play')
    })

    this.audioContext.onPause(() => {
      console.log('音频暂停')
      this.notifyStateChange('pause')
    })

    this.audioContext.onStop(() => {
      console.log('音频停止')
      this.notifyStateChange('stop')
    })

    this.audioContext.onEnded(() => {
      console.log('音频播放结束')
      this.notifyStateChange('ended')
    })

    this.audioContext.onTimeUpdate(() => {
      this.notifyTimeUpdate()
    })

    this.audioContext.onError((err) => {
      console.error('音频播放错误:', err)
      this.notifyError(err)
    })
  }

  // 播放音频
  play(audioUrl, options = {}) {
    if (!this.audioContext) {
      this.init()
    }

    const { title = '', autoplay = true, volume = 0.8 } = options
    
    this.audioContext.src = audioUrl
    this.audioContext.title = title
    this.audioContext.volume = volume
    
    if (autoplay) {
      this.audioContext.play()
    }
  }

  // 暂停播放
  pause() {
    if (this.audioContext) {
      this.audioContext.pause()
    }
  }

  // 继续播放
  resume() {
    if (this.audioContext) {
      this.audioContext.play()
    }
  }

  // 停止播放
  stop() {
    if (this.audioContext) {
      this.audioContext.stop()
    }
  }

  // 跳转到指定时间
  seek(time) {
    if (this.audioContext && time >= 0) {
      this.audioContext.seek(time)
    }
  }

  // 设置音量
  setVolume(volume) {
    if (this.audioContext && volume >= 0 && volume <= 1) {
      this.audioContext.volume = volume
    }
  }

  // 获取当前播放状态
  getCurrentState() {
    if (!this.audioContext) return null

    return {
      currentTime: this.audioContext.currentTime,
      duration: this.audioContext.duration,
      paused: this.audioContext.paused,
      src: this.audioContext.src
    }
  }

  // 通知状态变化
  notifyStateChange(state) {
    // 可以在这里添加全局状态管理
    if (getApp() && getApp().onAudioStateChange) {
      getApp().onAudioStateChange(state)
    }
  }

  // 通知时间更新
  notifyTimeUpdate() {
    if (getApp() && getApp().onAudioTimeUpdate) {
      getApp().onAudioTimeUpdate(this.getCurrentState())
    }
  }

  // 通知错误
  notifyError(error) {
    if (getApp() && getApp().onAudioError) {
      getApp().onAudioError(error)
    }
  }

  // 销毁音频管理器
  destroy() {
    if (this.audioContext) {
      this.audioContext.destroy()
      this.audioContext = null
      this.isInitialized = false
    }
  }
}

// 创建单例实例
const audioManager = new AudioManager()

module.exports = {
  AudioManager,
  audioManager
}