import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

function 转换为绝对路径(原始路径: string): string {
  let 处理后 = 原始路径.trim()

  // 1. 处理 ~ 用户主目录
  if (处理后.startsWith('~')) {
    处理后 = path.join(os.homedir(), 处理后.slice(1))
  }

  // 2. 处理 Git Bash / MINGW 风格的 POSIX 路径: /d/Code/xxx 或 /c/Users/...
  let posix盘符正则 = /^[/\\]([a-zA-Z])[/\\](.*)$/
  let posix匹配 = posix盘符正则.exec(处理后)
  if (posix匹配 !== null) {
    let 盘符 = posix匹配[1]
    let 剩余路径 = posix匹配[2]
    if (盘符 !== undefined && 剩余路径 !== undefined) {
      处理后 = `${盘符.toUpperCase()}:/${剩余路径}`
    }
  }

  // 3. 处理 Windows 驱动器缺少斜杠: D:Code/xxx -> D:/Code/xxx
  let 缺少斜杠正则 = /^([a-zA-Z]):([^/\\])/
  let 缺少斜杠匹配 = 缺少斜杠正则.exec(处理后)
  if (缺少斜杠匹配 !== null) {
    let 盘符 = 缺少斜杠匹配[1]
    let 剩余字符 = 缺少斜杠匹配[2]
    if (盘符 !== undefined && 剩余字符 !== undefined) {
      处理后 = `${盘符.toUpperCase()}:/${处理后.slice(2)}`
    }
  }

  return path.resolve(处理后)
}

function 深度探测真实目录(基准目录: string, 待匹配文本: string, 当前深度: number): string | undefined {
  if (待匹配文本 === '') {
    return fs.existsSync(基准目录) === true ? 基准目录 : undefined
  }
  if (当前深度 > 5 || fs.existsSync(基准目录) === false) {
    return undefined
  }

  let 子项目列表: string[]
  try {
    子项目列表 = fs.readdirSync(基准目录)
  } catch {
    return undefined
  }

  let 待匹配小写 = 待匹配文本.toLowerCase()

  // 优先寻找完全匹配剩余文本的子目录
  for (let 子项 of 子项目列表) {
    if (子项.toLowerCase() === 待匹配小写) {
      let 完整路径 = path.join(基准目录, 子项)
      if (fs.statSync(完整路径).isDirectory() === true) {
        return 完整路径
      }
    }
  }

  // 寻找作为待匹配文本前缀的子目录
  for (let 子项 of 子项目列表) {
    let 子项小写 = 子项.toLowerCase()
    if (子项小写 !== '' && 待匹配小写.startsWith(子项小写) === true) {
      let 剩余部分 = 待匹配文本.slice(子项.length)
      let 下一级目录 = path.join(基准目录, 子项)
      try {
        if (fs.statSync(下一级目录).isDirectory() === true) {
          let 找到路径 = 深度探测真实目录(下一级目录, 剩余部分, 当前深度 + 1)
          if (找到路径 !== undefined) {
            return 找到路径
          }
        }
      } catch {
        continue
      }
    }
  }

  return undefined
}

function 尝试自动修复被吞反斜杠路径(原始输入: string): string | undefined {
  let 清理后 = 原始输入.trim()

  // 检查是否包含盘符前缀
  let 盘符正则 = /^([a-zA-Z]):(.*)$/
  let 盘符匹配 = 盘符正则.exec(清理后)

  if (盘符匹配 !== null) {
    let 盘符 = 盘符匹配[1]
    let 待匹配文本 = 盘符匹配[2]
    if (盘符 !== undefined && 待匹配文本 !== undefined) {
      let 盘符根目录 = `${盘符.toUpperCase()}:\\`
      let 纯文本 = 待匹配文本.replace(/^[/\\]+/, '')
      let 探测结果 = 深度探测真实目录(盘符根目录, 纯文本, 1)
      if (探测结果 !== undefined) {
        return 探测结果
      }
    }
  }

  // 从当前工作目录及其父目录探测
  let 当前目录探测 = 深度探测真实目录(process.cwd(), 清理后, 1)
  if (当前目录探测 !== undefined) {
    return 当前目录探测
  }

  return undefined
}

export function 规范化并解析路径(原始输入: string): { 路径: string; 是否自动纠正: boolean; 原始解析: string } {
  let 规范绝对路径 = 转换为绝对路径(原始输入)

  // 如果直接存在，直接返回
  if (fs.existsSync(规范绝对路径) === true) {
    return { 路径: 规范绝对路径, 是否自动纠正: false, 原始解析: 规范绝对路径 }
  }

  // 尝试自动探测并纠正（例如 Git Bash 吞掉反斜杠导致连成一体的情况）
  let 修复结果 = 尝试自动修复被吞反斜杠路径(原始输入)
  if (修复结果 !== undefined && fs.existsSync(修复结果) === true) {
    return { 路径: 修复结果, 是否自动纠正: true, 原始解析: 规范绝对路径 }
  }

  return { 路径: 规范绝对路径, 是否自动纠正: false, 原始解析: 规范绝对路径 }
}
