"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(n); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var differenceWith = require('lodash/differenceWith');

var takeWhile = require('lodash/takeWhile');

var flatten = function flatten(arr) {
  return arr.reduce(function (prev, curr) {
    return prev.concat(curr);
  }, []);
};

var defaultOptions = {
  excludeHtml: [],
  // 不处理的 html
  exclude: [],
  // 不包含的 chunk
  include: 'all',
  // initial, async, all, []
  rel: 'preload',
  // dns-prefetch, preconnect, preload, prefetch, 
  as: '' // image, font, style, script, fetch, audio, video, worker, document, object, embed, track

};

var ResourceHintWebpackPlugin = /*#__PURE__*/function () {
  function ResourceHintWebpackPlugin(options) {
    _classCallCheck(this, ResourceHintWebpackPlugin);

    this.options = _objectSpread({}, defaultOptions, {}, options, {
      excludeHtml: [].concat(_toConsumableArray(defaultOptions.excludeHtml), _toConsumableArray(options.excludeHtml || [])),
      exclude: [].concat(_toConsumableArray(defaultOptions.exclude), _toConsumableArray(options.exclude || []))
    });
    this.htmlTemplate = '';
  }

  _createClass(ResourceHintWebpackPlugin, [{
    key: "apply",
    value: function apply(compiler) {
      var _this = this;

      compiler.hooks.compilation.tap(this.constructor.name, function (compilation) {
        var hook = compilation.hooks.htmlWebpackPluginAfterHtmlProcessing;

        if (!hook) {
          var _compiler$options$plu = compiler.options.plugins.filter(function (plugin) {
            return plugin.constructor.name === 'HtmlWebpackPlugin';
          }),
              _compiler$options$plu2 = _slicedToArray(_compiler$options$plu, 1),
              HtmlWebpackPlugin = _compiler$options$plu2[0];

          hook = HtmlWebpackPlugin.constructor.getHooks(compilation);
        }

        hook.beforeAssetTagGeneration.tapAsync(_this.constructor.name, function (htmlPluginData, callback) {
          try {
            callback(null, _this.genChunkAssetLinks(compilation, htmlPluginData));
          } catch (error) {
            callback(error);
          }
        });
        hook.afterTemplateExecution.tapAsync(_this.constructor.name, function (htmlPluginData, callback) {
          try {
            callback(null, _this.appendToHtml(htmlPluginData));
          } catch (error) {
            callback(error);
          }
        });
        compilation.hooks.moduleAsset.tap(_this.constructor.name, function (module, file) {
          _this.genModuleAssetLinks(file);
        });
      });
    }
  }, {
    key: "genModuleAssetLinks",
    value: function genModuleAssetLinks(file) {
      var _this2 = this;

      if (!Array.isArray(this.options.include) && !this.options.as && (this.options.rel !== 'preload' || this.options.rel !== 'prefetch')) return;
      var f = file.split('/').pop();
      this.options.include.forEach(function (item) {
        if (f.startsWith(item)) {
          var asValue = '';
          if (file.match(/\.woff2|ttf|eot$/)) asValue = 'font';else if (file.match(/\.(jpeg|png|svg|jpg|gif|webp)$/)) asValue = 'image';else if (file.match(/\.(mp3|m3u8|wma|wav)$/)) asValue = 'audio';else if (file.match(/\.(mp4|avi|mov|flv|wmv|m4v|ogg|mpeg|webm)$/)) asValue = 'video';else asValue = _this2.options.as;
          var crossOrigin = asValue === 'font' ? 'crossorigin="crossorigin"' : '';
          _this2.htmlTemplate += "<link rel=\"".concat(_this2.options.rel, "\" as=\"").concat(asValue, "\" ").concat(crossOrigin, " href=\"").concat(file, "\">\n");
        }
      });
      console.log(this.htmlTemplate);
    }
  }, {
    key: "genChunkAssetLinks",
    value: function genChunkAssetLinks(compilation, htmlPluginData) {
      var _this3 = this;

      var publicPath = compilation.outputOptions.publicPath || '';
      var chunks = compilation.chunks; // webpack 内部处理的 chunk，不包括 dll 的

      var plugin = htmlPluginData.plugin;
      var assets = [].concat(_toConsumableArray(htmlPluginData.assets.js), _toConsumableArray(htmlPluginData.assets.css)); // 没有 async 的 chunk，包含 dll 的 chunk

      var assetsJs = _toConsumableArray(htmlPluginData.assets.js);

      var assetsCss = _toConsumableArray(htmlPluginData.assets.css);

      var extractedChunks = []; // 排除的地址，不插入 resource hints，一般多页？？

      if (this.options.excludeHtml.indexOf(plugin.options.filename) > -1) {
        return htmlPluginData;
      } // 处理 dns-prefetch, preconnect


      if (this.options.rel === 'dns-prefetch' || this.options.rel === 'preconnect') {
        if (!Array.isArray(this.options.include)) return htmlPluginData;
        this.options.include.forEach(function (href) {
          _this3.htmlTemplate += "<link rel=\"".concat(_this3.options.rel, "\" href=\"").concat(href, "\">\n");
        });
      } // 处理 prefetch，chunk 必须是 async 的，不适合多页


      if (this.options.rel === 'prefetch') {
        try {
          extractedChunks = chunks.filter(function (chunk) {
            return !chunk.canBeInitial();
          });
        } catch (e) {
          extractedChunks = [];
        }

        var files = extractedChunks.map(function (chunk) {
          return chunk.files;
        });
        flatten(files).filter(function (chunk) {
          return chunk.indexOf('.js.map') === -1;
        }).forEach(function (chunk) {
          var href = "".concat(publicPath).concat(chunk);
          _this3.htmlTemplate += "<link rel=\"prefetch\" href=\"".concat(href, "\">\n");
        });
      } // 处理 preload


      if (this.options.rel === 'preload') {
        // async chunk, 排除 exclude 的 chunk， 不适合多页？
        if (this.options.include === undefined || this.options.include === 'async') {
          try {
            extractedChunks = chunks.filter(function (chunk) {
              return !chunk.canBeInitial();
            });
          } catch (e) {
            extractedChunks = chunks;
          }

          var _files = extractedChunks.map(function (chunk) {
            return chunk.files;
          });

          var chunksFiles = flatten(_files).filter(function (chunk) {
            return chunk.indexOf('.js.map') === -1;
          }).map(function (chunk) {
            return "".concat(publicPath).concat(chunk);
          });
          extractedChunks = differenceWith(chunksFiles, this.options.exclude, function (a, b) {
            var file = a.split('/').pop();
            return file.indexOf(b) > -1;
          });
        } // initial chunk，与 assets 合并去重，排除 exclude 的 chunk，不适合多页？
        else if (this.options.include === 'initial') {
            try {
              extractedChunks = chunks.filter(function (chunk) {
                return chunk.isOnlyInitial();
              });
            } catch (e) {
              extractedChunks = chunks;
            }

            var _files2 = extractedChunks.map(function (chunk) {
              return chunk.files;
            });

            var _chunksFiles = flatten(_files2).filter(function (chunk) {
              return chunk.indexOf('.js.map') === -1;
            }).map(function (chunk) {
              return "".concat(publicPath).concat(chunk);
            });

            extractedChunks = _toConsumableArray(new Set([].concat(_toConsumableArray(assets), _toConsumableArray(_chunksFiles))));
            extractedChunks = differenceWith(extractedChunks, this.options.exclude, function (a, b) {
              var file = a.split('/').pop();
              return file.indexOf(b) > -1;
            });
          } // all chunk, 与 assets 合并去重，排除 exclude 的 chunk，不适合对页？
          else if (this.options.include === 'all') {
              var _files3 = chunks.map(function (chunk) {
                return chunk.files;
              });

              var _chunksFiles2 = flatten(_files3).filter(function (chunk) {
                return chunk.indexOf('.js.map') === -1;
              }).map(function (chunk) {
                return "".concat(publicPath).concat(chunk);
              });

              extractedChunks = _toConsumableArray(new Set([].concat(_toConsumableArray(assets), _toConsumableArray(_chunksFiles2))));
              extractedChunks = differenceWith(extractedChunks, this.options.exclude, function (a, b) {
                var file = a.split('/').pop();
                return file.indexOf(b) > -1;
              });
            } // 只插入外部指定的 chunk，需要指定 as
            else if (Array.isArray(this.options.include) && this.options.as) {
                if (this.options.as === 'script') {
                  var _files4 = chunks.map(function (chunk) {
                    return chunk.files;
                  });

                  var _chunksFiles3 = flatten(_files4).filter(function (chunk) {
                    return chunk.indexOf('.js.map') === -1;
                  }).map(function (chunk) {
                    return "".concat(publicPath).concat(chunk);
                  });

                  extractedChunks = _toConsumableArray(new Set([].concat(_toConsumableArray(assetsJs), _toConsumableArray(_chunksFiles3))));
                  extractedChunks = takeWhile(extractedChunks, function (item) {
                    var file = item.split('/').pop();
                    var res = false;

                    _this3.options.include.forEach(function (i) {
                      if (file.startsWith(i)) {
                        res = true;
                      }
                    });

                    return res;
                  });
                } else if (this.options.as === 'style') {
                  var _files5 = chunks.map(function (chunk) {
                    return chunk.files;
                  });

                  var _chunksFiles4 = flatten(_files5).filter(function (chunk) {
                    return chunk.indexOf('.css') > -1;
                  }).filter(function (chunk) {
                    return chunk.indexOf('.css.map') === -1;
                  }).map(function (chunk) {
                    return "".concat(publicPath).concat(chunk);
                  });

                  extractedChunks = _toConsumableArray(new Set([].concat(_toConsumableArray(assetsCss), _toConsumableArray(_chunksFiles4))));
                  extractedChunks = takeWhile(extractedChunks, function (item) {
                    var file = item.split('/').pop();
                    var res = false;

                    _this3.options.include.forEach(function (i) {
                      if (file.startsWith(i)) {
                        res = true;
                      }
                    });

                    return res;
                  });
                }
              }

        extractedChunks.forEach(function (href) {
          var asValue = _this3.options.as;
          if (href.match(/\.css$/)) asValue = 'style';else if (href.match(/\.js$/)) asValue = 'script';else asValue = 'script';
          _this3.htmlTemplate += "<link rel=\"preload\" as=\"".concat(asValue, "\" href=\"").concat(href, "\">\n");
        });
      }

      return htmlPluginData;
    }
  }, {
    key: "appendToHtml",
    value: function appendToHtml(htmlPluginData) {
      if (htmlPluginData.html.indexOf('</head>') !== -1) {
        htmlPluginData.html = htmlPluginData.html.replace('</head>', this.htmlTemplate + '</head>');
      } else {
        htmlPluginData.html = htmlPluginData.html.replace('<body>', '<head>' + this.htmlTemplate + '</head><body>');
      }

      return htmlPluginData;
    }
  }]);

  return ResourceHintWebpackPlugin;
}();

module.exports = ResourceHintWebpackPlugin;