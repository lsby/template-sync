import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, test } from 'vitest'
import { 分析仓库, 创建嫁接 } from '../../src/template-sync/git-service'

let execFileAsync = promisify(execFile)
let 临时目录列表: string[] = []

async function git(cwd: string, args: string[]): Promise<string> {
  let result = await execFileAsync('git', args, { cwd, encoding: 'utf8', windowsHide: true })
  return result.stdout.trim()
}

async function 创建仓库(): Promise<string> {
  let directory = await fs.mkdtemp(path.join(os.tmpdir(), 'template-sync-common-'))
  临时目录列表.push(directory)
  await git(directory, ['init'])
  await git(directory, ['checkout', '-b', 'main'])
  await git(directory, ['config', 'user.name', 'Template Sync Test'])
  await git(directory, ['config', 'user.email', 'template-sync@example.com'])
  return directory
}

async function 提交文件(仓库: string, 文件名: string, 内容: string): Promise<string> {
  await fs.writeFile(path.join(仓库, 文件名), 内容)
  await git(仓库, ['add', '.'])
  await git(仓库, ['commit', '-m', 文件名])
  return await git(仓库, ['rev-parse', 'HEAD'])
}

async function 继承模板(模板: string): Promise<string> {
  let 项目 = await 创建仓库()
  await git(项目, ['fetch', '--no-tags', 模板, 'main'])
  await git(项目, ['checkout', '-B', 'main', 'FETCH_HEAD'])
  return 项目
}

async function 签名末端(仓库: string): Promise<{ 哈希: string; 内容: string }> {
  let 原始提交 = await git(仓库, ['cat-file', 'commit', 'HEAD'])
  let 内容 = 原始提交.replace(
    '\n\n',
    '\ngpgsig -----BEGIN PGP SIGNATURE-----\n opaque-signature\n -----END PGP SIGNATURE-----\n\n',
  )
  let 对象文件 = path.join(仓库, '.git', 'signed-commit')
  await fs.writeFile(对象文件, `${内容}\n`)
  let 哈希 = await git(仓库, ['hash-object', '-t', 'commit', '-w', 对象文件])
  await git(仓库, ['update-ref', 'refs/heads/main', 哈希])
  return { 哈希, 内容 }
}

afterEach(async () => {
  for (let directory of 临时目录列表.splice(0)) await fs.rm(directory, { recursive: true, force: true })
})

