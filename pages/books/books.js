const app = getApp()

const BOOK_ORDER = ['grade1a', 'grade1b', 'grade2a', 'grade2b']
const BOOK_META = {
  grade1a: {
    title: 'English for KIDS Grade 1A',
    cover: '/img/book-grade1a.jpg'
  },
  grade1b: {
    title: 'English for KIDS Grade 1B',
    cover: '/img/book-grade1b.png'
  },
  grade2a: {
    title: 'English for KIDS Grade 2A',
    cover: '/img/book-grade2a.png'
  },
  grade2b: {
    title: 'English for KIDS Grade 2B',
    cover: '/img/book-grade2b.png'
  }
}

Page({
  data: {
    audioList: [],
    bookGroups: [],
    selectedBookKey: '',
    selectedBookTitle: '',
    selectedBookCover: '',
    unitGroups: [],
    currentAudioId: '',
    currentAudioTitle: '',
    currentAudioSubtitle: '',
    isPlaying: false,
    favoriteIds: [],
    scrollTop: 0,
    loading: false
  },

  onLoad() {
    this.loadAudioList()
  },

  onShow() {
    const restored = this.restoreViewState()
    this.syncCurrentPlayback()
    if (!restored) {
      this.syncFavorites()
    }
    this.updateNavigationTitle()
  },

  onPageScroll(e) {
    this.persistViewState({
      scrollTop: e.scrollTop || 0
    })
  },

  getBookMeta(item) {
    const audioUrl = item.audioUrl || ''
    if (/\/2A Unit /i.test(audioUrl)) {
      return { key: 'grade2a', ...BOOK_META.grade2a }
    }
    if (/\/2B Unit /i.test(audioUrl)) {
      return { key: 'grade2b', ...BOOK_META.grade2b }
    }
    if (/\/1B Unit /i.test(audioUrl)) {
      return { key: 'grade1b', ...BOOK_META.grade1b }
    }
    return { key: 'grade1a', ...BOOK_META.grade1a }
  },

  getUnitLabel(unit) {
    return (unit || '未分组').replace(/B$/, '')
  },

  buildBookGroups(audioList) {
    const groupsMap = {}
    ;(audioList || []).forEach(item => {
      if (!groupsMap[item.bookKey]) {
        groupsMap[item.bookKey] = {
          bookKey: item.bookKey,
          title: item.bookTitle,
          cover: item.bookCover,
          unitSet: new Set(),
          totalCount: 0
        }
      }
      groupsMap[item.bookKey].unitSet.add(item.unitLabel)
      groupsMap[item.bookKey].totalCount += 1
    })

    return Object.values(groupsMap)
      .sort((a, b) => BOOK_ORDER.indexOf(a.bookKey) - BOOK_ORDER.indexOf(b.bookKey))
      .map(group => ({
        bookKey: group.bookKey,
        title: group.title,
        cover: group.cover,
        unitCount: group.unitSet.size,
        totalCount: group.totalCount
      }))
  },

  sortByNumber(a, b) {
    const aNum = parseInt(String(a).match(/\d+/), 10) || 0
    const bNum = parseInt(String(b).match(/\d+/), 10) || 0
    return aNum - bNum
  },

  buildUnitGroups(audioList) {
    const prevUnitState = {}
    const prevLessonState = {}
    const sourceGroups = this.getSavedUnitGroups()
    ;(sourceGroups || []).forEach(group => {
      prevUnitState[group.unitLabel] = !!group.open
      ;(group.lessons || []).forEach(lesson => {
        prevLessonState[`${group.unitLabel}-${lesson.lesson}`] = !!lesson.open
      })
    })

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
      .sort(this.sortByNumber)
      .map(unitLabel => ({
        unitLabel,
        open: prevUnitState[unitLabel] || false,
        lessons: Object.keys(unitMap[unitLabel])
          .sort(this.sortByNumber)
          .map(lesson => ({
            lesson,
            open: prevLessonState[`${unitLabel}-${lesson}`] || false,
            items: this.decorateFavoriteState(unitMap[unitLabel][lesson])
          }))
      }))
  },

  decorateFavoriteState(items) {
    const favoriteIds = app.globalData.favorites || []
    return (items || []).map(item => ({
      ...item,
      isFavorited: favoriteIds.includes(item.id)
    }))
  },

  getSavedUnitGroups() {
    const pageState = app.globalData.bookPageState || {}
    if (pageState.selectedBookKey && pageState.selectedBookKey === this.data.selectedBookKey) {
      return pageState.unitGroups || this.data.unitGroups || []
    }
    return this.data.unitGroups || []
  },

  loadAudioList() {
    this.setData({ loading: true })
    const audioList = app.getAudioList()
    const enhanced = audioList.map(item => {
      const bookMeta = this.getBookMeta(item)
      return {
        ...item,
        unit: item.unit || '未分组',
        unitLabel: this.getUnitLabel(item.unit),
        bookKey: bookMeta.key,
        bookTitle: bookMeta.title,
        bookCover: bookMeta.cover
      }
    })
    const withFavoriteState = this.decorateFavoriteState(enhanced)

    app.globalData.playlist = withFavoriteState
    app.globalData.audioList = withFavoriteState
    this.setData({
      audioList: withFavoriteState,
      bookGroups: this.buildBookGroups(withFavoriteState),
      favoriteIds: app.globalData.favorites || [],
      loading: false
    })
    this.restoreViewState()
    this.syncCurrentPlayback()
  },

  updateNavigationTitle() {
    wx.setNavigationBarTitle({
      title: this.data.selectedBookTitle || '课本'
    })
  },

  persistViewState(extra = {}) {
    app.globalData.bookPageState = {
      ...(app.globalData.bookPageState || {}),
      selectedBookKey: this.data.selectedBookKey,
      selectedBookTitle: this.data.selectedBookTitle,
      selectedBookCover: this.data.selectedBookCover,
      unitGroups: this.data.unitGroups,
      scrollTop: this.data.scrollTop,
      targetAudioId: '',
      ...extra
    }
  },

  restoreViewState() {
    const pageState = app.globalData.bookPageState || {}
    if (!pageState.selectedBookKey) {
      return false
    }

    const selectedBook = BOOK_META[pageState.selectedBookKey] || BOOK_META.grade1a
    const currentAudioList = (this.data.audioList || []).filter(item => item.bookKey === pageState.selectedBookKey)
    if (currentAudioList.length === 0) {
      return false
    }

    const nextUnitGroups = (pageState.unitGroups && pageState.unitGroups.length > 0)
      ? pageState.unitGroups
      : this.buildUnitGroups(currentAudioList)

    this.setData({
      selectedBookKey: pageState.selectedBookKey,
      selectedBookTitle: pageState.selectedBookTitle || selectedBook.title,
      selectedBookCover: pageState.selectedBookCover || selectedBook.cover,
      unitGroups: nextUnitGroups,
      scrollTop: pageState.scrollTop || 0
    }, () => {
      const targetAudioId = pageState.targetAudioId
      const scrollTop = pageState.scrollTop || 0
      if (targetAudioId) {
        wx.pageScrollTo({
          selector: `#audio-${targetAudioId}`,
          duration: 0
        })
        this.persistViewState({ targetAudioId: '' })
      } else if (scrollTop > 0) {
        wx.pageScrollTo({
          scrollTop,
          duration: 0
        })
      }
      this.syncFavorites()
    })
    return true
  },

  syncCurrentPlayback() {
    const { currentAudio, isPlaying } = app.globalData
    const bookTitle = currentAudio ? (currentAudio.bookTitle || '') : ''
    const lessonInfo = currentAudio ? `${currentAudio.unit || ''} ${currentAudio.lesson || ''}`.trim() : ''
    const currentAudioSubtitle = [bookTitle, lessonInfo].filter(Boolean).join(' · ')
    this.setData({
      currentAudioId: currentAudio ? currentAudio.id : '',
      currentAudioTitle: currentAudio ? currentAudio.title : '',
      currentAudioSubtitle,
      isPlaying: !!isPlaying
    })
  },

  syncFavorites() {
    const favoriteIds = app.globalData.favorites || []
    const audioList = this.decorateFavoriteState(this.data.audioList)
    const nextData = {
      favoriteIds,
      audioList
    }

    if (this.data.selectedBookKey) {
      const currentAudioList = audioList.filter(item => item.bookKey === this.data.selectedBookKey)
      const unitGroups = this.buildUnitGroups(currentAudioList)
      nextData.unitGroups = unitGroups
      this.persistViewState({ unitGroups })
    }

    this.setData(nextData)
  },

  onSelectBook(e) {
    const { bookKey } = e.currentTarget.dataset
    const selectedBook = BOOK_META[bookKey] || BOOK_META.grade1a
    const currentAudioList = (this.data.audioList || []).filter(item => item.bookKey === bookKey)
    const unitGroups = this.buildUnitGroups(currentAudioList)
    this.setData({
      selectedBookKey: bookKey,
      selectedBookTitle: selectedBook.title,
      selectedBookCover: selectedBook.cover,
      unitGroups,
      scrollTop: 0
    }, () => {
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 0
      })
    })
    this.persistViewState({
      selectedBookKey: bookKey,
      selectedBookTitle: selectedBook.title,
      selectedBookCover: selectedBook.cover,
      unitGroups,
      scrollTop: 0
    })
    this.updateNavigationTitle()
  },

  onBackToBooks() {
    this.setData({
      selectedBookKey: '',
      selectedBookTitle: '',
      selectedBookCover: '',
      unitGroups: [],
      scrollTop: 0
    })
    this.persistViewState({
      selectedBookKey: '',
      selectedBookTitle: '',
      selectedBookCover: '',
      unitGroups: [],
      scrollTop: 0
    })
    this.updateNavigationTitle()
  },

  onToggleUnit(e) {
    const { unit } = e.currentTarget.dataset
    const unitGroups = (this.data.unitGroups || []).map(group =>
      group.unitLabel === unit ? { ...group, open: !group.open } : group
    )
    this.setData({ unitGroups })
    this.persistViewState({ unitGroups })
  },

  onToggleLesson(e) {
    const { unit, lesson } = e.currentTarget.dataset
    const unitGroups = (this.data.unitGroups || []).map(group => {
      if (group.unitLabel !== unit) {
        return group
      }
      return {
        ...group,
        lessons: (group.lessons || []).map(item =>
          item.lesson === lesson ? { ...item, open: !item.open } : item
        )
      }
    })
    this.setData({ unitGroups })
    this.persistViewState({ unitGroups })
  },

  onAudioTap(e) {
    const { id } = e.currentTarget.dataset
    const globalIndex = (app.globalData.playlist || []).findIndex(item => item.id === id)
    if (globalIndex < 0) {
      wx.showToast({ title: '播放项异常', icon: 'error' })
      return
    }

    app.globalData.currentIndex = globalIndex
    app.globalData.shouldAutoPlayOnPlayerShow = true
    this.syncCurrentPlayback()
    wx.switchTab({ url: '/pages/player/player' })
  },

  onMiniPlayerTap() {
    if (!this.data.currentAudioId) {
      return
    }
    wx.switchTab({ url: '/pages/player/player' })
  },

  onMiniPlayTap() {
    const mgr = app.globalData.audioManager
    if (!mgr || !this.data.currentAudioId) {
      return
    }

    if (mgr.paused) {
      app.resumeAudio()
      this.setData({ isPlaying: true })
    } else {
      app.pauseAudio()
      this.setData({ isPlaying: false })
    }
  },

  onFavoriteTap(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return

    const isFavorited = app.toggleFavorite(id)
    this.syncFavorites()

    wx.showToast({
      title: isFavorited ? '已收藏' : '取消收藏',
      icon: 'success',
      duration: 1200
    })
  },

  onShareAppMessage() {
    return {
      title: 'English for KIDS 音频',
      path: '/pages/books/books',
      imageUrl: '/img/coverUrl.png'
    }
  }
})
