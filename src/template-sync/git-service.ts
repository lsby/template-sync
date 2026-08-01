import { execFile, spawn } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import type { 仓库分析参数, 仓库分析结果, 创建嫁接参数, 嫁接结果, 提交信息 } from './types'

let execFileAsync = promisify(execFile)
let 模板源引用 = 'refs/template-sync/source'

type Git执行选项 = { 允许失败?: boolean; 禁用替换?: boolean }

type Git执行结果 = { stdout: string; stderr: string; 退出码: number }

type 原始提交 = { 内容: Buffer; 父提交: string[] }

function 清理输出(value: string): string {
  return value.replace(/\r\n/g, '\n').trim()
}

async function 执行Git(工作目录: string, 参数: string[], 选项: Git执行选项 = {}): Promise<Git执行结果> {
  let env = { ...process.env }
  if (选项.禁用替换 === true) env['GIT_NO_REPLACE_OBJECTS'] = '1'

  try {
    let result = await execFileAsync('git', 参数, {
      cwd: 工作目录,
      encoding: 'utf8',
      env,
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    })
    return { stdout: 清理输出(result.stdout), stderr: 清理输出(result.stderr), 退出码: 0 }
  } catch (error) {
    let gitError = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: string | number }
    if (gitError.code === 'ENOENT') throw new Error('未找到 Git，请先安装 Git 并确保 git 命令可用')

    let result = {
      stdout: 清理输出(gitError.stdout ?? ''),
      stderr: 清理输出(gitError.stderr ?? ''),
      退出码: typeof gitError.code === 'number' ? gitError.code : 1,
    }
    if (选项.允许失败 === true) return result
    let message =
      result.stderr !== ''
        ? result.stderr
        : result.stdout !== ''
          ? result.stdout
          : `Git 命令执行失败：git ${参数.join(' ')}`
    throw new Error(message)
  }
}

async function 执行Git并输入(工作目录: string, 参数: string[], 输入: Buffer): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    let child = spawn('git', 参数, {
      cwd: 工作目录,
      env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let stdout: Buffer[] = []
    let stderr: Buffer[] = []
    child.stdout.on('data', (data: Buffer) => stdout.push(data))
    child.stderr.on('data', (data: Buffer) => stderr.push(data))
    child.on('error', (error) => reject(error))
    child.on('close', (code) => {
      if (code === 0) resolve(Buffer.concat(stdout))
      else {
        let errorOutput = Buffer.concat(stderr).toString('utf8').trim()
        reject(new Error(errorOutput !== '' ? errorOutput : `Git 命令执行失败：git ${参数.join(' ')}`))
      }
    })
    child.stdin.end(输入)
  })
}

async function 验证仓库(仓库路径: string, 名称: string): Promise<void> {
  if (path.resolve(仓库路径) === '') throw new Error(`请选择${名称}目录`)
  let result = await 执行Git(仓库路径, ['rev-parse', '--is-inside-work-tree'], { 允许失败: true })
  if (result.退出码 !== 0 || result.stdout !== 'true') throw new Error(`${名称}不是有效的 Git 工作区：${仓库路径}`)
}

async function 工作区是否干净(仓库路径: string): Promise<boolean> {
  let result = await 执行Git(仓库路径, ['status', '--porcelain=v1', '--untracked-files=normal'])
  return result.stdout === ''
}

async function 读取提交(仓库路径: string, 提交: string): Promise<提交信息> {
  let format = '%H%x00%T%x00%ct%x00%s'
  let result = await 执行Git(仓库路径, ['show', '-s', `--format=${format}`, 提交])
  let [哈希, 树哈希, 时间文本, ...标题段] = result.stdout.split('\0')
  if (哈希 === undefined || 树哈希 === undefined || 时间文本 === undefined) throw new Error(`无法读取提交：${提交}`)
  return { 哈希, 树哈希, 提交时间: Number.parseInt(时间文本, 10), 标题: 标题段.join('\0') }
}

async function 找到项目起点(项目路径: string): Promise<提交信息> {
  let result = await 执行Git(项目路径, ['rev-list', '--first-parent', '--max-parents=0', 'HEAD'])
  let roots = result.stdout.split('\n').filter((item) => item !== '')
  if (roots.length !== 1 || roots[0] === undefined) throw new Error('无法确定项目当前分支的唯一第一父链起点')
  return await 读取提交(项目路径, roots[0])
}

async function 读取分支提交(模板路径: string, 模板分支: string): Promise<提交信息[]> {
  let format = '%H%x00%T%x00%ct%x00%s'
  let result = await 执行Git(模板路径, ['log', `--format=${format}`, 模板分支])
  return result.stdout
    .split('\n')
    .filter((line) => line !== '')
    .map((line) => {
      let [哈希, 树哈希, 时间文本, ...标题段] = line.split('\0')
      if (哈希 === undefined || 树哈希 === undefined || 时间文本 === undefined) throw new Error('模板提交记录格式异常')
      return { 哈希, 树哈希, 提交时间: Number.parseInt(时间文本, 10), 标题: 标题段.join('\0') }
    })
}

