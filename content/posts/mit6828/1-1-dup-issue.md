---
layout: post
title: "MIT 6.828 - 1.1 关于 dup / dup2 的一些问题"
date: 2019-11-23 21:36
tags:
    - MIT 6.828
---

在 Lab01 实验中，twd2 认为基于 `close-then-dup` 的方法实现的 `dup2` 是病态的，多线程下存在 race 风险。

```c
// from linux v0.11 fs/fcntl.c
static int dupfd(unsigned int fd, unsigned int arg)
{
	if (fd >= NR_OPEN || !current->filp[fd])
		return -EBADF;
	if (arg >= NR_OPEN)
		return -EINVAL;
	while (arg < NR_OPEN)
		if (current->filp[arg])
			arg++;
		else
			break;
	if (arg >= NR_OPEN)
		return -EMFILE;
	current->close_on_exec &= ~(1<<arg);
	(current->filp[arg] = current->filp[fd])->f_count++;
	return arg;
}

int sys_dup2(unsigned int oldfd, unsigned int newfd)
{
	sys_close(newfd);
	return dupfd(oldfd, newfd);
}
```

经过调查，我得到一些结论，此处按时间顺序还原。

# 1. Before 1995

这个时候 POSIX Thread 还没出来，因此 POSIX 标准中没有 share file descriptor table 的情况。该情况描述可见于 [ `linux/v5.3.12/fs/file.c#L851` ](https://elixir.bootlin.com/linux/v5.3.12/source/fs/file.c#L851)。

经过阅读代码 `glibc/sysdeps/posix/dup2.c` 中的 `dup2` 函数 ，发现该文件就采用了 `close-then-dup` 的写法实现 dup2 ；经参考 [ `linux/v0.1.0/fs/fcntl.c` ](https://github.com/run/linux0.11/blob/master/fs/fcntl.c#L36) 和 [ `linux/v1.0.0/fs/fcntl.c` ](https://github.com/velcheru91/linux1.0/blob/master/fs/fcntl.c#L38) 中的 `sys_dup2` 函数也采用了相同的做法。

经考证，这些代码都是 1995 年之前完成的。

# 2. After 1995

由于 POSIX Thread 的出现，内核需要处理多个线程同时访问 file descriptor table 的情况。此时内核中大部分访问进程元数据的代码都加了自旋锁。例如 linux v5.3.12 中的实现方法：

```c
static int do_dup2(struct files_struct *files,
	struct file *file, unsigned fd, unsigned flags)
__releases(&files->file_lock)                         // 似乎是一个 Annotation，用来标记这个函数会释放某个锁。加锁是在 linux/v5.3.12/source/fs/file.c#L909 的 ksys_dup3 中完成的。
{
	struct file *tofree;
	struct fdtable *fdt;

	/*
	 * We need to detect attempts to do dup2() over allocated but still
	 * not finished descriptor.  NB: OpenBSD avoids that at the price of
	 * extra work in their equivalent of fget() - they insert struct
	 * file immediately after grabbing descriptor, mark it larval if
	 * more work (e.g. actual opening) is needed and make sure that
	 * fget() treats larval files as absent.  Potentially interesting,
	 * but while extra work in fget() is trivial, locking implications
	 * and amount of surgery on open()-related paths in VFS are not.
	 * FreeBSD fails with -EBADF in the same situation, NetBSD "solution"
	 * deadlocks in rather amusing ways, AFAICS.  All of that is out of
	 * scope of POSIX or SUS, since neither considers shared descriptor
	 * tables and this condition does not arise without those.
	 */
	fdt = files_fdtable(files);
	tofree = fdt->fd[fd];
	if (!tofree && fd_is_open(fd, fdt))            // 特殊情况，只有 fd2 被其他线程竞争时会出现；正确做法是调用 dup2 前不要 close(fd2) 即可。
		goto Ebusy;
	get_file(file);
	rcu_assign_pointer(fdt->fd[fd], file);
	__set_open_fd(fd, fdt);
	if (flags & O_CLOEXEC)
		__set_close_on_exec(fd, fdt);
	else
		__clear_close_on_exec(fd, fdt);
	spin_unlock(&files->file_lock);                // 释放锁

	if (tofree)
		filp_close(tofree, files);

	return fd;

Ebusy:
	spin_unlock(&files->file_lock);                // 释放锁
	return -EBUSY;
}
```

# 3. 结论及展望

鉴于目前我处于 MIT 6.828 Lab 01，因此 race 情况不予考虑。似乎在 MIT 6.828 课程中，也未涉及 thread 内容。后续 Lab 只让设计了 user-space thread ，目测相当于 coroutine 。