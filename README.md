## install
support webpack 4x
```
npm i @jarzzzi/resourcehints-webpack-plugin --save-dev
```

## plugin options
+ excludeHtml
  - {Array<string>}|undefined
  - 排除的 html 页面
+ exclude
  - {Array<string>}|undefined
  - 排除的 chunk
+ includ
  - string|{Array<string>}|undefined
  - all
  - initial
  - async
  - 指定的 chunk
+ rel
  - string
  - dns-prefetch
  - preconnect
  - preload
  - prefetch
+ as
  - string
  - image, font, style, script, fetch, audio, video, worker, document, object, embed, track
  - 相应的 as

## about resource hints
- dns-prefetch： 提前解析 dns
- preconnect： 提前链接
- preload： 提前加载当前页面资源
- prefetch： 当前页面空闲时，提前加载下一页面资源
- prerender： chrome 已废弃
- subresource： chrome 已废弃

## demo
```
new ResourceHitWebpackPlugin({
  rel: 'dns-prefetch',
  include: [
    '//www.baidu.com',
  ],
}),
new ResourceHitWebpackPlugin({
  rel: 'preconnect',
  include: [
    '//www.baidu.com',
  ],
}),
new ResourceHitWebpackPlugin({
  rel: 'prefetch',
  exclude: ['chunk-one'],
}),
new ResourceHitWebpackPlugin({
  rel: 'preload',
  include: 'async',
  exclude: ['chunk-one'],
}),
new ResourceHitWebpackPlugin({
  rel: 'preload',
  include: 'initial',
  exclude: ['chunk-one'],
  excludeHtml: ['demo-page'],
}),
new ResourceHitWebpackPlugin({
  rel: 'preload',
  include: 'all',
  exclude: ['chunk-one'],
  excludeHtml: ['demo-page'],
}),
new ResourceHitWebpackPlugin({
  rel: 'preload',
  as: 'script',
  include: ['vendor', 'polyfill', 'common-lib'],
}),
new ResourceHitWebpackPlugin({
  rel: 'preload',
  as: 'font',
  include: ['yahei'],
}),
```