function 选择模板起点(项目起点: 提交信息, 候选: 提交信息[]): 提交信息 {
  let 相同树 = 候选.filter((提交) => 提交.树哈希 === 项目起点.树哈希)
  if (相同树.length === 0) throw new Error('没有在模板所选分支中找到与项目起点完全一致的提交')

  let 不晚于项目 = 相同树.filter((提交) => 提交.提交时间 <= 项目起点.提交时间)
  if (不晚于项目.length > 0) {
    let match = 不晚于项目.sort((a, b) => b.提交时间 - a.提交时间)[0]
    if (match !== undefined) return match
  }
  let match = 相同树.sort(
    (a, b) => Math.abs(a.提交时间 - 项目起点.提交时间) - Math.abs(b.提交时间 - 项目起点.提交时间),
  )[0]
  if (match === undefined) throw new Error('没有可用的模板起点')
  return match
}

async function 找到边界提交(模板路径: string, 模板分支: string, 模板起点: string): Promise<string[]> {
  let result = await 执行Git(模板路径, ['rev-list', '--parents', 模板分支])
  let resultSet = new Set<string>()
  for (let line of result.stdout.split('\n')) {
    let [commit, ...parents] = line.trim().split(/\s+/)
    if (commit !== undefined && parents.includes(模板起点)) resultSet.add(commit)
  }
  return [...resultSet]
}

export async function 列出模板分支(模板路径: string): Promise<string[]> {
  await 验证仓库(模板路径, '模板')
  let result = await 执行Git(模板路径, ['for-each-ref', '--format=%(refname:short)', 'refs/heads'])
  let branches = result.stdout.split('\n').filter((item) => item !== '')
  if (branches.length === 0) throw new Error('模板仓库没有本地分支')
  return branches
}

export async function 分析仓库(参数: 仓库分析参数): Promise<仓库分析结果> {
  if (参数.项目路径.trim() === '') throw new Error('请选择项目目录')
  if (参数.模板路径.trim() === '') throw new Error('请选择模板目录')
  if (参数.模板分支.trim() === '') throw new Error('请选择模板分支')
  let 项目路径 = path.resolve(参数.项目路径)
  let 模板路径 = path.resolve(参数.模板路径)
  if (项目路径 === 模板路径) throw new Error('项目仓库和模板仓库不能是同一个目录')

  await 验证仓库(项目路径, '项目')
  await 验证仓库(模板路径, '模板')

  let [项目工作区干净, 模板工作区干净] = await Promise.all([工作区是否干净(项目路径), 工作区是否干净(模板路径)])
  if (项目工作区干净 === false) throw new Error('项目工作区不干净，请先提交、暂存或清理改动')
  if (模板工作区干净 === false) throw new Error('模板工作区不干净，请先提交、暂存或清理改动')

  await 执行Git(模板路径, ['rev-parse', '--verify', `${参数.模板分支}^{commit}`])
  let 项目起点 = await 找到项目起点(项目路径)
  let 模板提交 = await 读取分支提交(模板路径, 参数.模板分支)
  let 模板起点 = 选择模板起点(项目起点, 模板提交)
  let 模板最新 = await 读取提交(模板路径, 参数.模板分支)
  let countResult = await 执行Git(模板路径, ['rev-list', '--count', `${模板起点.哈希}..${参数.模板分支}`])
  let 边界提交 = await 找到边界提交(模板路径, 参数.模板分支, 模板起点.哈希)

  return {
    项目路径,
    模板路径,
    模板分支: 参数.模板分支,
    项目起点,
    模板起点,
    模板最新,
    更新提交数: Number.parseInt(countResult.stdout, 10),
    边界提交,
    项目工作区干净,
    模板工作区干净,
  }
}

function 解析原始提交(内容: Buffer): 原始提交 {
  let separator = 内容.indexOf(Buffer.from('\n\n'))
  if (separator < 0) throw new Error('Git commit 对象缺少头部结束标记')
  let headerLines = 内容.subarray(0, separator).toString('utf8').split('\n')
  let blocks: string[] = []
  for (let line of headerLines) {
    if (line.startsWith(' ') && blocks.length > 0) {
      let lastIndex = blocks.length - 1
      let previous = blocks[lastIndex]
      if (previous !== undefined) blocks[lastIndex] = `${previous}\n${line}`
    } else {
      blocks.push(line)
    }
  }
  return {
    内容,
    父提交: blocks.filter((block) => block.startsWith('parent ')).map((block) => block.slice('parent '.length)),
  }
}

