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
  let result = await execFileAsync('git', args, { cwd, encoding: 'utf8' })
  return result.stdout.trim()
}

async function 写文件(仓库: string, 文件名: string, 内容: string): Promise<void> {
  let 文件路径 = path.join(仓库, 文件名)
  await fs.mkdir(path.dirname(文件路径), { recursive: true })
  await fs.writeFile(文件路径, 内容, 'utf8')
}

async function 创建仓库(): Promise<string> {
  let directory = await fs.mkdtemp(path.join(os.tmpdir(), 'template-sync-'))
  临时目录列表.push(directory)
  await git(directory, ['init'])
  await git(directory, ['checkout', '-b', 'main'])
  await git(directory, ['config', 'user.name', 'Template Sync Test'])
  await git(directory, ['config', 'user.email', 'template-sync@example.com'])
  return directory
}

async function 提交全部(仓库: string, 标题: string): Promise<string> {
  await git(仓库, ['add', '.'])
  await git(仓库, ['commit', '-m', 标题])
  return await git(仓库, ['rev-parse', 'HEAD'])
}

afterEach(async () => {
  for (let directory of 临时目录列表.splice(0)) {
    await fs.rm(directory, { recursive: true, force: true })
  }
})

describe('模板嫁接 Git 服务', () => {
  test('找到相同起点并创建可合并的嫁接分支', async () => {
    let 模板 = await 创建仓库()
    await 写文件(模板, 'base.txt', 'base\n')
    let 模板起点 = await 提交全部(模板, 'template base')

    let 项目 = await 创建仓库()
    await 写文件(项目, 'base.txt', 'base\n')
    let 项目起点 = await 提交全部(项目, 'project base')
    await 写文件(项目, 'project.txt', 'project\n')
    await 提交全部(项目, 'project work')

    await 写文件(模板, 'template.txt', 'template\n')
    let 模板更新 = await 提交全部(模板, 'template update')

    let analysis = await 分析仓库({ 项目路径: 项目, 模板路径: 模板, 模板分支: 'main' })
    expect(analysis.项目起点.哈希).toBe(项目起点)
    expect(analysis.模板起点.哈希).toBe(模板起点)
    expect(analysis.更新提交数).toBe(1)

    let result = await 创建嫁接({ 项目路径: 项目, 模板路径: 模板, 模板分支: 'main', 输出分支: 'sync/result' })
    expect(result.重建提交数).toBe(1)
    expect(await git(项目, ['replace', '--list'])).toBe('')
    expect(await git(项目, ['merge-base', 'HEAD', 'sync/result'])).toBe(项目起点)
    expect(await git(项目, ['rev-list', '--max-parents=0', 'sync/result'])).toBe(项目起点)
    expect((await git(项目, ['rev-list', 'sync/result'])).split('\n')).not.toContain(模板起点)
    let metadataFormat = '%T%x00%an%x00%ae%x00%at%x00%cn%x00%ce%x00%ct%x00%B'
    expect(await git(项目, ['show', '-s', `--format=${metadataFormat}`, 'sync/result'])).toBe(
      await git(模板, ['show', '-s', `--format=${metadataFormat}`, 模板更新]),
    )

    await git(项目, ['merge', '--no-edit', 'sync/result'])
    expect(await fs.readFile(path.join(项目, 'template.txt'), 'utf8')).toBe('template\n')
    await expect(
      创建嫁接({ 项目路径: 项目, 模板路径: 模板, 模板分支: 'main', 输出分支: 'sync/result' }),
    ).rejects.toThrow('已存在')
  })

  test('拒绝没有相同文件树起点的项目', async () => {
    let 模板 = await 创建仓库()
    await 写文件(模板, 'base.txt', 'template\n')
    await 提交全部(模板, 'template base')

    let 项目 = await 创建仓库()
    await 写文件(项目, 'base.txt', 'project\n')
    await 提交全部(项目, 'project base')

    await expect(分析仓库({ 项目路径: 项目, 模板路径: 模板, 模板分支: 'main' })).rejects.toThrow(
      '没有在模板所选分支中找到',
    )
  })

  test('用户可以把项目提交变基到嫁接后的模板分支', async () => {
    let 模板 = await 创建仓库()
    await 写文件(模板, 'base.txt', 'base\n')
    await 提交全部(模板, 'template base')

    let 项目 = await 创建仓库()
    await 写文件(项目, 'base.txt', 'base\n')
    await 提交全部(项目, 'project base')
    await 写文件(项目, 'project.txt', 'project\n')
    await 提交全部(项目, 'project work')

    await 写文件(模板, 'template.txt', 'template\n')
    let 模板最新 = await 提交全部(模板, 'template update')

    await 创建嫁接({ 项目路径: 项目, 模板路径: 模板, 模板分支: 'main', 输出分支: 'sync/rebase' })
    await git(项目, ['rebase', 'sync/rebase'])

    let 重建模板最新 = await git(项目, ['rev-parse', 'sync/rebase'])
    expect(重建模板最新).not.toBe(模板最新)
    expect(await git(项目, ['merge-base', '--is-ancestor', 重建模板最新, 'HEAD'])).toBe('')
    expect(await fs.readFile(path.join(项目, 'project.txt'), 'utf8')).toBe('project\n')
    expect(await fs.readFile(path.join(项目, 'template.txt'), 'utf8')).toBe('template\n')
  })

  test('第二次同步确定性地复用已重建提交并快进导入分支', async () => {
    let 模板 = await 创建仓库()
    await 写文件(模板, 'base.txt', 'base\n')
    await 提交全部(模板, 'template base')

    let 项目 = await 创建仓库()
    await 写文件(项目, 'base.txt', 'base\n')
    await 提交全部(项目, 'project base')

    await 写文件(模板, 'first.txt', 'first\n')
    await 提交全部(模板, 'first update')

    await 创建嫁接({ 项目路径: 项目, 模板路径: 模板, 模板分支: 'main', 输出分支: 'sync/first' })
    let 第一次重建Tip = await git(项目, ['rev-parse', 'sync/first'])
    await git(项目, ['merge', '--no-edit', 'sync/first'])

    await 写文件(模板, 'second.txt', 'second\n')
    await 提交全部(模板, 'second update')

    let second = await 创建嫁接({ 项目路径: 项目, 模板路径: 模板, 模板分支: 'main', 输出分支: 'sync/second' })
    let 第二次重建Tip = await git(项目, ['rev-parse', 'sync/second'])
    expect(second.重建提交数).toBe(2)
    expect(await git(项目, ['merge-base', '--is-ancestor', 第一次重建Tip, 第二次重建Tip])).toBe('')
    await git(项目, ['merge', '--no-edit', 'sync/second'])
    expect(await fs.readFile(path.join(项目, 'second.txt'), 'utf8')).toBe('second\n')
  })

  test('模板起点之后包含分叉合并时嫁接所有入口', async () => {
    let 模板 = await 创建仓库()
    await 写文件(模板, 'base.txt', 'base\n')
    await 提交全部(模板, 'template base')

    let 项目 = await 创建仓库()
    await 写文件(项目, 'base.txt', 'base\n')
    let 项目起点 = await 提交全部(项目, 'project base')
    await 写文件(项目, 'project.txt', 'project\n')
    await 提交全部(项目, 'project work')

    await git(模板, ['checkout', '-b', 'feature'])
    await 写文件(模板, 'feature.txt', 'feature\n')
    await 提交全部(模板, 'feature update')

    await git(模板, ['checkout', 'main'])
    await 写文件(模板, 'main.txt', 'main\n')
    await 提交全部(模板, 'main update')
    await git(模板, ['merge', '--no-ff', '--no-edit', 'feature'])

    let result = await 创建嫁接({ 项目路径: 项目, 模板路径: 模板, 模板分支: 'main', 输出分支: 'sync/merge' })
    expect(result.重建提交数).toBe(3)
    expect(await git(项目, ['merge-base', 'HEAD', 'sync/merge'])).toBe(项目起点)
    expect(await git(项目, ['rev-list', '--max-parents=0', 'sync/merge'])).toBe(项目起点)

    await git(项目, ['merge', '--no-edit', 'sync/merge'])
    expect(await fs.readFile(path.join(项目, 'main.txt'), 'utf8')).toBe('main\n')
    expect(await fs.readFile(path.join(项目, 'feature.txt'), 'utf8')).toBe('feature\n')
  })
})
