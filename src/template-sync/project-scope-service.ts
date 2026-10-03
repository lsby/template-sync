import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'

let execFileAsync = promisify(execFile)

export interface 项目同步范围 {
  项目路径: string
  项目子目录?: string
}

export interface 推断当前目录同步范围参数 {
  当前目录: string
  允许询问: boolean
  确认使用当前目录: (项目子目录: string) => Promise<boolean>
}

async function 获取Git根目录(当前目录: string): Promise<string | undefined> {
  try {
    let result = await execFileAsync('git', ['rev-parse', '--show-toplevel'], { cwd: 当前目录, encoding: 'utf8' })
    let 根目录 = result.stdout.trim()
    return 根目录 === '' ? undefined : path.resolve(根目录)
  } catch {
    return undefined
  }
}

export async function 推断当前目录同步范围(参数: 推断当前目录同步范围参数): Promise<项目同步范围> {
  let 当前目录 = path.resolve(参数.当前目录)
  let Git根目录 = await 获取Git根目录(当前目录)
  if (Git根目录 === undefined) return { 项目路径: 当前目录 }

  let 项目子目录 = path.relative(Git根目录, 当前目录).replaceAll('\\', '/')
  if (项目子目录 === '') return { 项目路径: 当前目录 }
  if (参数.允许询问 === false) return { 项目路径: 当前目录 }

  let 使用当前目录 = await 参数.确认使用当前目录(项目子目录)
  if (使用当前目录 === false) return { 项目路径: 当前目录 }
  return { 项目路径: Git根目录, 项目子目录 }
}
