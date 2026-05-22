const app = getApp()

const BOOK_META = {
  grade1a: {
    title: 'English for KIDS Grade 1A',
    cover: 'http://hzcbs.com/data/uploads/newscat/2021-11-29/de838cebb3ca581209b8db263498d5fb.jpg'
  },
  grade1b: {
    title: 'English for KIDS Grade 1B',
    cover: 'http://hzcbs.com/data/uploads/newscat/2021-12-10/0c224cb1a4e98acd91a791d76835d9db.png'
  },
  grade2a: {
    title: 'English for KIDS Grade 2A',
    cover: 'http://hzcbs.com/data/uploads/newscat/2021-12-10/d16b1e7bb85878cee86962858adb926d.png'
  },
  grade2b: {
    title: 'English for KIDS Grade 2B',
    cover: 'http://hzcbs.com/data/uploads/newscat/2021-12-10/ba1fcae44dd33dc8bdaad5808baf73b7.png'
  }
}

Page({
  data: {
    bookKey: '',
    bookTitle: '',
    bookCover: '',
    audioList: [],
    unitGroups: [],
    loading: false
  },

  onLoad(options) {
    const bookKey = options.bookKey || 'grade1a'
    this.setData({ bookKey })
    this.loadBookAudio(bookKey)
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

  sortByNumber(a, b) {
    const aNum = parseInt(String(a).match(/\d+/), 10) || 0
    const bNum = parseInt(String(b).match(/\d+/), 10) || 0
    return aNum - bNum
  },

  buildUnitGroups(audioList) {
    const prevUnitState = {}
    const prevLessonState = {}
    ;(this.data.unitGroups || []).forEach(group => {
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
            items: unitMap[unitLabel][lesson]
          }))
      }))
  },

  loadBookAudio(bookKey) {
    this.setData({ loading: true })
    const allAudio = app.getAudioList().map(item => {
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

    app.globalData.playlist = allAudio
    app.globalData.audioList = allAudio

    const currentBook = BOOK_META[bookKey] || BOOK_META.grade1a
    const currentAudioList = allAudio.filter(item => item.bookKey === bookKey)
    const unitGroups = this.buildUnitGroups(currentAudioList)

    wx.setNavigationBarTitle({
      title: currentBook.title
    })

    this.setData({
      bookTitle: currentBook.title,
      bookCover: currentBook.cover,
      audioList: currentAudioList,
      unitGroups,
      loading: false
    })
  },

  onToggleUnit(e) {
    const { unit } = e.currentTarget.dataset
    const unitGroups = (this.data.unitGroups || []).map(group =>
      group.unitLabel === unit ? { ...group, open: !group.open } : group
    )
    this.setData({ unitGroups })
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
    wx.switchTab({ url: '/pages/player/player' })
  },

  onShareAppMessage() {
    return {
      title: this.data.bookTitle || 'English for KIDS 音频',
      path: `/pages/book/book?bookKey=${this.data.bookKey}`,
      imageUrl: '/img/coverUrl.png'
    }
  }
})
