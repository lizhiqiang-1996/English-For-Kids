// 教材列表页面逻辑
const app = getApp()

const BOOK_ORDER = ['grade1a', 'grade1b', 'grade2a', 'grade2b']
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
    audioList: [],
    bookGroups: [],
    loading: false
  },

  onLoad() {
    this.loadAudioList()
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

    app.globalData.playlist = enhanced
    app.globalData.audioList = enhanced
    this.setData({
      audioList: enhanced,
      bookGroups: this.buildBookGroups(enhanced),
      loading: false
    })
  },

  onSelectBook(e) {
    const { bookKey } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/book/book?bookKey=${bookKey}`
    })
  },

  onShareAppMessage() {
    return {
      title: 'English for KIDS 音频',
      path: '/pages/index/index',
      imageUrl: '/img/coverUrl.png'
    }
  }
})