function 重写提交父级(原始: 原始提交, 新父提交: string[]): Buffer {
  let separator = 原始.内容.indexOf(Buffer.from('\n\n'))
  if (separator < 0) throw new Error('Git commit 对象缺少头部结束标记')
  let message = 原始.内容.subarray(separator + 2)
  let headerLines = 原始.内容.subarray(0, separator).toString('utf8').split('\n')
  let blocks: string[] = []
  for (let line of headerLines) {
    if (line.startsWith(' ') && blocks.length > 0) {
      let lastIndex = blocks.length - 1
      let previous = blocks[lastIndex]
      if (previous !== undefined) blocks[lastIndex] = `${previous}\n${line}`
    } else {
      blocks.push(line)
    }
  }
  let retained = blocks.filter(
    (block) =>
      block.startsWith('parent ') === false &&
      block.startsWith('gpgsig') === false &&
      block.startsWith('mergetag ') === false,
  )
  let treeIndex = retained.findIndex((block) => block.startsWith('tree '))
  if (treeIndex < 0) throw new Error('Git commit 对象缺少 tree')
  retained.splice(treeIndex + 1, 0, ...新父提交.map((parent) => `parent ${parent}`))
  return Buffer.concat([Buffer.from(`${retained.join('\n')}\n\n`, 'utf8'), message])
}

async function 读取原始提交(项目路径: string, commit: string): Promise<原始提交> {
  let content = await 执行Git并输入(项目路径, ['cat-file', 'commit', commit], Buffer.alloc(0))
  return 解析原始提交(content)
}

async function 写入提交对象(项目路径: string, content: Buffer): Promise<string> {
  let result = await 执行Git并输入(项目路径, ['hash-object', '-t', 'commit', '-w', '--stdin'], content)
  return result.toString('utf8').trim()
}

async function 验证输出分支(项目路径: string, 输出分支: string): Promise<string> {
  let branch = 输出分支.trim()
  if (branch === '') throw new Error('请输入输出分支名称')
  let formatResult = await 执行Git(项目路径, ['check-ref-format', '--branch', branch], { 允许失败: true })
  if (formatResult.退出码 !== 0) throw new Error(`无效的输出分支名称：${branch}`)
  let ref = `refs/heads/${branch}`
  let exists = await 执行Git(项目路径, ['show-ref', '--verify', '--quiet', ref], { 允许失败: true, 禁用替换: true })
  if (exists.退出码 === 0) throw new Error(`分支 ${branch} 已存在，请使用其他名称`)

  let result = await 执行Git(项目路径, ['worktree', 'list', '--porcelain'])
  if (result.stdout.split('\n').some((line) => line === `branch ${ref}`)) {
    throw new Error(`分支 ${branch} 正在某个工作区中使用，请先切换到其他分支`)
  }
  return ref
}

async function 物化模板尾部(分析: 仓库分析结果): Promise<{ tip: string; count: number }> {
  let range = `${分析.模板起点.哈希}..${模板源引用}`
  let listResult = await 执行Git(分析.项目路径, ['rev-list', '--reverse', '--topo-order', range], { 禁用替换: true })
  let commits = listResult.stdout.split('\n').filter((item) => item !== '')
  if (commits.length === 0) return { tip: 分析.项目起点.哈希, count: 0 }

  let commitSet = new Set(commits)
  let mapping = new Map<string, string>([[分析.模板起点.哈希, 分析.项目起点.哈希]])
  for (let commit of commits) {
    let original = await 读取原始提交(分析.项目路径, commit)
    let parents: string[] = []
    for (let parent of original.父提交) {
      let mapped = mapping.get(parent)
      if (mapped !== undefined) parents.push(mapped)
      else if (commitSet.has(parent)) throw new Error(`模板提交拓扑顺序异常：${parent}`)
      else parents.push(分析.项目起点.哈希)
    }
    let uniqueParents = [...new Set(parents)]
    if (uniqueParents.length === 0) uniqueParents.push(分析.项目起点.哈希)
    let rewritten = await 写入提交对象(分析.项目路径, 重写提交父级(original, uniqueParents))
    mapping.set(commit, rewritten)
  }

  let tip = mapping.get(分析.模板最新.哈希)
  if (tip === undefined) throw new Error('无法确定重建后的模板分支末端')
  return { tip, count: commits.length }
}

export async function 创建嫁接(参数: 创建嫁接参数): Promise<嫁接结果> {
  let 分析 = await 分析仓库(参数)
  let 导入分支 = 参数.输出分支.trim()
  let 导入引用 = await 验证输出分支(分析.项目路径, 导入分支)

  await 执行Git(分析.项目路径, ['fetch', '--no-tags', 分析.模板路径, `+${分析.模板分支}:${模板源引用}`])
  try {
    let sourceTip = await 执行Git(分析.项目路径, ['rev-parse', 模板源引用], { 禁用替换: true })
    if (sourceTip.stdout !== 分析.模板最新.哈希) throw new Error('模板分支在分析期间发生了变化，请重新分析')
    let materialized = await 物化模板尾部(分析)
    await 执行Git(分析.项目路径, ['update-ref', 导入引用, materialized.tip], { 禁用替换: true })

    return {
      ...分析,
      导入分支,
      重建提交数: materialized.count,
      合并命令: `git merge ${导入分支}`,
      变基命令: `git rebase ${导入分支}`,
    }
  } finally {
    await 执行Git(分析.项目路径, ['update-ref', '-d', 模板源引用], { 允许失败: true, 禁用替换: true })
  }
}
