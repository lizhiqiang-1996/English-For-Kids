const { storageManager } = require('./utils/storage.js')
const { audioManager } = require('./utils/audio.js')
const CONSTANTS = require('./utils/constant.js')

App({
  onLaunch() {
    console.log('音频播放器小程序启动')

    // 初始化全局数据
    this.globalData = {
      audioList: [],
      currentAudio: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      playMode: 'sequence', // sequence, single, random
      playlist: [],
      currentIndex: 0,
      shouldAutoPlayOnPlayerShow: false,
      favorites: [],
      audioManager: null
      ,
      cachedSources: {},
      isBuffering: false,
      preloadTask: null,
      preloadProgress: 0,
      bookPageState: {
        selectedBookKey: '',
        selectedBookTitle: '',
        selectedBookCover: '',
        unitGroups: [],
        scrollTop: 0
      }
    }
    
    // 创建音频管理器
    this.createAudioManager()
    
    // 加载本地数据
    this.loadLocalData()
  },

  onShow() {
    console.log('小程序显示')
  },

  onHide() {
    console.log('小程序隐藏')
  },

  onError(msg) {
    console.log('小程序错误:', msg)
  },

  // 创建音频管理器
  createAudioManager() {
    // 统一使用 utils/audio.js 的单例
    const mgr = audioManager
    mgr.init()

    // 将实例挂到全局，方便页面访问
    this.globalData.audioManager = mgr.audioContext

    // 绑定事件到更新全局状态
    mgr.audioContext.onWaiting(() => {
      this.globalData.isBuffering = true
    })
    mgr.audioContext.onCanplay(() => {
      this.globalData.isBuffering = false
      this.globalData.duration = mgr.audioContext.duration || this.globalData.duration
    })

    mgr.audioContext.onPlay(() => {
      this.globalData.isPlaying = true
    })
    mgr.audioContext.onPause(() => {
      this.globalData.isPlaying = false
    })
    mgr.audioContext.onStop(() => {
      this.globalData.isPlaying = false
    })
    mgr.audioContext.onEnded(() => {
      this.globalData.isPlaying = false
      this.autoPlayNext()
    })
    mgr.audioContext.onTimeUpdate(() => {
      this.globalData.currentTime = mgr.audioContext.currentTime
      this.globalData.duration = mgr.audioContext.duration
    })
    mgr.audioContext.onError((err) => {
      console.error('音频播放错误:', err)
      wx.showToast({ title: '播放失败', icon: 'error' })
    })
  },

  // 自动播放下一首
  autoPlayNext() {
    const { playMode, currentIndex, playlist } = this.globalData
    
    if (playMode === 'single') {
      // 单曲循环，重新播放当前音频
      this.playAudio(this.globalData.currentAudio)
    } else if (playMode === 'random') {
      // 随机播放
      const randomIndex = Math.floor(Math.random() * playlist.length)
      this.playAudioByIndex(randomIndex)
    } else {
      // 顺序播放
      const nextIndex = (currentIndex + 1) % playlist.length
      this.playAudioByIndex(nextIndex)
    }
  },

  // 播放音频
  playAudio(audio) {
    if (!audio || !this.globalData.audioManager) return

    this.globalData.currentAudio = audio

    // 改为边下边播：始终使用远程 URL 进行流式播放
    audioManager.play(audio.audioUrl, {
      title: audio.title,
      autoplay: true,
      volume: this.globalData.volume
    })

    this.globalData.duration = 0

    // 更新播放记录
    this.updatePlayHistory(audio.id)

  },

  // 根据索引播放音频
  playAudioByIndex(index) {
    const { playlist } = this.globalData
    if (index >= 0 && index < playlist.length) {
      this.globalData.currentIndex = index
      this.playAudio(playlist[index])
    }
  },

  // 暂停播放
  pauseAudio() {
    audioManager.pause()
  },

  // 继续播放
  resumeAudio() {
    audioManager.resume()
  },

  // 停止播放
  stopAudio() {
    audioManager.stop()
  },

  // 设置播放进度
  seekAudio(time) {
    audioManager.seek(time)
  },

  // 设置音量
  setVolume(volume) {
    this.globalData.volume = volume
    audioManager.setVolume(volume)
    this.saveLocalData()
  },

  // 切换播放模式
  togglePlayMode() {
    const modes = ['sequence', 'single', 'random']
    const currentIndex = modes.indexOf(this.globalData.playMode)
    const nextIndex = (currentIndex + 1) % modes.length
    this.globalData.playMode = modes[nextIndex]
    this.saveLocalData()
    return this.globalData.playMode
  },

  // 启动预加载下一首
  startPreloadNext() {
    // 已禁用预加载下一首，保持纯流式播放
  },

  // 切换收藏状态
  toggleFavorite(audioId) {
    const { favorites } = this.globalData
    const index = favorites.indexOf(audioId)
    
    if (index > -1) {
      favorites.splice(index, 1)
    } else {
      favorites.push(audioId)
    }
    
    this.saveLocalData()
    return favorites.includes(audioId)
  },

  // 更新播放历史
  updatePlayHistory(audioId) {
    const history = storageManager.get(CONSTANTS.STORAGE.PLAY_HISTORY_KEY, [])
    const existingIndex = history.findIndex(item => item.audioId === audioId)
    if (existingIndex > -1) history.splice(existingIndex, 1)
    history.unshift({ audioId, timestamp: Date.now() })
    if (history.length > CONSTANTS.AUDIO.MAX_HISTORY_LENGTH) history.splice(CONSTANTS.AUDIO.MAX_HISTORY_LENGTH)
    storageManager.set(CONSTANTS.STORAGE.PLAY_HISTORY_KEY, history)
  },

  // 保存本地数据
  saveLocalData() {
    const data = {
      favorites: this.globalData.favorites,
      volume: this.globalData.volume,
      playMode: this.globalData.playMode
    }
    // 统一使用 utils/storage.js
    storageManager.set(CONSTANTS.STORAGE.USER_DATA_KEY, data)
  },

  // 加载本地数据
  loadLocalData() {
    try {
      const data = storageManager.get(CONSTANTS.STORAGE.USER_DATA_KEY) || {}
      this.globalData.favorites = data.favorites || []
      this.globalData.volume = data.volume || CONSTANTS.AUDIO.DEFAULT_VOLUME
      this.globalData.playMode = data.playMode || CONSTANTS.AUDIO.DEFAULT_PLAY_MODE

      audioManager.setVolume(this.globalData.volume)
    } catch (e) {
      console.log('加载本地数据失败:', e)
    }
  },

  // 获取音频列表（模拟数据）
  getAudioList() {
    return [
      {
        id: '1',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 1 Lesson 1 Look and say.mp3',
        unit: 'Unit 1',
        lesson: 'Lesson 1'
      },
      {
        id: '2',
        title: 'Look and Chant',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 1 Lesson 1 Look and chant.mp3',
        unit: 'Unit 1',
        lesson: 'Lesson 1'
      },
      {
        id: '3',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 1 Lesson 2 Look and say.mp3',
        unit: 'Unit 1',
        lesson: 'Lesson 2'
      },
      {
        id: '4',
        title: 'Look and Read',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 1 Lesson 2 Look and read.mp3',
        unit: 'Unit 1',
        lesson: 'Lesson 2'
      },
      {
        id: '5',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 2 Lesson 1 Look and say.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 1'
      },
      {
        id: '6',
        title: 'Look and Sing',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 2 Lesson 1 Look and sing.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 1'
      },
      {
        id: '7',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 2 Lesson 2 Look and say.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 2'
      },
      {
        id: '8',
        title: 'Look and Choose',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 2 Lesson 2 Look and choose.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 2'
      },
      {
        id: '9',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 3 Lesson 1 Look and say.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 1'
      },
      {
        id: '10',
        title: 'Look and Point',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 3 Lesson 1 Look and point.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 1'
      },
      {
        id: '11',
        title: 'Look and chant',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 3 Lesson 1 Look and chant.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 1'
      },
      {
        id: '12',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 3 Lesson 2 Look and say.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 2'
      },
      {
        id: '13',
        title: 'Look and Sing',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 3 Lesson 2 Look and sing.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 2'
      },
      {
        id: '14',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 4 Lesson 1 Look and say.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 1'
      },
      {
        id: '15',
        title: 'Look and Sing',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 4 Lesson 1 Look and sing.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 1'
      },
      {
        id: '16',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 4 Lesson 2 Look and say.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 2'
      },
      {
        id: '17',
        title: 'Look and Draw',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 4 Lesson 2 Look and draw.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 2'
      },
      {
        id: '18',
        title: 'Look and Act',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 4 Lesson 2 Look and act.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 2'
      },
      {
        id: '19',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 5 Lesson 1 Look and say.mp3',
        unit: 'Unit 5',
        lesson: 'Lesson 1'
      },
      {
        id: '20',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 5 Lesson 2 Look and say.mp3',
        unit: 'Unit 5',
        lesson: 'Lesson 2'
      },
      {
        id: '21',
        title: 'Look and Number',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 5 Lesson 2 Look and number.mp3',
        unit: 'Unit 5',
        lesson: 'Lesson 2'
      },
      {
        id: '22',
        title: 'Look and Number',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 5 Lesson 2 Look and number.mp3',
        unit: 'Unit 5',
        lesson: 'Lesson 2'
      },
      {
        id: '23',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 6 Lesson 1 Look and say.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 1'
      },
      {
        id: '24',
        title: 'Look and Paint',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 6 Lesson 1 Look and paint.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 1'
      },
      {
        id: '25',
        title: 'Look and Sing',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 6 Lesson 1 Look and sing.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 1'
      },
      {
        id: '26',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 6 Lesson 2 Look and say.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 2'
      },
      {
        id: '27',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 7 Lesson 1 Look and say.mp3',
        unit: 'Unit 7',
        lesson: 'Lesson 1'
      },
      {
        id: '28',
        title: 'Look and Sing',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 7 Lesson 1 Look and sing.mp3',
        unit: 'Unit 7',
        lesson: 'Lesson 1'
      },
      {
        id: '29',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 7 Lesson 2 Look and say.mp3',
        unit: 'Unit 7',
        lesson: 'Lesson 2'
      },
      {
        id: '30',
        title: 'Look and Chant',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 7 Lesson 2 Look and chant.mp3',
        unit: 'Unit 7',
        lesson: 'Lesson 2'
      },
      {
        id: '31',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 8 Lesson 1 Look and say.mp3',
        unit: 'Unit 8',
        lesson: 'Lesson 1'
      },
      {
        id: '32',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 8 Lesson 2 Look and say.mp3',
        unit: 'Unit 8',
        lesson: 'Lesson 2'
      },
      {
        id: '33',
        title: 'Look and Chant',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1A Unit 8 Lesson 2 Look and chant.mp3',
        unit: 'Unit 8',
        lesson: 'Lesson 2'
      },
      {
        id: '101',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 1 Lesson 1 Look and Say.mp3',
        unit: 'Unit 1',
        lesson: 'Lesson 1'
      },
      {
        id: '102',
        title: 'Look and Sing',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 1 Lesson 1 Look and Sing.mp3',
        unit: 'Unit 1',
        lesson: 'Lesson 1'
      },
      {
        id: '103',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 1 Lesson 2 Look and Say.mp3',
        unit: 'Unit 1',
        lesson: 'Lesson 2'
      },
      {
        id: '104',
        title: 'Look and Tick',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 1 Lesson 2 Look and Tick.mp3',
        unit: 'Unit 1',
        lesson: 'Lesson 2'
      },
      {
        id: '105',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 2 Lesson 1 Look and Say.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 1'
      },
      {
        id: '106',
        title: 'Look and Sing',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 2 Lesson 1 Look and Sing.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 1'
      },
      {
        id: '107',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 2 Lesson 2 Look and Say.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 2'
      },
      {
        id: '108',
        title: 'Look and Listen',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 2 Lesson 2 Look and Listen.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 2'
      },
      {
        id: '109',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 3 Lesson 1 Look and Say.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 1'
      },
      {
        id: '110',
        title: 'Look and Match',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 3 Lesson 1 Look and Match.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 1'
      },
      {
        id: '111',
        title: 'Look and Sing',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 3 Lesson 1 Look and Sing.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 1'
      },
      {
        id: '112',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 3 Lesson 2 Look and Say.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 2'
      },
      {
        id: '113',
        title: 'Look and Chant',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 3 Lesson 2 Look and Chant.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 2'
      },
      {
        id: '114',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 4 Lesson 1 Look and Say.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 1'
      },
      {
        id: '115',
        title: 'Look and Tick',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 4 Lesson 1 Look and Tick.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 1'
      },
      {
        id: '116',
        title: 'Look and Play',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 4 Lesson 1 Look and Play.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 1'
      },
      {
        id: '117',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 4 Lesson 2 Look and Say.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 2'
      },
      {
        id: '118',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 5 Lesson 1 Look and Say.mp3',
        unit: 'Unit 5',
        lesson: 'Lesson 1'
      },
      {
        id: '119',
        title: 'Look and Draw',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 5 Lesson 1 Look and Draw.mp3',
        unit: 'Unit 5',
        lesson: 'Lesson 1'
      },
      {
        id: '120',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 5 Lesson 2 Look and Say.mp3',
        unit: 'Unit 5',
        lesson: 'Lesson 2'
      },
      {
        id: '121',
        title: 'Look and Chant',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 5 Lesson 2 Look and Chant.mp3',
        unit: 'Unit 5',
        lesson: 'Lesson 2'
      },
      {
        id: '122',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 6 Lesson 1 Look and Say.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 1'
      },
      {
        id: '123',
        title: 'Look and Match',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 6 Lesson 1 Look and Match.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 1'
      },
      {
        id: '124',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 6 Lesson 2 Look and Say.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 2'
      },
      {
        id: '125',
        title: 'Look and Read',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 6 Lesson 2 Look and Read.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 2'
      },
      {
        id: '126',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 7 Lesson 1 Look and Say.mp3',
        unit: 'Unit 7',
        lesson: 'Lesson 1'
      },
      {
        id: '127',
        title: 'Look and Number',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 7 Lesson 1 Look and Number.mp3',
        unit: 'Unit 7',
        lesson: 'Lesson 1'
      },
      {
        id: '128',
        title: 'Look and Chant',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 7 Lesson 1 Look and Chant.mp3',
        unit: 'Unit 7',
        lesson: 'Lesson 1'
      },
      {
        id: '129',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 7 Lesson 2 Look and Say.mp3',
        unit: 'Unit 7',
        lesson: 'Lesson 2'
      },
      {
        id: '130',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 8 Lesson 1 Look and Say.mp3',
        unit: 'Unit 8',
        lesson: 'Lesson 1'
      },
      {
        id: '131',
        title: 'Look and Draw',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 8 Lesson 1 Look and Draw.mp3',
        unit: 'Unit 8',
        lesson: 'Lesson 1'
      },
      {
        id: '132',
        title: 'Look and Chant',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 8 Lesson 1 Look and Chant.mp3',
        unit: 'Unit 8',
        lesson: 'Lesson 1'
      },
      {
        id: '133',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/1B Unit 8 Lesson 2 Look and Say.mp3',
        unit: 'Unit 8',
        lesson: 'Lesson 2'
      },
      {
        id: '201',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 1 Lesson 1 Look and Say.mp3',
        unit: 'Unit 1',
        lesson: 'Lesson 1'
      },
      {
        id: '202',
        title: 'Look and Number',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 1 Lesson 1 Look and Number.mp3',
        unit: 'Unit 1',
        lesson: 'Lesson 1'
      },
      {
        id: '203',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 1 Lesson 2 Look and Say.mp3',
        unit: 'Unit 1',
        lesson: 'Lesson 2'
      },
      {
        id: '204',
        title: 'Look and Match',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 1 Lesson 2 Look and Match.mp3',
        unit: 'Unit 1',
        lesson: 'Lesson 2'
      },
      {
        id: '205',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 2 Lesson 1 Look and Say.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 1'
      },
      {
        id: '206',
        title: 'Look and Try',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 2 Lesson 1 Look and Try.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 1'
      },
      {
        id: '207',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 2 Lesson 2 Look and Say.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 2'
      },
      {
        id: '208',
        title: 'Look and Match',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 2 Lesson 2 Look and Match.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 2'
      },
      {
        id: '209',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 3 Lesson 1 Look and Say.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 1'
      },
      {
        id: '210',
        title: 'Look and Do',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 3 Lesson 1 Look and Do.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 1'
      },
      {
        id: '211',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 3 Lesson 2 Look and Say.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 2'
      },
      {
        id: '212',
        title: 'Look and Draw',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 3 Lesson 2 Look and Draw.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 2'
      },
      {
        id: '213',
        title: 'Look and Chant',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 3 Lesson 2 Look and Chant.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 2'
      },
      {
        id: '214',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 4 Lesson 1 Look and Say.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 1'
      },
      {
        id: '215',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 4 Lesson 2 Look and Say.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 2'
      },
      {
        id: '216',
        title: 'Look and Tick',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 4 Lesson 2 Look and Tick.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 2'
      },
      {
        id: '217',
        title: 'Look and Read',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 4 Lesson 2 Look and Read.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 2'
      },
      {
        id: '218',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 5 Lesson 1 Look and Say.mp3',
        unit: 'Unit 5',
        lesson: 'Lesson 1'
      },
      {
        id: '219',
        title: 'Look and Sing',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 5 Lesson 1 Look and Sing.mp3',
        unit: 'Unit 5',
        lesson: 'Lesson 1'
      },
      {
        id: '220',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 5 Lesson 2 Look and Say.mp3',
        unit: 'Unit 5',
        lesson: 'Lesson 2'
      },
      {
        id: '221',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 6 Lesson 1 Look and Say.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 1'
      },
      {
        id: '222',
        title: 'Look and Read',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 6 Lesson 1 Look and Read.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 1'
      },
      {
        id: '223',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 6 Lesson 2 Look and Say.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 2'
      },
      {
        id: '224',
        title: 'Look and Match',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 6 Lesson 2 Look and Match.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 2'
      },
      {
        id: '225',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 7 Lesson 1 Look and Say.mp3',
        unit: 'Unit 7',
        lesson: 'Lesson 1'
      },
      {
        id: '226',
        title: 'Look and Read',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 7 Lesson 1 Look and Read.mp3',
        unit: 'Unit 7',
        lesson: 'Lesson 1'
      },
      {
        id: '227',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 7 Lesson 2 Look and Say.mp3',
        unit: 'Unit 7',
        lesson: 'Lesson 2'
      },
      {
        id: '228',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 8 Lesson 1 Look and Say.mp3',
        unit: 'Unit 8',
        lesson: 'Lesson 1'
      },
      {
        id: '229',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 8 Lesson 2 Look and Say.mp3',
        unit: 'Unit 8',
        lesson: 'Lesson 2'
      },
      {
        id: '230',
        title: 'Look and Chant',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2A Unit 8 Lesson 2 Look and Chant.mp3',
        unit: 'Unit 8',
        lesson: 'Lesson 2'
      },
      {
        id: '301',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 1 Lesson 1 Look and Say.mp3',
        unit: 'Unit 1',
        lesson: 'Lesson 1'
      },
      {
        id: '302',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 1 Lesson 2 Look and Say.mp3',
        unit: 'Unit 1',
        lesson: 'Lesson 2'
      },
      {
        id: '303',
        title: 'Look and Read',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 1 Lesson 2 Look and Read.mp3',
        unit: 'Unit 1',
        lesson: 'Lesson 2'
      },
      {
        id: '304',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 2 Lesson 1 Look and Say.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 1'
      },
      {
        id: '305',
        title: 'Look and Listen',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 2 Lesson 1 Look and Listen.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 1'
      },
      {
        id: '306',
        title: 'Look and Chant',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 2 Lesson 1 Look and Chant.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 1'
      },
      {
        id: '307',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 2 Lesson 2 Look and Say.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 2'
      },
      {
        id: '308',
        title: 'Look and Read',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 2 Lesson 2 Look and Read.mp3',
        unit: 'Unit 2',
        lesson: 'Lesson 2'
      },
      {
        id: '309',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 3 Lesson 1 Look and Say.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 1'
      },
      {
        id: '310',
        title: 'Look and Do',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 3 Lesson 1 Look and Do.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 1'
      },
      {
        id: '311',
        title: 'Look and Read',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 3 Lesson 1 Look and Read.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 1'
      },
      {
        id: '312',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 3 Lesson 2 Look and Say.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 2'
      },
      {
        id: '313',
        title: 'Look and Number',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 3 Lesson 2 Look and Number.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 2'
      },
      {
        id: '314',
        title: 'Look and Act',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 3 Lesson 2 Look and Act.mp3',
        unit: 'Unit 3',
        lesson: 'Lesson 2'
      },
      {
        id: '315',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 4 Lesson 1 Look and Say.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 1'
      },
      {
        id: '316',
        title: 'Look and Read',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 4 Lesson 1 Look and Read.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 1'
      },
      {
        id: '317',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 4 Lesson 2 Look and Say.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 2'
      },
      {
        id: '318',
        title: 'Look and Draw',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 4 Lesson 2 Look and Draw.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 2'
      },
      {
        id: '319',
        title: 'Look and Chant',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 4 Lesson 2 Look and Chant.mp3',
        unit: 'Unit 4',
        lesson: 'Lesson 2'
      },
      {
        id: '320',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 5 Lesson 1 Look and Say.mp3',
        unit: 'Unit 5',
        lesson: 'Lesson 1'
      },
      {
        id: '321',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 5 Lesson 2 Look and Say.mp3',
        unit: 'Unit 5',
        lesson: 'Lesson 2'
      },
      {
        id: '322',
        title: 'Look and Draw',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 5 Lesson 2 Look and Draw.mp3',
        unit: 'Unit 5',
        lesson: 'Lesson 2'
      },
      {
        id: '323',
        title: 'Look and Chant',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 5 Lesson 2 Look and Chant.mp3',
        unit: 'Unit 5',
        lesson: 'Lesson 2'
      },
      {
        id: '324',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 6 Lesson 1 Look and Say.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 1'
      },
      {
        id: '325',
        title: 'Look and Read',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 6 Lesson 1 Look and Read.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 1'
      },
      {
        id: '326',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 6 Lesson 2 Look and Say.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 2'
      },
      {
        id: '327',
        title: 'Look and Match',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 6 Lesson 2 Look and Match.mp3',
        unit: 'Unit 6',
        lesson: 'Lesson 2'
      },
      {
        id: '328',
        title: 'Look and Learn',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 7 Lesson 1 Look and Learn.mp3',
        unit: 'Unit 7',
        lesson: 'Lesson 1'
      },
      {
        id: '329',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 7 Lesson 2 Look and Say.mp3',
        unit: 'Unit 7',
        lesson: 'Lesson 2'
      },
      {
        id: '330',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 8 Lesson 1 Look and Say.mp3',
        unit: 'Unit 8',
        lesson: 'Lesson 1'
      },
      {
        id: '331',
        title: 'Look and Read',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 8 Lesson 1 Look and Read.mp3',
        unit: 'Unit 8',
        lesson: 'Lesson 1'
      },
      {
        id: '332',
        title: 'Look and Say',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 8 Lesson 2 Look and Say.mp3',
        unit: 'Unit 8',
        lesson: 'Lesson 2'
      },
      {
        id: '333',
        title: 'Look and Learn',
        coverUrl: '/img/coverUrl.png',
        audioUrl: 'http://video.hzcbs.com/2B Unit 8 Lesson 2 Look and Learn.mp3',
        unit: 'Unit 8',
        lesson: 'Lesson 2'
      }
    ]
  }
})
