export interface AudioItem {
  id: string
  title: string
  author: string
  duration: number
  coverUrl: string
  audioUrl: string
  createdAt: string
}

export interface AudioState {
  currentAudio: AudioItem | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  playMode: 'single' | 'list' | 'random'
  playlist: AudioItem[]
  currentIndex: number
}