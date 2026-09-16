import assert from 'node:assert'
import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'
import { 分析仓库, 列出模板分支, 创建嫁接 } from '../../src/template-sync/git-service'

let execFileAsync = promisify(execFile)

let 临时根目录 = path.resolve(process.cwd(), 'tmp/test-repos')
let 模板目录 = path.join(临时根目录, 'template')
let 项目目录 = path.join(临时根目录, 'project')

async function 执行Git(工作目录: string, 参数: string[]): Promise<string> {
  let { stdout } = await execFileAsync('git', 参数, { cwd: 工作目录, encoding: 'utf8', windowsHide: true })
  return stdout.trim()
}

function 清理临时目录(): void {
  if (existsSync(临时根目录) === true) {
    rmSync(临时根目录, { recursive: true, force: true })
  }
}

async function 准备测试环境(): Promise<{
  模板提交1哈希: string
  模板提交2哈希: string
  项目起点哈希: string
  项目提交2哈希: string
}> {
  清理临时目录()
  mkdirSync(模板目录, { recursive: true })
  mkdirSync(项目目录, { recursive: true })

  // === 模板仓库初始化 ===
  await 执行Git(模板目录, ['init'])
  await 执行Git(模板目录, ['checkout', '-b', 'main'])
  await 执行Git(模板目录, ['config', 'user.name', 'TestUser'])
  await 执行Git(模板目录, ['config', 'user.email', 'test@test.com'])

  // 1. 共同祖先提交
  writeFileSync(path.join(模板目录, 'common.txt'), 'Common Content')
  await 执行Git(模板目录, ['add', '.'])
  await 执行Git(模板目录, ['commit', '-m', 'Template Commit 1 (Common)'])
  let 模板提交1哈希 = await 执行Git(模板目录, ['rev-parse', 'HEAD'])

  // 2. 模板新提交
  writeFileSync(path.join(模板目录, 'template-only.txt'), 'Template Update')
  await 执行Git(模板目录, ['add', '.'])
  await 执行Git(模板目录, ['commit', '-m', 'Template Commit 2'])
  let 模板提交2哈希 = await 执行Git(模板目录, ['rev-parse', 'HEAD'])

  // === 项目仓库初始化 ===
  await 执行Git(项目目录, ['init'])
  await 执行Git(项目目录, ['checkout', '-b', 'main'])
  await 执行Git(项目目录, ['config', 'user.name', 'TestUser'])
  await 执行Git(项目目录, ['config', 'user.email', 'test@test.com'])

  // 1. 项目的起点（必须与模板的共同祖先具有相同的 Tree Hash）
  writeFileSync(path.join(项目目录, 'common.txt'), 'Common Content')
  await 执行Git(项目目录, ['add', '.'])
  await 执行Git(项目目录, ['commit', '-m', 'Project Root (Common)'])
  let 项目起点哈希 = await 执行Git(项目目录, ['rev-parse', 'HEAD'])

  // 2. 项目新提交
  writeFileSync(path.join(项目目录, 'project-only.txt'), 'Project Feature')
  await 执行Git(项目目录, ['add', '.'])
  await 执行Git(项目目录, ['commit', '-m', 'Project Commit 2'])
  let 项目提交2哈希 = await 执行Git(项目目录, ['rev-parse', 'HEAD'])

  return { 模板提交1哈希, 模板提交2哈希, 项目起点哈希, 项目提交2哈希 }
}

async function 主函数(): Promise<void> {
  console.log('========== 模板同步(Git服务)集成测试 ==========')

  // 运行前清理残留
  清理临时目录()

  // 注册进程退出时的兜底清理
  process.on('exit', () => {
    清理临时目录()
  })

  try {
    await 准备测试环境()

    // 1. 测试列出模板分支
    console.log('1. 测试列出模板分支...')
    let 分支列表 = await 列出模板分支(模板目录)
    assert.deepStrictEqual(分支列表, ['main'])
    console.log('✅ 列出模板分支通过')

    // 2. 测试分析仓库
    console.log('2. 测试分析仓库...')
    let 分析结果 = await 分析仓库({ 项目路径: 项目目录, 模板路径: 模板目录, 模板分支: 'main' })

    assert.strictEqual(分析结果.项目工作区干净, true)
    assert.strictEqual(分析结果.模板工作区干净, true)
    assert.strictEqual(分析结果.模板分支, 'main')
    assert.strictEqual(分析结果.更新提交数, 1)
    assert.strictEqual(分析结果.边界提交.length > 0, true)
    console.log('✅ 分析仓库通过')

    // 3. 测试创建嫁接分支
    console.log('3. 测试创建嫁接分支...')
    let 结果 = await 创建嫁接({ 项目路径: 项目目录, 模板路径: 模板目录, 模板分支: 'main', 输出分支: 'graft/main' })

    assert.strictEqual(结果.导入分支, 'graft/main')
    assert.strictEqual(结果.重建提交数, 1)
    assert.strictEqual(结果.合并命令, 'git merge graft/main')
    assert.strictEqual(结果.变基命令, 'git rebase graft/main')

    // 验证输出分支是否存在
    let 输出分支存在 = await 执行Git(项目目录, ['show-ref', '--verify', 'refs/heads/graft/main'])
    assert.strictEqual(输出分支存在.includes('refs/heads/graft/main'), true)

    // 验证重建后的分支历史正确连接至项目起点
    let 日志 = await 执行Git(项目目录, ['log', '--format=%H', 'graft/main'])
    let 提交历史 = 日志.split('\n').filter((行) => 行.trim() !== '')
    let 最早的父提交 = 提交历史[提交历史.length - 1]
    assert.strictEqual(最早的父提交, 结果.项目起点.哈希)
    console.log('✅ 创建嫁接分支通过')

    console.log('🎉 模板同步集成测试全部通过！')
    process.exit(0)
  } finally {
    // 运行后清理
    清理临时目录()
  }
}

主函数().catch((错误) => {
  清理临时目录()
  console.error('❌ 集成测试失败:', 错误)
  process.exit(1)
})
