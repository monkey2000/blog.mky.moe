---
layout: post
title: 在 Hetzner 上配置 NixOS RAIDZ 全盘加密
date: 2021-08-01 23:40
tags:
    - NixOS
---

## 1. 使用 kexec 进入 NixOS live 环境

从 Rescue 环境启动后，按照 [NixOS Wiki](https://nixos.wiki/wiki/Install_NixOS_on_Hetzner_Online#Bootstrap_from_the_Rescue_System) 的指示，通过 kexec 进入 NixOS live 环境。

需要注意的是，进入 NixOS live 环境后，会有一个 pending 的 reboot（我猜是为了防止机器失联），因此我们需要把它取消掉：

```bash
shutdown -c
```

## 2. 在 NixOS 中对磁盘进行分区

我的 Hetnzer 杜甫上有四块硬盘，考虑到我的杜甫一般是 Legacy 启动，如果需要构建 RAIDZ 的话，每块磁盘都需要如下的分区结构：

1. 1MB: BIOS boot partition
2. 2GB: /boot
3. Rest: RAIDZ

理论上也可以开工单给 Hetzner 让他们帮忙修改为 UEFI 启动，这样只需要在每个磁盘上创建一个 mirrored 的 ESP 分区即可，但我比
较懒不想等工单 23333 。

具体分区脚本参考了 [mazzo.li](https://mazzo.li/posts/hetzner-zfs.html)：

```bash
for disk in /dev/sda /dev/sdb /dev/sdc /dev/sdd; do
parted --script $disk mklabel gpt
parted --script --align optimal $disk -- mklabel gpt mkpart 'BIOS-boot' 1MB 2MB set 1 bios_grub on mkpart 'boot' 2MB 2000MB mkpart 'zfs-pool' 2000MB '100%'
done
```

接着，将所有的 /boot 分区格式化为 vfat：

```bash
mkfs.vfat /dev/sda2 && mkfs.vfat /dev/sdb2 && mkfs.vfat /dev/sdc2 && mkfs.vfat /dev/sdd2
```

## 3. 配置 zpool

```bash
zpool create \
  -O mountpoint=none -o ashift=12 -O atime=off -O acltype=posixacl -O xattr=sa -O compression=lz4 \
  -O encryption=aes-256-gcm -O keyformat=passphrase \
  zroot raidz \
  ata-xxxxx-part3 \
  ata-xxxxx-part3 \
  ata-xxxxx-part3 \
  ata-xxxxx-part3
```

接着他会让你输入一下全盘加密的密钥。然后我们可以配置几个挂载点了；

```bash
zfs create -o mountpoint=legacy zroot/root
zfs create -o mountpoint=legacy zroot/root/home
zfs create -o mountpoint=legacy zroot/root/nix
mount -t zfs zroot/root /mnt
mkdir /mnt/home && mkdir /mnt/nix
mount -t zfs zroot/root/home /mnt/home
mount -t zfs zroot/root/nix /mnt/nix
mkdir /mnt/boot-1 && mkdir /mnt/boot-2 && mkdir /mnt/boot-3 && mkdir /mnt/boot-4
mount /dev/sda2 /mnt/boot-1 && mount /dev/sdb2 /mnt/boot-2 && mount /dev/sdc2 /mnt/boot-3 && mount /dev/sdd2 /mnt/boot-4
```

## 4. 配置 initrd 的 ssh 主机密钥

接着，我们给 initrd 配置一个 ssh 主机密钥，用来在系统重启后 prompt zfs 的密钥。

```bash
ssh-keygen -t ed25519 -N "" -f /mnt/boot-1/initrd-ssh-key
cp /mnt/boot-1/initrd-ssh-key /mnt/boot-2 && cp /mnt/boot-1/initrd-ssh-key /mnt/boot-3 && cp /mnt/boot-1/initrd-ssh-key /mnt/boot-4
```

## 5. 安装和配置 NixOS

首先请出经典节目：

```bash
nixos-generate-config --root /mnt
```

### 5.1 配置 SSH 登录

首先先配一下 SSH 登录，防止机器装好之后失联 23333。

```nix
users.users.root.openssh.authorizedKeys.keys = [
  "ssh-rsa XXXXXXXXXXXX"
];

services.openssh.enable = true;
services.openssh.permitRootLogin = "prohibit-password";
```

### 5.2 配置 zfs 支持

提示：这个 `hostId` 可以通过 `head -c 8 /etc/machine-id` 来拿。

```nix
networking.hostName = "XXXX";
networking.hostId = "XXXXXXXX";

boot.supportedFilesystems = [ "zfs" ];

boot.loader.grub.enable = true;
boot.loader.grub.efiSupport = false;
boot.loader.grub.copyKernels = true;
```

### 5.3 定制 initrd

```nix
boot.initrd.availableKernelModules = [ "r8169" ];
boot.kernelParams = [
  # See <https://www.kernel.org/doc/Documentation/filesystems/nfs/nfsroot.txt> for docs on this
  # ip=<client-ip>:<server-ip>:<gw-ip>:<netmask>:<hostname>:<device>:<autoconf>:<dns0-ip>:<dns1-ip>:<ntp0-ip>
  "ip=144.76.95.122::144.76.95.97:255.255.255.224:centaurea-initrd:enp3s0:off:8.8.8.8"
];
boot.initrd.network = {
  enable = true;
  ssh = {
      enable = true;
      port = 2222;
      hostKeys = [
        /boot-1/initrd-ssh-key
        /boot-2/initrd-ssh-key
        /boot-3/initrd-ssh-key
        /boot-4/initrd-ssh-key
      ];
      authorizedKeys = [
        "ssh-rsa XXXX"
      ];
  };
  postCommands = ''
    cat <<EOF > /root/.profile
    if pgrep -x "zfs" > /dev/null
    then
      zfs load-key -a
      killall zfs
    else
      echo "zfs not running -- maybe the pool is taking some time to load for some unforseen reason."
    fi
    EOF
  '';
};
```

## 6. 注意事项

配置完成后就可以开始冒烟了，注意检查一下 fstab 是否良好。

我遇到了一个奇怪的问题，但并不是不能工作，在 initrd 里 NixOS 并不会 import 我的 pool，因此需要手动 import 之后
再手动输入密钥。只要 zpool 能够被 systemd 找到，他就会自动 kick in 完成 switch rootfs 的工作，输入密钥后静候即可 :)

考虑到手动挡破车开着也挺好的，我就不打算再花时间排查了。
