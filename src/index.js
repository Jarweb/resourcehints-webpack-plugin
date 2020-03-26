const differenceWith = require('lodash/differenceWith')
const takeWhile = require('lodash/takeWhile')
const flatten = arr => arr.reduce((prev, curr) => prev.concat(curr), [])

const defaultOptions = {
  excludeHtml: [], // 不处理的 html
  exclude: [], // 不包含的 chunk
  include: 'all', // initial, async, all, []
  rel: 'preload', // dns-prefetch, preconnect, preload, prefetch, 
  as: '' // image, font, style, script, fetch, audio, video, worker, document, object, embed, track
}

class ResourceHintWebpackPlugin {
  constructor(options) {
    this.options = {
      ...defaultOptions, 
      ...options,
      excludeHtml: [...defaultOptions.excludeHtml, ...(options.excludeHtml || [])],
      exclude: [...defaultOptions.exclude, ...(options.exclude || [])],
    }
    this.htmlTemplate = ''
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(
      this.constructor.name,
      (compilation) => {
        let hook = compilation.hooks.htmlWebpackPluginAfterHtmlProcessing

        if (!hook) {
          const [HtmlWebpackPlugin] = compiler.options.plugins.filter(
            (plugin) => {
              return plugin.constructor.name === 'HtmlWebpackPlugin'
            })
          hook = HtmlWebpackPlugin.constructor.getHooks(compilation)
        }

        hook.beforeAssetTagGeneration.tapAsync(this.constructor.name, (htmlPluginData, callback) => {
          try {
            callback(null, this.genChunkAssetLinks(compilation, htmlPluginData))
          } catch (error) {
            callback(error)
          }
        })

        hook.afterTemplateExecution.tapAsync(this.constructor.name, (htmlPluginData, callback) => {
          try {
            callback(null, this.appendToHtml(htmlPluginData))
          } catch (error) {
            callback(error)
          }
        })

        compilation.hooks.moduleAsset.tap(this.constructor.name, (module, file) => {
          this.genModuleAssetLinks(file)
        })
      }
    )
  }

  genModuleAssetLinks(file) {
    if (
      !Array.isArray(this.options.include) && 
      !this.options.as && 
      (this.options.rel !== 'preload' || this.options.rel !== 'prefetch')
    ) return

    const f = file.split('/').pop()
    
    this.options.include.forEach(item => {
      if (f.startsWith(item)) {
        let asValue = ''

        if (file.match(/\.woff2|ttf|eot$/)) asValue = 'font'
        else if (file.match(/\.(jpeg|png|svg|jpg|gif|webp)$/)) asValue = 'image'
        else if (file.match(/\.(mp3|m3u8|wma|wav)$/)) asValue = 'audio'
        else if (file.match(/\.(mp4|avi|mov|flv|wmv|m4v|ogg|mpeg|webm)$/)) asValue = 'video'
        else asValue = this.options.as

        const crossOrigin = asValue === 'font' ? 'crossorigin="crossorigin"' : ''
        this.htmlTemplate += `<link rel="${this.options.rel}" as="${asValue}" ${crossOrigin } href="${file}">\n`
      }
    })
  }

