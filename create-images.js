// 创建images目录用于存放图标
const fs = require('fs')
const path = require('path')

// 创建images目录
const imagesDir = path.join(__dirname, 'images')
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir)
}

console.log('Images directory created')