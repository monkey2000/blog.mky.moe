---
layout: post
title: 2021 拜年红包
date: 2021-02-11 13:30
tags:
    - 杂项
---

祝大家牛年吉祥！牛气冲天！多发牛会！

下面是一个 misc 红包，具体而言，是 RAW 格式的 NTFS 镜像。它包含一个大包（66/2）和一个小包（10/10），每个红包都是八位数字的支付宝口令红包。欢迎你来玩！！！

[红包下载地址](https://stuxjtueducn-my.sharepoint.com/:u:/g/personal/lcy2000_stu_xjtu_edu_cn/EVc6yOJHadBDoG9Xfo0N1mMBiNy7JQ-FtvRx8HitXqXCUw?e=EUUMex)

### Update

Soha 已经通关，领到了 75% 的大包！

鉴于剩余红包过少，找到 key 的朋友可以凭 key 向我领取一个另一个口令（100/5）。

### Hint (17:00)

1. 这个镜像是 RAW 的 NTFS 镜像，因此，它包含一个 `DBR` 文件头
2. `DBR` 文件头中，记录了扇区大小，每簇扇区数，以及 `$MFT` 和 `$MFTMirr` 的簇号
3. `$MFT` 是 NTFS 中最重要的数据结构（它本身也是一个文件），它管理和记录了文件系统中所有文件的属性信息。而作为特殊的文件，`$MFT` 和 `$MFTMirr` 也被注册在案。
4. `$MFTMirr` 是 `$MFT` 的有限备份，他们分开储存，内容一致，有相同的结构
5. `$MFT` 的具体结构请上网查询
6. `$MFT` 中每个表项由 `FILE0` 这样一个魔数开始，当磁盘检查出错误表项时，该魔数被覆盖为 `BAAD0`
7. 大包的 key 是大端序写入的十六进制串，也即，`0x01 0x23 0x45 0x67` 对应红包口令 `01234567`
8. 大包口令在前，之后追加四位随机数字的 SHA1 为 `1d88c259b853862ed5eb02dab807fbdc8bfcc78b`
