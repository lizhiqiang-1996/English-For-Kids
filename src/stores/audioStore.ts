import { create } from 'zustand'
import { AudioItem, AudioState } from '@/types/audio'

interface AudioStore extends AudioState {
  setCurrentAudio: (audio: AudioItem, index: number) => void
  setPlaying: (isPlaying: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  setMuted: (isMuted: boolean) => void
  setPlayMode: (mode: 'single' | 'list' | 'random') => void
  setPlaylist: (playlist: AudioItem[]) => void
  playNext: () => void
  playPrevious: () => void
  playIndex: (index: number) => void
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  currentAudio: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  playMode: 'list',
  playlist: [],
  currentIndex: -1,

  setCurrentAudio: (audio, index) => set({ currentAudio: audio, currentIndex: index }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setMuted: (isMuted) => set({ isMuted }),
  setPlayMode: (playMode) => set({ playMode }),
  setPlaylist: (playlist) => set({ playlist }),

  playNext: () => {
    const { playlist, currentIndex, playMode } = get()
    if (playlist.length === 0) return

    let nextIndex = currentIndex
    if (playMode === 'random') {
      nextIndex = Math.floor(Math.random() * playlist.length)
    } else if (playMode === 'single') {
      // 单曲循环，不改变索引
    } else {
      // 列表循环
      nextIndex = (currentIndex + 1) % playlist.length
    }

    set({
      currentIndex: nextIndex,
      currentAudio: playlist[nextIndex],
      currentTime: 0
    })
  },

  playPrevious: () => {
    const { playlist, currentIndex } = get()
    if (playlist.length === 0) return

    const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1
    set({
      currentIndex: prevIndex,
      currentAudio: playlist[prevIndex],
      currentTime: 0
    })
  },

  playIndex: (index) => {
    const { playlist } = get()
    if (index >= 0 && index < playlist.length) {
      set({
        currentIndex: index,
        currentAudio: playlist[index],
        currentTime: 0,
        isPlaying: true
      })
    }
  }
}))