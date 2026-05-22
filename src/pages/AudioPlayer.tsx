import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAudioStore } from '@/stores/audioStore'

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const navigate = useNavigate()
  
  const {
    currentAudio,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    setPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    setMuted,
    playNext,
    playPrevious
  } = useAudioStore()

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error)
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentAudio])

  useEffect(() => {
    if (audioRef.current && !isDragging) {
      audioRef.current.currentTime = currentTime
    }
  }, [currentTime, isDragging])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.muted = isMuted
    }
  }, [volume, isMuted])

  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    playNext()
  }

  const togglePlay = () => {
    setPlaying(!isPlaying)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const newTime = (clickX / rect.width) * duration
      setCurrentTime(newTime)
    }
  }

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const newTime = Math.max(0, Math.min((clickX / rect.width) * duration, duration))
      setCurrentTime(newTime)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!currentAudio) {
    return (
      <div className="min-h-screen bg-wechat-light flex items-center justify-center">
        <div className="text-center">
          <p className="text-wechat-dark opacity-60">暂无播放音频</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-wechat-green text-white rounded-lg"
          >
            返回列表
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-wechat-light">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="mr-3 p-2 rounded-full hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-medium text-wechat-dark">正在播放</h1>
        </div>
      </div>

      {/* 音频信息区域 */}
      <div className="px-6 py-8">
        <div className="text-center">
          <img
            src={currentAudio.coverUrl}
            alt={currentAudio.title}
            className="w-52 h-52 mx-auto rounded-2xl shadow-lg mb-6 object-cover"
          />
          <h2 className="text-xl font-medium text-wechat-dark mb-2">{currentAudio.title}</h2>
          <p className="text-base text-gray-500">{currentAudio.author}</p>
        </div>
      </div>

      {/* 进度条 */}
      <div className="px-6 mb-6">
        <div className="mb-2">
          <div
            className="h-2 bg-gray-200 rounded-full cursor-pointer relative"
            onClick={handleProgressClick}
            onMouseDown={() => setIsDragging(true)}
            onMouseMove={handleProgressDrag}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <div
              className="h-full bg-wechat-green rounded-full relative"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-wechat-green rounded-full shadow-md"></div>
            </div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="px-6">
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={playPrevious}
            className="p-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-wechat-green text-white flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M8 5v14l11-7z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <button
            onClick={playNext}
            className="p-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 音量控制 */}
      <div className="px-6 mt-8">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMuted(!isMuted)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M16.5 4.5c-1.61 0-3.09.59-4.23 1.57L8 10H5c-1.1 0-2 .9-2 2v0c0 1.1.9 2 2 2h3l4.27 3.93c1.14.98 2.62 1.57 4.23 1.57V4.5zM18 11c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M16.5 4.5c-1.61 0-3.09.59-4.23 1.57L8 10H5c-1.1 0-2 .9-2 2v0c0 1.1.9 2 2 2h3l4.27 3.93c1.14.98 2.62 1.57 4.23 1.57V4.5zM19.5 12c0-1.38-1.12-2.5-2.5-2.5s-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 隐藏的audio元素 */}
      <audio
        ref={audioRef}
        src={currentAudio.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />
    </div>
  )
}