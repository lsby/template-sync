import { execFile, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { promisify } from 'node:util'

let execFileAsync = promisify(execFile)

type Git执行选项 = { 允许失败?: boolean; 禁用替换?: boolean; 环境变量?: NodeJS.ProcessEnv }

type Git执行结果 = { stdout: string; stderr: string; 退出码: number }

function 清理输出(value: string): string {
  return value.replace(/\r\n/g, '\n').trim()
}

export async function 执行Git(工作目录: string, 参数: string[], 选项: Git执行选项 = {}): Promise<Git执行结果> {
  if (existsSync(工作目录) === false) {
    throw new Error(`目录不存在：${工作目录}`)
  }

  let env = { ...process.env, ...选项.环境变量 }
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
    if (gitError.code === 'ENOENT') {
      if (existsSync(工作目录) === false) {
        throw new Error(`目录不存在：${工作目录}`)
      }
      throw new Error('未找到 Git，请先安装 Git 并确保 git 命令可用')
    }

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

export async function 执行Git并输入(工作目录: string, 参数: string[], 输入: Buffer): Promise<Buffer> {
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
