# Template Sync

Template Sync 是一个 Electron 桌面工具，用于恢复“由模板创建的项目”与模板仓库之间丢失的 Git 共同历史。

它会：

1. 查找项目起始提交与模板分支中 tree 完全一致的提交；
2. 把模板分支导入项目仓库；
3. 重建模板公共点之后的提交，让导入分支真实地从项目起点开始；
4. 创建用户指定名称的普通本地分支，并给出 merge 和 rebase 命令。

界面默认使用带时间戳的分支名称，例如 `template-sync/20260731-120000`。名称可以修改，但不会覆盖项目中已有的同名分支。

重建过程保留模板提交的文件树、作者、提交者、时间、消息和分支拓扑，但因为父提交发生改变，重建后的 commit hash 会变化，原有 GPG 签名也无法保留。

Template Sync 不会改写项目已有提交，也不会自动合并、变基或处理冲突。

## 开发

```bash
pnpm install
pnpm run run:electron:dev
```

## 检查

```bash
pnpm exec vitest run test/template-sync/git-service.test.ts
pnpm exec tsc --noEmit
```
