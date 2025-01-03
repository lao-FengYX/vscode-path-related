# path-related README

[English](README.EN.md)

这个插件的功能就是提供路径补全建议和路径跳转功能

使用此插件强烈建议关闭 `vscode` 的路径自动补全功能

```json
{ "typescript.suggest.paths": false }
{ "javascript.suggest.paths": false }
```

## Usage

![path-tip-example](public/images/path-tip.gif)

---

![path-jump-example](public/images/path-jump.gif)

## Extension Settings

| 配置项                | 描述                                                | 默认值                                   |
| --------------------- | --------------------------------------------------- | ---------------------------------------- |
| pathAlias             | 基于当前工作区的路径别名，例如：@ 映射到 src 文件夹 | {"@": "${workspaceFolder}/src"}          |
| ignoreHiddenFiles     | 忽略以点开头的文件                                  | false                                    |
| ignoreFileExt         | 在路径补全时需要忽略的文件后缀                      | [".js", ".ts", ".jsx", ".tsx", ".d.ts"]  |
| autoNextSuggest       | 自动提示下一个补全项                                | false                                    |
| jumpRecognition       | 跳转时识别规则                                      | "Alias Path"                             |
| allowSuffixExtensions | 在路径跳转时允许忽略的文件后缀                      | ["vue"]（默认读取 ignoreFileExt 配置项） |
| depsJumpAndTip        | 是否在路径跳转和路径提示时同时提示依赖路径          | false                                    |
| openTreeView          | 文档打开时自动关联到对应的文件视图                  | ["node_modules"]                         |
| enableTreeView        | 是否开启文件视图                                    | false                                    |

## Change Log

see CHANGELOG.md

## Reference

- [Path Intellisense](https://marketplace.visualstudio.com/items?itemName=christian-kohler.path-intellisense)
- [Path Autocomplete](https://marketplace.visualstudio.com/items?itemName=ionutvmi.path-autocomplete)
- [smart-jump](https://marketplace.visualstudio.com/items?itemName=deqiaochen.smart-jump)

**Enjoy!**
