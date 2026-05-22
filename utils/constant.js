// 常量定义
const CONSTANTS = {
  // 音频相关常量
  AUDIO: {
    DEFAULT_VOLUME: 0.8,
    MAX_VOLUME: 1.0,
    MIN_VOLUME: 0.0,
    DEFAULT_PLAY_MODE: 'sequence',
    PLAY_MODES: ['sequence', 'single', 'random'],
    MAX_HISTORY_LENGTH: 50,
    MAX_FAVORITES_LENGTH: 1000
  },

  // 存储相关常量
  STORAGE: {
    USER_DATA_KEY: 'user_data',
    PLAY_HISTORY_KEY: 'play_history',
    FAVORITES_KEY: 'favorites',
    SETTINGS_KEY: 'settings',
    PREFIX: 'audio_player_'
  },

  // 页面相关常量
  PAGES: {
    INDEX: '/pages/index/index',
    PLAYER: '/pages/player/player'
  },

  // 事件名称常量
  EVENTS: {
    AUDIO_STATE_CHANGE: 'audio_state_change',
    AUDIO_TIME_UPDATE: 'audio_time_update',
    AUDIO_ERROR: 'audio_error',
    FAVORITES_UPDATE: 'favorites_update',
    SETTINGS_UPDATE: 'settings_update'
  },

  // 播放状态常量
  PLAY_STATES: {
    PLAYING: 'playing',
    PAUSED: 'paused',
    STOPPED: 'stopped',
    ENDED: 'ended',
    ERROR: 'error'
  },

  // 错误码常量
  ERROR_CODES: {
    NETWORK_ERROR: 1001,
    AUDIO_LOAD_ERROR: 2001,
    PLAYBACK_ERROR: 2002,
    STORAGE_ERROR: 3001,
    PERMISSION_ERROR: 4001
  },

  // 默认音频数据
  DEFAULT_AUDIO_LIST: [
    {
      id: '1',
      title: '轻音乐 - 清晨的阳光',
      author: '放松音乐',
      coverUrl: '/img/coverUrl.png',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: 180
    },
    {
      id: '2',
      title: '古典音乐 - 月光奏鸣曲',
      author: '贝多芬',
      coverUrl: '/img/coverUrl.png',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      duration: 240
    },
    {
      id: '3',
      title: '自然声音 - 海浪声',
      author: '大自然',
      coverUrl: '/img/coverUrl.png',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      duration: 300
    },
    {
      id: '4',
      title: '轻音乐 - 星空下的漫步',
      author: '夜晚音乐',
      coverUrl: '/img/coverUrl.png',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      duration: 200
    },
    {
      id: '5',
      title: '古典音乐 - 春之声',
      author: '约翰·施特劳斯',
      coverUrl: '/img/coverUrl.png',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      duration: 220
    }
  ],

  // UI相关常量
  UI: {
    // 颜色主题
    COLORS: {
      PRIMARY: '#07C160',
      SECONDARY: '#1890FF',
      SUCCESS: '#10B981',
      WARNING: '#F59E0B',
      ERROR: '#EF4444',
      BACKGROUND: '#F5F5F5',
      TEXT_PRIMARY: '#333333',
      TEXT_SECONDARY: '#666666',
      TEXT_DISABLED: '#999999',
      BORDER: '#E5E5E5'
    },
    
    // 间距
    SPACING: {
      XS: 8,
      SM: 16,
      MD: 24,
      LG: 32,
      XL: 48
    },
    
    // 字体大小
    FONT_SIZE: {
      XS: 20,
      SM: 24,
      MD: 28,
      LG: 32,
      XL: 36
    }
  }
}

module.exports = CONSTANTS