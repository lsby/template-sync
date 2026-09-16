import { expect, test } from '@playwright/test'
import { 演示_完成, 演示_开场, 演示_点击, 演示_输入 } from '../../src/model/test-interactive'

test.describe('Template Sync E2E', (): void => {
  test('模板同步正常流程', async ({ page }): Promise<void> => {
    // 注入 mock electronAPI
    await page.addInitScript((): void => {
      let selectDirCounter = 0
      let win = window as unknown as { electronAPI: unknown }
      win.electronAPI = {
        选择目录: async (): Promise<string | null> => {
          selectDirCounter += 1
          return selectDirCounter === 1 ? '/mock/path/project' : '/mock/path/template'
        },
        列出模板分支: async (): Promise<string[]> => ['main', 'feat/a'],
        分析仓库: async (params: {
          项目路径: string
          模板路径: string
          模板分支: string
        }): Promise<Record<string, unknown>> => ({
          项目路径: params.项目路径,
          模板路径: params.模板路径,
          模板分支: params.模板分支,
          项目起点: { 哈希: '1111111111', 标题: 'Root', 提交时间: 1600000000 },
          模板起点: { 哈希: '1111111111', 标题: 'Root', 提交时间: 1600000000 },
          模板最新: { 哈希: '2222222222', 标题: 'Update', 提交时间: 1600001000 },
          更新提交数: 1,
          边界提交: ['1111111111'],
          项目工作区干净: true,
          模板工作区干净: true,
        }),
        创建嫁接: async (params: { 输出分支: string }): Promise<Record<string, unknown>> => ({
          导入分支: params.输出分支,
          重建提交数: 1,
          合并命令: `git merge ${params.输出分支}`,
          变基命令: `git rebase ${params.输出分支}`,
        }),
      }
    })

    await page.goto('/main.html')
    await 演示_开场(page, '【测试用例】Template Sync 同步流程\n验证选择项目、模板，分析并创建嫁接。')

    await 演示_点击(page.getByRole('button', { name: '选择' }).first())
    await expect(page.getByLabel('项目仓库')).toHaveValue('/mock/path/project')

    await 演示_点击(page.getByRole('button', { name: '选择' }).nth(1))
    await expect(page.getByLabel('模板仓库')).toHaveValue('/mock/path/template')

    let 模板分支 = page.getByLabel('模板分支')
    await expect(模板分支).toHaveValue('main') // 模拟返回了 ['main', 'feat/a'] 之后默认选了第一个

    await 演示_点击(page.getByRole('button', { name: '继续' }))

    // 验证分析结果页面
    await expect(page.getByText('匹配成功。请确认关键信息和输出分支名称。')).toBeVisible()
    await expect(page.getByText('模板更新 1 个提交')).toBeVisible()

    let 输出分支 = page.getByLabel('输出分支')
    await expect(输出分支).not.toBeEmpty()

    // 由于 fill 会覆盖之前的内容，我们先清空
    await 输出分支.fill('')
    await 演示_输入(输出分支, 'graft/test-branch')

    await 演示_点击(page.getByRole('button', { name: '确认并创建分支' }))

    // 验证成功页面
    await expect(page.getByText('分支创建完成。它现在是项目仓库中的普通本地分支。')).toBeVisible()
    await expect(page.getByText('导入分支 graft/test-branch')).toBeVisible()
    await expect(page.getByText('git merge graft/test-branch')).toBeVisible()

    await 演示_完成(page, 'Template Sync 验证完成。')
  })
})
