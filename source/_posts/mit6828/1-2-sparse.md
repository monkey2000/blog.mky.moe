---
layout: post
title: "MIT 6.828 - 1.2 __acquires() 和 __releases()"
date: 2019-11-24 18:02
tags:
    - MIT 6.828
---

在对 dup / dup2 的源码分析中，我遇到了一对 annotation ，即 `__acquires` 和 `__releases`

```c
static int do_dup2(struct files_struct *files,
	struct file *file, unsigned fd, unsigned flags)
__releases(&files->file_lock) // <- 这个东西
{
    // ... omitted
}
```

经查阅，此为内核代码静态分析工具 Sparse 的 annotation 。Sparse 通过 gcc 的扩展属性 `__attribute__` 以及自己定义的 `__context__` 来对代码进行静态检查 。

其他可见 [内核文档](https://www.kernel.org/doc/html/v4.11/dev-tools/sparse.html) 或 [一篇博客](https://www.cnblogs.com/wang_yb/p/3575039.html) 。
