import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { z } from 'zod'

let 用户配置模式 = z.object({ 默认模板路径: z.string().optional(), 默认模板分支: z.string().optional() })

export type 用户配置 = z.infer<typeof 用户配置模式>

function 获得配置目录(): string {
  return path.join(os.homedir(), '.template-sync')
}

function 获得配置文件路径(): string {
  return path.join(获得配置目录(), 'config.json')
}

export function 读取用户配置(): 用户配置 {
  let 配置文件 = 获得配置文件路径()
  if (fs.existsSync(配置文件) === false) {
    return {}
  }

  try {
    let 文本 = fs.readFileSync(配置文件, 'utf-8')
    return 用户配置模式.parse(JSON.parse(文本))
  } catch (_错误) {
    return {}
  }
}

export function 保存用户配置(配置: 用户配置): void {
  let 配置目录 = 获得配置目录()
  if (fs.existsSync(配置目录) === false) {
    fs.mkdirSync(配置目录, { recursive: true })
  }

  let 配置文件 = 获得配置文件路径()
  fs.writeFileSync(配置文件, JSON.stringify(配置, null, 2), 'utf-8')
}

export function 设置默认模板路径(模板路径: string): void {
  let 绝对路径 = path.resolve(模板路径.trim())
  let 现有配置 = 读取用户配置()
  保存用户配置({ ...现有配置, 默认模板路径: 绝对路径 })
}

export function 设置默认模板分支(模板分支: string): void {
  let 分支名称 = 模板分支.trim()
  let 现有配置 = 读取用户配置()
  保存用户配置({ ...现有配置, 默认模板分支: 分支名称 })
}

export function 获取默认模板路径(): string | undefined {
  let 配置 = 读取用户配置()
  return 配置.默认模板路径
}

export function 获取默认模板分支(): string | undefined {
  let 配置 = 读取用户配置()
  return 配置.默认模板分支
}
