import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { 推断当前目录同步范围 } from '../../src/template-sync/project-scope-service'

let 临时目录列表: string[] = []
let execFileAsync = promisify(execFile)

async function 创建Git仓库(): Promise<string> {
  let directory = await fs.mkdtemp(path.join(os.tmpdir(), 'template-sync-scope-'))
  临时目录列表.push(directory)
  await execFileAsync('git', ['init'], { cwd: directory, encoding: 'utf8' })
  return directory
}

afterEach(async () => {
  for (let directory of 临时目录列表.splice(0)) {
    await fs.rm(directory, { recursive: true, force: true })
  }
})

describe('当前目录同步范围推断', () => {
  test('位于 Git 根目录时保持整仓模式且不询问', async () => {
    let 仓库 = await 创建Git仓库()
    let 确认 = vi.fn(async (): Promise<boolean> => true)

    let result = await 推断当前目录同步范围({ 当前目录: 仓库, 允许询问: true, 确认使用当前目录: 确认 })

    expect(result).toEqual({ 项目路径: path.resolve(仓库) })
    expect(确认).not.toHaveBeenCalled()
  })

  test('接受询问时将 Git 根目录作为项目并将 cwd 作为子目录', async () => {
    let 仓库 = await 创建Git仓库()
    let 当前目录 = path.join(仓库, 'packages', 'web')
    await fs.mkdir(当前目录, { recursive: true })
    let 确认 = vi.fn(async (): Promise<boolean> => true)

    let result = await 推断当前目录同步范围({ 当前目录, 允许询问: true, 确认使用当前目录: 确认 })

    expect(result).toEqual({ 项目路径: path.resolve(仓库), 项目子目录: 'packages/web' })
    expect(确认).toHaveBeenCalledWith('packages/web')
  })

  test('拒绝询问时保留原有的 cwd 整仓行为', async () => {
    let 仓库 = await 创建Git仓库()
    let 当前目录 = path.join(仓库, 'packages', 'web')
    await fs.mkdir(当前目录, { recursive: true })

    let result = await 推断当前目录同步范围({
      当前目录,
      允许询问: true,
      确认使用当前目录: async (): Promise<boolean> => false,
    })

    expect(result).toEqual({ 项目路径: path.resolve(当前目录) })
  })

  test('非交互模式不询问并保留原有行为', async () => {
    let 仓库 = await 创建Git仓库()
    let 当前目录 = path.join(仓库, 'packages', 'web')
    await fs.mkdir(当前目录, { recursive: true })
    let 确认 = vi.fn(async (): Promise<boolean> => true)

    let result = await 推断当前目录同步范围({ 当前目录, 允许询问: false, 确认使用当前目录: 确认 })

    expect(result).toEqual({ 项目路径: path.resolve(当前目录) })
    expect(确认).not.toHaveBeenCalled()
  })

  test('不在 Git 仓库内时保持原有行为且不询问', async () => {
    let 当前目录 = await fs.mkdtemp(path.join(os.tmpdir(), 'template-sync-scope-'))
    临时目录列表.push(当前目录)
    await fs.writeFile(path.join(当前目录, '.git'), 'gitdir: missing\n', 'utf8')
    let 确认 = vi.fn(async (): Promise<boolean> => true)

    let result = await 推断当前目录同步范围({ 当前目录, 允许询问: true, 确认使用当前目录: 确认 })

    expect(result).toEqual({ 项目路径: path.resolve(当前目录) })
    expect(确认).not.toHaveBeenCalled()
  })
})
