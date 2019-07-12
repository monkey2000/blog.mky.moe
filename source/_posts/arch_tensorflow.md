---
layout: post
title: Arch 无痛安装 TensorFlow
date: 2019-07-12
tags:
    - 系统配置
---

核心坑点就是 Arch Linux 是滚动更新的系统，而且软件包一般都特别新。

> Pypi 里的 TensorFlow 依赖 CUDA 10.0 而 Pacman 只提供了 CUDA 10.1 就十分麻烦。

一种方法是自己手动编译，然而这十分浪费时间。

最佳的解决途径就是在 Pacman 中同时安装 tensorflow-gpu，因为相关的 binary 都是针对系统上最新的 CUDA 包编译的，
所以能够保证这些包之间完全能够兼容，加之 Arch Linux 官方仓库里的东西测试还算严格，就无痛解决这个问题了。
