---
layout: post
title: "Fedora 31 配置安装 NVIDIA 闭源驱动和 CUDA"
date: 2020-01-27
tags:
    - 杂类
---

### 1. 参考文献

1. [RPMFusion: Howto/NVIDIA](https://rpmfusion.org/Howto/NVIDIA#Current_GeForce.2FQuadro.2FTesla)
2. [RPMFusion: Howto/Optimus](https://rpmfusion.org/Howto/Optimus)
3. [RPMFusion: Howto/CUDA](https://rpmfusion.org/Howto/CUDA)
4. 其他网页用于确认一些本文提到的细节

### 2. 解释

本文只面向 Fedora 31 ，可能在更新版本上仍然有效。

我自初中开始成为 Fedora 的忠实用户，印象中安装闭源驱动和配置 CUDA 始终是一件麻烦事，但这回发现 NVIDIA 回心转意，不知道为啥给基于 Optimus 的笔记本配置闭源驱动竟然变得非常容易了。

目前在 Linux 上有两套方案可以实现实时显卡切换：
1. Bumblebee：（历史上出过 `rm -rf /` 大锅的开源方案）本质是开一个独立的显示器由显卡渲染之后截图、压缩，回传CPU之后由核显渲染显示，好处是可以兼容开源/闭源驱动。
2. NV-PRIME：没研究过，经此次安装，发现简洁好用，自动切换，达到和 Windows 一样的易用性。

### 3. 配置步骤

前提条件：你需要安装 `rpmfusion` ，此处省略，可参考 [TUNA: RPMFusion 镜像使用帮助](https://mirrors.tuna.tsinghua.edu.cn/help/rpmfusion/) 。

第一步：从 RPMFusion 安装 NVIDIA 闭源驱动。

```bash
sudo dnf install akmod-nvidia # rhel/centos users can use kmod-nvidia instead
sudo dnf install xorg-x11-drv-nvidia-cuda #optional for cuda/nvdec/nvenc support
sudo dnf update -y
```

第二步：安装 CUDA 。

这块有两种办法，如果你的网速很快，可以尝试：

```bash
sudo dnf config-manager --add-repo http://developer.download.nvidia.com/compute/cuda/repos/fedora29/x86_64/cuda-fedora29.repo
sudo dnf clean all
sudo dnf install cuda
```

除此之外，可以自 [NVIDIA 官网下载](https://developer.nvidia.com/cuda-downloads) CUDA Toolkit Runfile(Local)，安装时不选择安装驱动即可；如遇 gcc 不兼容，请加入参数 `--override`。

第三步：安装低版本 gcc。

由于 Feodra 31 已经用上了 gcc 9，故我们需要降级。

```bash
sudo dnf install https://rpmfind.net/linux/centos/7/extras/x86_64/Packages/centos-release-scl-rh-2-3.el7.centos.noarch.rpm
sudo dnf install http://dl.kwizart.net/compat-libgfortran5-8.3.1-1.fc29.noarch.rpm
sudo dnf install devtoolset-8-toolchain
```

DTS (devtoolset) 是面向 RH 系的非侵入式多版本开发工具包/管理工具。

使用方法：

```
scl run devtoolset-8 bash       # 启动一个基于 gcc 8 的 bash
scl enable devtoolset-8 nsight  # 启动一额基于 gcc 8 的 nsight
```

第四步：重启，可发现疗效显著。