  genChunkAssetLinks(compilation, htmlPluginData) {
    const publicPath = compilation.outputOptions.publicPath || ''
    const chunks = compilation.chunks // webpack 内部处理的 chunk，不包括 dll 的
    const plugin = htmlPluginData.plugin
    const assets = [...htmlPluginData.assets.js, ...htmlPluginData.assets.css] // 没有 async 的 chunk，包含 dll 的 chunk
    const assetsJs = [...htmlPluginData.assets.js]
    const assetsCss = [...htmlPluginData.assets.css]
    let extractedChunks = []

    // 排除的地址，不插入 resource hints，一般多页？？
    if (this.options.excludeHtml.indexOf(plugin.options.filename) > -1) {
      return htmlPluginData
    }
    
    // 处理 dns-prefetch, preconnect
    if (this.options.rel === 'dns-prefetch' || this.options.rel === 'preconnect') {
      if (!Array.isArray(this.options.include)) return htmlPluginData
      
      this.options.include.forEach((href) => {
        this.htmlTemplate += `<link rel="${this.options.rel}" href="${href}">\n`
      })
    }

    // 处理 prefetch，chunk 必须是 async 的，不适合多页
    if (this.options.rel === 'prefetch') {
      try {
        extractedChunks = chunks.filter(chunk => !chunk.canBeInitial())
      } catch (e) {
        extractedChunks = []
      }

      const files = extractedChunks.map(chunk => chunk.files)
      flatten(files)
        .filter(chunk => chunk.indexOf('.js.map') === -1)
        .forEach(chunk => {
          const href = `${publicPath}${chunk}`
          this.htmlTemplate += `<link rel="prefetch" href="${href}">\n`
        })
    }

    // 处理 preload
    if (this.options.rel === 'preload') {
      // async chunk, 排除 exclude 的 chunk， 不适合多页？
      if (this.options.include === undefined || this.options.include === 'async') {
        try {
          extractedChunks = chunks.filter(chunk => !chunk.canBeInitial())
        } catch (e) {
          extractedChunks = chunks
        }

        const files = extractedChunks.map(chunk => chunk.files)
        const chunksFiles = flatten(files)
          .filter(chunk => chunk.indexOf('.js.map') === -1)
          .map(chunk => `${publicPath}${chunk}`)

        extractedChunks = differenceWith(chunksFiles, this.options.exclude, (a, b) => {
            const file = a.split('/').pop()
            return file.indexOf(b) > -1
          })
      }
      // initial chunk，与 assets 合并去重，排除 exclude 的 chunk，不适合多页？
      else if (this.options.include === 'initial') {
        try {
          extractedChunks = chunks.filter(chunk => chunk.isOnlyInitial())
        } catch (e) {
          extractedChunks = chunks
        }

        const files = extractedChunks.map(chunk => chunk.files)
        const chunksFiles = flatten(files)
          .filter(chunk => chunk.indexOf('.js.map') === -1)
          .map(chunk => `${publicPath}${chunk}`)

        extractedChunks = [...new Set([...assets, ...chunksFiles])]
        extractedChunks = differenceWith(extractedChunks, this.options.exclude, (a, b) => {
          const file = a.split('/').pop()
          return file.indexOf(b) > -1
        })
      }
      // all chunk, 与 assets 合并去重，排除 exclude 的 chunk，不适合对页？
      else if (this.options.include === 'all') {
        const files = chunks.map(chunk => chunk.files)
        const chunksFiles = flatten(files)
          .filter(chunk => chunk.indexOf('.js.map') === -1)
          .map(chunk => `${publicPath}${chunk}`)

        extractedChunks = [...new Set([...assets, ...chunksFiles])]
        extractedChunks = differenceWith(extractedChunks, this.options.exclude, (a, b) => {
          const file = a.split('/').pop()
          return file.indexOf(b) > -1 
        })
      }
      // 只插入外部指定的 chunk，需要指定 as
      else if (Array.isArray(this.options.include) && this.options.as) {
        if (this.options.as === 'script') {
          const files = chunks.map(chunk => chunk.files)
          const chunksFiles = flatten(files)
            .filter(chunk => chunk.indexOf('.js.map') === -1)
            .map(chunk => `${publicPath}${chunk}`)
         
          extractedChunks = [...new Set([...assetsJs, ...chunksFiles])]
          extractedChunks = takeWhile(extractedChunks, (item) => {
            const file = item.split('/').pop()
            let res = false
            this.options.include.forEach(i => {
              if (file.startsWith(i)) {
                res = true
              }
            })
            return res
          })
        }
        else if (this.options.as === 'style') {
          const files = chunks.map(chunk => chunk.files)
          const chunksFiles = flatten(files)
            .filter(chunk => chunk.indexOf('.css') > -1)
            .filter(chunk => chunk.indexOf('.css.map') === -1)
            .map(chunk => `${publicPath}${chunk}`)

          extractedChunks = [...new Set([...assetsCss, ...chunksFiles])]
          extractedChunks = takeWhile(extractedChunks, (item) => {
            const file = item.split('/').pop()
            let res = false
            this.options.include.forEach(i => {
              if (file.startsWith(i)) {
                res = true
              }
            })
            return res
          })
        }
      }

      extractedChunks.forEach(href => {
        let asValue = this.options.as
        
        if (href.match(/\.css$/)) asValue = 'style'
        else if (href.match(/\.js$/)) asValue = 'script'
        else asValue = 'script'

        this.htmlTemplate += `<link rel="preload" as="${asValue}" href="${href}">\n`
      })
    }

    return htmlPluginData
  }

  appendToHtml(htmlPluginData) {
    if (htmlPluginData.html.indexOf('</head>') !== -1) {
      htmlPluginData.html = htmlPluginData.html.replace('</head>', this.htmlTemplate + '</head>');
    } else {
      htmlPluginData.html = htmlPluginData.html.replace('<body>', '<head>' + this.htmlTemplate + '</head><body>');
    }

    return htmlPluginData
  }
}

module.exports = ResourceHintWebpackPlugin