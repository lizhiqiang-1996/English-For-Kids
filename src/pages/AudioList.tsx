import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAudioStore } from '@/stores/audioStore'
import { AudioItem } from '@/types/audio'
import AudioListItem from '@/components/AudioListItem'
import SearchBar from '@/components/SearchBar'

// 模拟音频数据
const mockAudioData: AudioItem[] = [
  {
    id: '1',
    title: '夜曲',
    author: '周杰伦',
    duration: 226,
    coverUrl: '/img/coverUrl.png',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    title: '稻香',
    author: '周杰伦',
    duration: 223,
    coverUrl: '/img/coverUrl.png',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    createdAt: '2024-01-02'
  },
  {
    id: '3',
    title: '青花瓷',
    author: '周杰伦',
    duration: 228,
    coverUrl: '/img/coverUrl.png',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    createdAt: '2024-01-03'
  },
  {
    id: '4',
    title: '告白气球',
    author: '周杰伦',
    duration: 207,
    coverUrl: '/img/coverUrl.png',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    createdAt: '2024-01-04'
  },
  {
    id: '5',
    title: '晴天',
    author: '周杰伦',
    duration: 269,
    coverUrl: '/img/coverUrl.png',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    createdAt: '2024-01-05'
  }
]

export default function AudioList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredAudioList, setFilteredAudioList] = useState<AudioItem[]>(mockAudioData)
  const { setPlaylist, playIndex, currentAudio, isPlaying } = useAudioStore()
  const navigate = useNavigate()

  useEffect(() => {
    setPlaylist(mockAudioData)
  }, [setPlaylist])

  useEffect(() => {
    const filtered = mockAudioData.filter(
      audio => 
        audio.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audio.author.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredAudioList(filtered)
  }, [searchTerm])

  const handlePlayAudio = (audio: AudioItem, index: number) => {
    playIndex(index)
    navigate('/player')
  }

  const handlePlayerClick = () => {
    if (currentAudio) {
      navigate('/player')
    }
  }

  return (
    <div className="min-h-screen bg-wechat-light">
      {/* 顶部搜索栏 */}
      <div className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="px-4 py-3">
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>
      </div>

      {/* 音频列表 */}
      <div className="px-4 py-4">
        {filteredAudioList.length === 0 ? (
          <div className="text-center py-8 text-wechat-dark opacity-60">
            <p className="text-sm">未找到相关音频</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAudioList.map((audio, index) => (
              <AudioListItem
                key={audio.id}
                audio={audio}
                index={mockAudioData.findIndex(item => item.id === audio.id)}
                isPlaying={isPlaying && currentAudio?.id === audio.id}
                onPlay={handlePlayAudio}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部播放器预览 */}
      {currentAudio && (
        <div 
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 cursor-pointer"
          onClick={handlePlayerClick}
        >
          <div className="flex items-center space-x-3">
            <img 
              src={currentAudio.coverUrl} 
              alt={currentAudio.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-wechat-dark truncate">{currentAudio.title}</p>
              <p className="text-xs text-gray-500 truncate">{currentAudio.author}</p>
            </div>
            <div className="text-xs text-gray-400">
              {isPlaying ? '正在播放' : '已暂停'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}