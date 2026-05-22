import { AudioItem } from '@/types/audio'

interface AudioListItemProps {
  audio: AudioItem
  index: number
  isPlaying: boolean
  onPlay: (audio: AudioItem, index: number) => void
}

export default function AudioListItem({ audio, index, isPlaying, onPlay }: AudioListItemProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3">
        <img 
          src={audio.coverUrl} 
          alt={audio.title}
          className="w-15 h-15 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-wechat-dark truncate">{audio.title}</p>
              <p className="text-sm text-gray-500 truncate">{audio.author}</p>
              <p className="text-xs text-gray-400 mt-1">{formatDuration(audio.duration)}</p>
            </div>
            <button
              onClick={() => onPlay(audio, index)}
              className={`ml-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isPlaying 
                  ? 'bg-wechat-green text-white' 
                  : 'bg-gray-100 text-wechat-dark hover:bg-wechat-green hover:text-white'
              }`}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M8 5v14l11-7z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}