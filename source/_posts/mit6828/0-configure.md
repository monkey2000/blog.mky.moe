---
layout: post
title: MIT 6.828 - 0. 配置环境
date: 2019-11-22 02:34
tags:
    - MIT 6.828
---

使用 `Linux 5.2.21-1-MANJARO #1 SMP PREEMPT Sat Oct 12 11:09:56 UTC 2019 x86_64 GNU/Linux` 。

2019 Fall 要求在 RISC-V 上做，妙极了。

# 1. 安装必要的包

按官网要求 `sudo pacman -S riscv64-linux-gnu-binutils riscv64-linux-gnu-gcc riscv64-linux-gnu-gdb qemu-arch-extra` 。

出现故障，经检查需要先更新 Pacman 元数据 `sudo pacman -Syy`，之后成功。

测试：
```
$ riscv64-linux-gnu-gcc --version
riscv64-linux-gnu-gcc (GCC) 9.2.0
$ qemu-system-riscv64 --version
QEMU emulator version 4.1.0
```

下载代码：
```
$ git clone git://github.com/mit-pdos/xv6-riscv-fall19.git
```

测试：
```
$ make qemu
# ... lots of output ...
init: starting sh
$
```