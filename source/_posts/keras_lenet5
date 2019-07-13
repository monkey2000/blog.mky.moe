---
layout: post
title: Keras[1]: 实现 LeNet-5
date: 2019-07-13
tags:
    - Keras 入门
    - LeNet-5
---

参考 [知乎专栏 深度学习炼丹师](https://zhuanlan.zhihu.com/p/31612931) 和 [Keras 的一个 Example](https://keras.io/examples/mnist_cnn/) 。

网络结构比较简单，就是 5x5 的卷积和 2x2 的最大池化交替，然后接两个 120 和 84 个节点的全联通，最后接 10 分类的 softmax 。

## 训练代码

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import keras
from keras.datasets import mnist
from keras.layers import Input, Dense, Flatten, Conv2D, MaxPooling2D
from keras.models import Model
import keras.backend as K

# 常量定义
batch_size = 128
num_classes = 10
epochs = 12
img_rows = 28
img_cols = 28

# 加载数据
(x_train, y_train), (x_test, y_test) = mnist.load_data()

print("Shapes: x_train {0} y_train {1} x_test {2} y_test {3}"
      .format(x_train.shape, y_train.shape, x_test.shape, y_test.shape))

# reshape 位图 shape=(-1, 28, 28, 1) 或 (-1, 1, 28, 28)
if K.image_data_format() == 'channels_first':
    x_train = x_train.reshape(x_train.shape[0], 1, img_rows, img_cols)
    x_test = x_test.reshape(x_test.shape[0], 1, img_rows, img_cols)
    input_shape = (1, img_rows, img_cols)
else:
    x_train = x_train.reshape(x_train.shape[0], img_rows, img_cols, 1)
    x_test = x_test.reshape(x_test.shape[0], img_rows, img_cols, 1)
    input_shape = (img_rows, img_cols, 1)

# 图像归一化 [0, 255] -> [0, 1]
x_train = x_train.astype('float32')
x_test = x_test.astype('float32')
x_train /= 255
x_test /= 255

print(x_train.shape[0], 'train samples')
print(x_test.shape[0], 'test samples')

# 把 label (0..9) 全部转换成 one-hot 的向量
y_train = keras.utils.to_categorical(y_train, num_classes)
y_test = keras.utils.to_categorical(y_test, num_classes)

# 构造模型
image = Input(shape=input_shape, name='input')
conv1 = Conv2D(6, (5, 5), name='conv1', activation='tanh')(image)
pool1 = MaxPooling2D((2, 2))(conv1)
conv2 = Conv2D(6, (5, 5), name='conv2', activation='tanh')(pool1)
pool2 = MaxPooling2D((2, 2))(conv2)
flat  = Flatten()(pool2)
fc1   = Dense(120, activation='tanh', name='fc1')(flat)
fc2   = Dense(84, activation='tanh', name='fc2')(fc1)
out   = Dense(10, activation='softmax')(fc2)

model = Model(inputs=image, outputs=out, name='lenet_5')

# 编译模型 使用SGD优化器 损失函数是分类交叉熵 输出accuracy
model.compile(optimizer='sgd', loss='categorical_crossentropy',
              metrics=['accuracy'])
model.fit(x_train, y_train, epochs=epochs, batch_size=batch_size, verbose=1,
          validation_data=(x_test, y_test))

# 保存模型
model.save('lenet5.h5')
print('Model saved')
```

## 训练输出

```
Shapes: x_train (60000, 28, 28) y_train (60000,) x_test (10000, 28, 28) y_test (10000,)
60000 train samples
10000 test samples
Train on 60000 samples, validate on 10000 samples
Epoch 1/12
60000/60000 [==============================] - 3s 50us/step - loss: 1.3266 - acc: 0.6541 - val_loss: 0.6194 - val_acc: 0.8616
Epoch 2/12
60000/60000 [==============================] - 3s 45us/step - loss: 0.4817 - acc: 0.8821 - val_loss: 0.3638 - val_acc: 0.9101
Epoch 3/12
60000/60000 [==============================] - 3s 45us/step - loss: 0.3345 - acc: 0.9118 - val_loss: 0.2788 - val_acc: 0.9256
Epoch 4/12
60000/60000 [==============================] - 3s 45us/step - loss: 0.2723 - acc: 0.9260 - val_loss: 0.2353 - val_acc: 0.9367
Epoch 5/12
60000/60000 [==============================] - 3s 46us/step - loss: 0.2351 - acc: 0.9347 - val_loss: 0.2055 - val_acc: 0.9430
Epoch 6/12
60000/60000 [==============================] - 3s 44us/step - loss: 0.2091 - acc: 0.9411 - val_loss: 0.1836 - val_acc: 0.9486
Epoch 7/12
60000/60000 [==============================] - 3s 44us/step - loss: 0.1893 - acc: 0.9464 - val_loss: 0.1675 - val_acc: 0.9522
Epoch 8/12
60000/60000 [==============================] - 3s 45us/step - loss: 0.1733 - acc: 0.9506 - val_loss: 0.1538 - val_acc: 0.9570
Epoch 9/12
60000/60000 [==============================] - 3s 46us/step - loss: 0.1600 - acc: 0.9543 - val_loss: 0.1428 - val_acc: 0.9599
Epoch 10/12
60000/60000 [==============================] - 3s 46us/step - loss: 0.1487 - acc: 0.9578 - val_loss: 0.1323 - val_acc: 0.9621
Epoch 11/12
60000/60000 [==============================] - 3s 46us/step - loss: 0.1389 - acc: 0.9603 - val_loss: 0.1237 - val_acc: 0.9637
Epoch 12/12
60000/60000 [==============================] - 3s 46us/step - loss: 0.1307 - acc: 0.9626 - val_loss: 0.1166 - val_acc: 0.9656
Model saved
```

## 调用例程

> 事实上我们只需要 `keras.models.load_model('path_to_your_h5_file')` 就可以反序列化刚才的 model

为了方便测试，是用了 XBM 格式的图片，这样可以在 mtPaint 之类的画板软件里创建位图，然后用编辑器打开，直接把 bytes 粘贴过来。

这是一个 9 （XBM 格式，一个合法的 C 文件）：

```c
#define xbm_width 28
#define xbm_height 28
static unsigned char xbm_bits[] = {
 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
 0x00, 0xF8, 0x00, 0x00, 0x00, 0x8C, 0x01, 0x00, 0x00, 0x0C, 0x01, 0x00,
 0x00, 0x04, 0x01, 0x00, 0x00, 0x04, 0x03, 0x00, 0x00, 0x8C, 0x03, 0x00,
 0x00, 0xF8, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
 0x00, 0x80, 0x01, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x78, 0x00, 0x00,
 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
 0x00, 0x00, 0x00, 0x00 };
```

好吧我们可视化一下：

```python
[[0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 1 1 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 1 1 1 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]
 [0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0]]
```

调用例程：

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from keras.models import load_model
import numpy as np

model = load_model('lenet5.h5')

image = \
[0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
 0x00, 0xF8, 0x00, 0x00, 0x00, 0x8C, 0x01, 0x00, 0x00, 0x0C, 0x01, 0x00,
 0x00, 0x04, 0x01, 0x00, 0x00, 0x04, 0x03, 0x00, 0x00, 0x8C, 0x03, 0x00,
 0x00, 0xF8, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
 0x00, 0x80, 0x01, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x78, 0x00, 0x00,
 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
 0x00, 0x00, 0x00, 0x00]

image = [ (image[i>>3] >> (i&7)) & 1 for i in range(len(image) * 8) ]
image = np.reshape(image, (28, -1))
image = np.array_split(image, (0, 28), axis=1)[1]

print('Image:')
print(image)

x = image.reshape([-1, 28, 28, 1])

y = model.predict(x).argmax()

print('Prediction:', y)
```

输出结果是 9 。