describe('模板共同历史', () => {
  test('采用最近真实共同祖先并原样复用带签名的模板对象', async () => {
    let 模板 = await 创建仓库()
    let 根提交 = await 提交文件(模板, 'base.txt', 'base\n')
    await 提交文件(模板, 'base.txt', 'shared\n')
    let { 哈希: 共同提交 } = await 签名末端(模板)
    let 项目 = await 继承模板(模板)
    await 提交文件(项目, 'project.txt', 'project\n')

    await 提交文件(模板, 'base.txt', 'template update\n')
    let { 哈希: 模板末端, 内容: 签名提交 } = await 签名末端(模板)

    await git(项目, ['config', 'template-sync.project-base', 根提交])
    await git(项目, ['config', 'template-sync.template-base', 根提交])
    let 参数 = { 项目路径: 项目, 模板路径: 模板, 模板分支: 'main' }
    let 原引用 = await git(项目, ['show-ref'])
    let 原索引 = await fs.readFile(path.join(项目, '.git', 'index'))
    let 原Fetch记录 = await fs.readFile(path.join(项目, '.git', 'FETCH_HEAD'))
    let analysis = await 分析仓库(参数)
    expect(analysis.同步方式).toBe('复用历史')
    expect(analysis.项目起点.哈希).toBe(共同提交)
    expect(analysis.模板起点.哈希).toBe(共同提交)
    expect(analysis.更新提交数).toBe(1)
    expect(await git(项目, ['show-ref'])).toBe(原引用)
    expect(await fs.readFile(path.join(项目, '.git', 'index'))).toEqual(原索引)
    expect(await fs.readFile(path.join(项目, '.git', 'FETCH_HEAD'))).toEqual(原Fetch记录)
    expect(await git(项目, ['status', '--porcelain'])).toBe('')

    let result = await 创建嫁接({ ...参数, 输出分支: 'sync/signed' })
    expect(result.重建提交数).toBe(0)
    expect(await git(项目, ['rev-parse', 'sync/signed'])).toBe(模板末端)
    expect(await git(项目, ['cat-file', 'commit', 'sync/signed'])).toBe(签名提交)
    expect(await git(项目, ['merge-base', 'HEAD', 'sync/signed'])).toBe(共同提交)
    await git(项目, ['merge', '--no-edit', 'sync/signed'])
    expect(await fs.readFile(path.join(项目, 'base.txt'), 'utf8')).toBe('template update\n')
    expect(await fs.readFile(path.join(项目, 'project.txt'), 'utf8')).toBe('project\n')
  })

  test('从第二父找到已合并模板且第二次只同步新增提交', async () => {
    let 模板 = await 创建仓库()
    await 提交文件(模板, 'base.txt', 'base\n')
    let 项目 = await 继承模板(模板)
    await 提交文件(项目, 'project.txt', 'project\n')
    let 首次模板 = await 提交文件(模板, 'first.txt', 'first\n')
    let 参数 = { 项目路径: 项目, 模板路径: 模板, 模板分支: 'main' }
    await 创建嫁接({ ...参数, 输出分支: 'sync/first' })
    await git(项目, ['merge', '--no-ff', '--no-edit', 'sync/first'])
    let 首父历史 = (await git(项目, ['rev-list', '--first-parent', 'HEAD'])).split('\n')
    expect(首父历史).not.toContain(首次模板)

    let 最新模板 = await 提交文件(模板, 'second.txt', 'second\n')
    let analysis = await 分析仓库(参数)
    expect(analysis.模板起点.哈希).toBe(首次模板)
    expect(analysis.更新提交数).toBe(1)
    let result = await 创建嫁接({ ...参数, 输出分支: 'sync/second' })
    expect(result.重建提交数).toBe(0)
    expect(await git(项目, ['rev-parse', 'sync/second'])).toBe(最新模板)
    await git(项目, ['merge', '--no-edit', 'sync/second'])
    expect((await 分析仓库(参数)).更新提交数).toBe(0)
    expect(await fs.readFile(path.join(项目, 'second.txt'), 'utf8')).toBe('second\n')
  })

  test('有共同历史时仍严格拒绝错误的同步起点配置', async () => {
    let 模板 = await 创建仓库()
    await 提交文件(模板, 'base.txt', 'base\n')
    let 项目 = await 继承模板(模板)
    let 参数 = { 项目路径: 项目, 模板路径: 模板, 模板分支: 'main' }
    await git(项目, ['config', 'template-sync.project-base', 'HEAD'])
    await expect(分析仓库(参数)).rejects.toThrow('必须同时配置')
    await git(项目, ['config', 'template-sync.template-base', 'missing-commit'])
    await expect(分析仓库(参数)).rejects.toThrow('不是有效提交')
  })

  test('多个最近共同祖先时更新数量排除项目全部已包含的历史', async () => {
    let 模板 = await 创建仓库()
    let 根提交 = await 提交文件(模板, 'base.txt', 'base\n')
    let 主线提交 = await 提交文件(模板, 'main.txt', 'main\n')
    await git(模板, ['checkout', '-b', 'side', 根提交])
    let 支线提交 = await 提交文件(模板, 'side.txt', 'side\n')
    await git(模板, ['checkout', 'main'])
    await git(模板, ['merge', '--no-ff', '--no-edit', 'side'])
    let 模板末端 = await git(模板, ['rev-parse', 'HEAD'])
    let 树哈希 = await git(模板, ['rev-parse', 'HEAD^{tree}'])
    let 项目 = await 继承模板(模板)
    let 项目末端 = await git(项目, ['commit-tree', 树哈希, '-p', 支线提交, '-p', 主线提交, '-m', 'project merge'])
    await git(项目, ['reset', '--hard', 项目末端])

    let 参数 = { 项目路径: 项目, 模板路径: 模板, 模板分支: 'main' }
    let analysis = await 分析仓库(参数)
    expect([主线提交, 支线提交]).toContain(analysis.模板起点.哈希)
    expect(analysis.更新提交数).toBe(1)
    let result = await 创建嫁接({ ...参数, 输出分支: 'sync/multiple-bases' })
    expect(result.重建提交数).toBe(0)
    expect(await git(项目, ['rev-parse', 'sync/multiple-bases'])).toBe(模板末端)
  })
})
