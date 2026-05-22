// 格式化工具
class FormatUtils {
  // 格式化时长 (秒 -> 分:秒)
  static formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00'
    
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 格式化时间戳
  static formatTimestamp(timestamp, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  }

  // 格式化文件大小
  static formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 格式化播放次数
  static formatPlayCount(count) {
    if (!count) return '0'
    
    if (count < 1000) return count.toString()
    if (count < 10000) return (count / 1000).toFixed(1) + 'k'
    if (count < 100000) return (count / 10000).toFixed(1) + 'w'
    return (count / 10000).toFixed(0) + 'w'
  }

  // 格式化音频质量
  static formatAudioQuality(bitrate) {
    if (!bitrate) return '未知'
    
    if (bitrate >= 320000) return '极高'
    if (bitrate >= 192000) return '高'
    if (bitrate >= 128000) return '标准'
    return '低'
  }

  // 格式化播放模式
  static formatPlayMode(mode) {
    const modeMap = {
      'sequence': '顺序播放',
      'single': '单曲循环',
      'random': '随机播放'
    }
    return modeMap[mode] || '顺序播放'
  }

  // 格式化收藏状态
  static formatFavoriteStatus(isFavorited) {
    return isFavorited ? '已收藏' : '未收藏'
  }

  // 截取文本
  static truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // 高亮搜索关键词
  static highlightKeyword(text, keyword) {
    if (!keyword || !text) return text
    
    const regex = new RegExp(`(${keyword})`, 'gi')
    return text.replace(regex, '<span class="highlight">$1</span>')
  }

  // 格式化百分比
  static formatPercentage(value, decimals = 1) {
    if (isNaN(value)) return '0%'
    return (value * 100).toFixed(decimals) + '%'
  }
}

module.exports = {
  FormatUtils
}