var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __pow = Math.pow;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
(function(factory) {
  typeof define === "function" && define.amd ? define(factory) : factory();
})(function() {
  "use strict";
  function unixTime() {
    return Math.round(Date.now() / 1e3);
  }
  function uuid() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    const charNum = chars.length;
    let text = "";
    for (let i = 0; i < 20; i++) {
      text += chars[Math.floor(Math.random() * charNum)];
    }
    return text;
  }
  function httpGetETag(headers) {
    return headers.get("Etag");
  }
  function httpGetLastModified(headers) {
    return headers.get("Last-Modified");
  }
  function httpGetETagOrLastModified(headers) {
    var _a;
    return (_a = httpGetETag(headers)) != null ? _a : httpGetLastModified(headers);
  }
  function httpGetContentRange(headers) {
    const contentRange = headers.get("Content-Range");
    if (contentRange == null)
      return null;
    return parseContentRange(contentRange);
  }
  function parseContentRange(v) {
    const normalized = v.trim().toLowerCase();
    const [unit, rest] = normalized.split(/\s+/);
    if (unit !== "bytes") {
      throw new Error(`Unit must be bytes: ${v}`);
    }
    const [range, totalSizeStr] = rest.split("/");
    const totalSize = totalSizeStr === "*" ? null : atoi(totalSizeStr);
    const [start, end] = (range.includes("-") ? range.split("-") : [null, null]).map((v2) => atoi(v2));
    const rangeSize = start != null && end != null ? end - start + 1 : null;
    return { totalSize, rangeSize, start, end };
  }
  function stringifyContentRange(v) {
    const range = v.start != null && v.end != null ? `${v.start}-${v.end}` : "*";
    const size = v.totalSize == null ? "*" : v.totalSize + "";
    return `bytes ${range}/${size}`;
  }
  function atoi(v) {
    return !v ? null : Number(v);
  }
  function httpGetRange(headers) {
    const range = headers.get("Range");
    if (range == null)
      return null;
    return parseRange(range);
  }
  function parseRange(v) {
    const normalized = v.trim().toLowerCase();
    if (!normalized.startsWith("bytes=")) {
      throw new Error(`Unit must be bytes: ${v}`);
    }
    if (normalized.includes(",")) {
      throw new Error(`Multiple range: ${v}`);
    }
    const [, startStr, endStr] = /(\d*)-(\d*)/.exec(normalized) || [];
    if (!startStr && !endStr) {
      throw new Error(`Invalid range values: ${v}`);
    }
    const [start, end] = [startStr, endStr].map((v2) => atoi(v2));
    const rangeSize = start != null && end != null ? end - start + 1 : null;
    return { start, end, rangeSize };
  }
  function queryStringify(params) {
    return Object.keys(params).map(
      (k) => [k, params[k]]
    ).filter(
      ([k, v]) => v !== void 0
    ).map(
      ([k, v]) => v === null ? k : [k, v].map(encodeURIComponent).join("=")
    ).join("&");
  }
  class Mutex {
    constructor() {
      __publicField(this, "locked", false);
      __publicField(this, "waitings", []);
      this.unlock = this.unlock.bind(this);
    }
    lock() {
      return __async(this, null, function* () {
        if (!this.locked) {
          this.locked = true;
          return this.unlock;
        }
        yield new Promise((resolve) => {
          this.waitings.push(resolve);
        });
        return this.unlock;
      });
    }
    unlock() {
      if (this.waitings.length === 0) {
        this.locked = false;
        return;
      }
      const waiting = this.waitings.shift();
      waiting();
    }
    runExclusive(job) {
      return __async(this, null, function* () {
        const unlock = yield this.lock();
        try {
          return yield job();
        } catch (e) {
          throw e;
        } finally {
          unlock();
        }
      });
    }
  }
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  var uaParser$1 = { exports: {} };
  (function(module, exports) {
    (function(window2, undefined$1) {
      var LIBVERSION = "1.0.2", EMPTY = "", UNKNOWN = "?", FUNC_TYPE = "function", UNDEF_TYPE = "undefined", OBJ_TYPE = "object", STR_TYPE = "string", MAJOR = "major", MODEL = "model", NAME = "name", TYPE = "type", VENDOR = "vendor", VERSION = "version", ARCHITECTURE = "architecture", CONSOLE = "console", MOBILE = "mobile", TABLET = "tablet", SMARTTV = "smarttv", WEARABLE = "wearable", EMBEDDED = "embedded", UA_MAX_LENGTH = 255;
      var AMAZON = "Amazon", APPLE = "Apple", ASUS = "ASUS", BLACKBERRY = "BlackBerry", BROWSER = "Browser", CHROME = "Chrome", EDGE = "Edge", FIREFOX = "Firefox", GOOGLE = "Google", HUAWEI = "Huawei", LG = "LG", MICROSOFT = "Microsoft", MOTOROLA = "Motorola", OPERA = "Opera", SAMSUNG = "Samsung", SONY = "Sony", XIAOMI = "Xiaomi", ZEBRA = "Zebra", FACEBOOK = "Facebook";
      var extend = function(regexes2, extensions) {
        var mergedRegexes = {};
        for (var i in regexes2) {
          if (extensions[i] && extensions[i].length % 2 === 0) {
            mergedRegexes[i] = extensions[i].concat(regexes2[i]);
          } else {
            mergedRegexes[i] = regexes2[i];
          }
        }
        return mergedRegexes;
      }, enumerize = function(arr) {
        var enums = {};
        for (var i = 0; i < arr.length; i++) {
          enums[arr[i].toUpperCase()] = arr[i];
        }
        return enums;
      }, has = function(str1, str2) {
        return typeof str1 === STR_TYPE ? lowerize(str2).indexOf(lowerize(str1)) !== -1 : false;
      }, lowerize = function(str) {
        return str.toLowerCase();
      }, majorize = function(version) {
        return typeof version === STR_TYPE ? version.replace(/[^\d\.]/g, EMPTY).split(".")[0] : undefined$1;
      }, trim = function(str, len) {
        if (typeof str === STR_TYPE) {
          str = str.replace(/^\s\s*/, EMPTY).replace(/\s\s*$/, EMPTY);
          return typeof len === UNDEF_TYPE ? str : str.substring(0, UA_MAX_LENGTH);
        }
      };
      var rgxMapper = function(ua, arrays) {
        var i = 0, j, k, p, q, matches, match;
        while (i < arrays.length && !matches) {
          var regex = arrays[i], props = arrays[i + 1];
          j = k = 0;
          while (j < regex.length && !matches) {
            matches = regex[j++].exec(ua);
            if (!!matches) {
              for (p = 0; p < props.length; p++) {
                match = matches[++k];
                q = props[p];
                if (typeof q === OBJ_TYPE && q.length > 0) {
                  if (q.length === 2) {
                    if (typeof q[1] == FUNC_TYPE) {
                      this[q[0]] = q[1].call(this, match);
                    } else {
                      this[q[0]] = q[1];
                    }
                  } else if (q.length === 3) {
                    if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                      this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined$1;
                    } else {
                      this[q[0]] = match ? match.replace(q[1], q[2]) : undefined$1;
                    }
                  } else if (q.length === 4) {
                    this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined$1;
                  }
                } else {
                  this[q] = match ? match : undefined$1;
                }
              }
            }
          }
          i += 2;
        }
      }, strMapper = function(str, map) {
        for (var i in map) {
          if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
            for (var j = 0; j < map[i].length; j++) {
              if (has(map[i][j], str)) {
                return i === UNKNOWN ? undefined$1 : i;
              }
            }
          } else if (has(map[i], str)) {
            return i === UNKNOWN ? undefined$1 : i;
          }
        }
        return str;
      };
      var oldSafariMap = {
        "1.0": "/8",
        "1.2": "/1",
        "1.3": "/3",
        "2.0": "/412",
        "2.0.2": "/416",
        "2.0.3": "/417",
        "2.0.4": "/419",
        "?": "/"
      }, windowsVersionMap = {
        "ME": "4.90",
        "NT 3.11": "NT3.51",
        "NT 4.0": "NT4.0",
        "2000": "NT 5.0",
        "XP": ["NT 5.1", "NT 5.2"],
        "Vista": "NT 6.0",
        "7": "NT 6.1",
        "8": "NT 6.2",
        "8.1": "NT 6.3",
        "10": ["NT 6.4", "NT 10.0"],
        "RT": "ARM"
      };
      var regexes = {
        browser: [
          [
            /\b(?:crmo|crios)\/([\w\.]+)/i
          ],
          [VERSION, [NAME, "Chrome"]],
          [
            /edg(?:e|ios|a)?\/([\w\.]+)/i
          ],
          [VERSION, [NAME, "Edge"]],
          [
            /(opera mini)\/([-\w\.]+)/i,
            /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i,
            /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i
          ],
          [NAME, VERSION],
          [
            /opios[\/ ]+([\w\.]+)/i
          ],
          [VERSION, [NAME, OPERA + " Mini"]],
          [
            /\bopr\/([\w\.]+)/i
          ],
          [VERSION, [NAME, OPERA]],
          [
            /(kindle)\/([\w\.]+)/i,
            /(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i,
            /(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i,
            /(ba?idubrowser)[\/ ]?([\w\.]+)/i,
            /(?:ms|\()(ie) ([\w\.]+)/i,
            /(flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale|qqbrowserlite|qq)\/([-\w\.]+)/i,
            /(weibo)__([\d\.]+)/i
          ],
          [NAME, VERSION],
          [
            /(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i
          ],
          [VERSION, [NAME, "UC" + BROWSER]],
          [
            /\bqbcore\/([\w\.]+)/i
          ],
          [VERSION, [NAME, "WeChat(Win) Desktop"]],
          [
            /micromessenger\/([\w\.]+)/i
          ],
          [VERSION, [NAME, "WeChat"]],
          [
            /konqueror\/([\w\.]+)/i
          ],
          [VERSION, [NAME, "Konqueror"]],
          [
            /trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i
          ],
          [VERSION, [NAME, "IE"]],
          [
            /yabrowser\/([\w\.]+)/i
          ],
          [VERSION, [NAME, "Yandex"]],
          [
            /(avast|avg)\/([\w\.]+)/i
          ],
          [[NAME, /(.+)/, "$1 Secure " + BROWSER], VERSION],
          [
            /\bfocus\/([\w\.]+)/i
          ],
          [VERSION, [NAME, FIREFOX + " Focus"]],
          [
            /\bopt\/([\w\.]+)/i
          ],
          [VERSION, [NAME, OPERA + " Touch"]],
          [
            /coc_coc\w+\/([\w\.]+)/i
          ],
          [VERSION, [NAME, "Coc Coc"]],
          [
            /dolfin\/([\w\.]+)/i
          ],
          [VERSION, [NAME, "Dolphin"]],
          [
            /coast\/([\w\.]+)/i
          ],
          [VERSION, [NAME, OPERA + " Coast"]],
          [
            /miuibrowser\/([\w\.]+)/i
          ],
          [VERSION, [NAME, "MIUI " + BROWSER]],
          [
            /fxios\/([-\w\.]+)/i
          ],
          [VERSION, [NAME, FIREFOX]],
          [
            /\bqihu|(qi?ho?o?|360)browser/i
          ],
          [[NAME, "360 " + BROWSER]],
          [
            /(oculus|samsung|sailfish)browser\/([\w\.]+)/i
          ],
          [[NAME, /(.+)/, "$1 " + BROWSER], VERSION],
          [
            /(comodo_dragon)\/([\w\.]+)/i
          ],
          [[NAME, /_/g, " "], VERSION],
          [
            /(electron)\/([\w\.]+) safari/i,
            /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i,
            /m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i
          ],
          [NAME, VERSION],
          [
            /(metasr)[\/ ]?([\w\.]+)/i,
            /(lbbrowser)/i
          ],
          [NAME],
          [
            /((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i
          ],
          [[NAME, FACEBOOK], VERSION],
          [
            /safari (line)\/([\w\.]+)/i,
            /\b(line)\/([\w\.]+)\/iab/i,
            /(chromium|instagram)[\/ ]([-\w\.]+)/i
          ],
          [NAME, VERSION],
          [
            /\bgsa\/([\w\.]+) .*safari\//i
          ],
          [VERSION, [NAME, "GSA"]],
          [
            /headlesschrome(?:\/([\w\.]+)| )/i
          ],
          [VERSION, [NAME, CHROME + " Headless"]],
          [
            / wv\).+(chrome)\/([\w\.]+)/i
          ],
          [[NAME, CHROME + " WebView"], VERSION],
          [
            /droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i
          ],
          [VERSION, [NAME, "Android " + BROWSER]],
          [
            /(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i
          ],
          [NAME, VERSION],
          [
            /version\/([\w\.]+) .*mobile\/\w+ (safari)/i
          ],
          [VERSION, [NAME, "Mobile Safari"]],
          [
            /version\/([\w\.]+) .*(mobile ?safari|safari)/i
          ],
          [VERSION, NAME],
          [
            /webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i
          ],
          [NAME, [VERSION, strMapper, oldSafariMap]],
          [
            /(webkit|khtml)\/([\w\.]+)/i
          ],
          [NAME, VERSION],
          [
            /(navigator|netscape\d?)\/([-\w\.]+)/i
          ],
          [[NAME, "Netscape"], VERSION],
          [
            /mobile vr; rv:([\w\.]+)\).+firefox/i
          ],
          [VERSION, [NAME, FIREFOX + " Reality"]],
          [
            /ekiohf.+(flow)\/([\w\.]+)/i,
            /(swiftfox)/i,
            /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i,
            /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i,
            /(firefox)\/([\w\.]+)/i,
            /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i,
            /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i,
            /(links) \(([\w\.]+)/i
          ],
          [NAME, VERSION]
        ],
        cpu: [
          [
            /(?:(amd|x(?:(?:86|64)[-_])?|wow|win)64)[;\)]/i
          ],
          [[ARCHITECTURE, "amd64"]],
          [
            /(ia32(?=;))/i
          ],
          [[ARCHITECTURE, lowerize]],
          [
            /((?:i[346]|x)86)[;\)]/i
          ],
          [[ARCHITECTURE, "ia32"]],
          [
            /\b(aarch64|arm(v?8e?l?|_?64))\b/i
          ],
          [[ARCHITECTURE, "arm64"]],
          [
            /\b(arm(?:v[67])?ht?n?[fl]p?)\b/i
          ],
          [[ARCHITECTURE, "armhf"]],
          [
            /windows (ce|mobile); ppc;/i
          ],
          [[ARCHITECTURE, "arm"]],
          [
            /((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i
          ],
          [[ARCHITECTURE, /ower/, EMPTY, lowerize]],
          [
            /(sun4\w)[;\)]/i
          ],
          [[ARCHITECTURE, "sparc"]],
          [
            /((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i
          ],
          [[ARCHITECTURE, lowerize]]
        ],
        device: [
          [
            /\b(sch-i[89]0\d|shw-m380s|sm-[pt]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i
          ],
          [MODEL, [VENDOR, SAMSUNG], [TYPE, TABLET]],
          [
            /\b((?:s[cgp]h|gt|sm)-\w+|galaxy nexus)/i,
            /samsung[- ]([-\w]+)/i,
            /sec-(sgh\w+)/i
          ],
          [MODEL, [VENDOR, SAMSUNG], [TYPE, MOBILE]],
          [
            /\((ip(?:hone|od)[\w ]*);/i
          ],
          [MODEL, [VENDOR, APPLE], [TYPE, MOBILE]],
          [
            /\((ipad);[-\w\),; ]+apple/i,
            /applecoremedia\/[\w\.]+ \((ipad)/i,
            /\b(ipad)\d\d?,\d\d?[;\]].+ios/i
          ],
          [MODEL, [VENDOR, APPLE], [TYPE, TABLET]],
          [
            /\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i
          ],
          [MODEL, [VENDOR, HUAWEI], [TYPE, TABLET]],
          [
            /(?:huawei|honor)([-\w ]+)[;\)]/i,
            /\b(nexus 6p|\w{2,4}-[atu]?[ln][01259x][012359][an]?)\b(?!.+d\/s)/i
          ],
          [MODEL, [VENDOR, HUAWEI], [TYPE, MOBILE]],
          [
            /\b(poco[\w ]+)(?: bui|\))/i,
            /\b; (\w+) build\/hm\1/i,
            /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i,
            /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i,
            /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i
          ],
          [[MODEL, /_/g, " "], [VENDOR, XIAOMI], [TYPE, MOBILE]],
          [
            /\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i
          ],
          [[MODEL, /_/g, " "], [VENDOR, XIAOMI], [TYPE, TABLET]],
          [
            /; (\w+) bui.+ oppo/i,
            /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i
          ],
          [MODEL, [VENDOR, "OPPO"], [TYPE, MOBILE]],
          [
            /vivo (\w+)(?: bui|\))/i,
            /\b(v[12]\d{3}\w?[at])(?: bui|;)/i
          ],
          [MODEL, [VENDOR, "Vivo"], [TYPE, MOBILE]],
          [
            /\b(rmx[12]\d{3})(?: bui|;|\))/i
          ],
          [MODEL, [VENDOR, "Realme"], [TYPE, MOBILE]],
          [
            /\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i,
            /\bmot(?:orola)?[- ](\w*)/i,
            /((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i
          ],
          [MODEL, [VENDOR, MOTOROLA], [TYPE, MOBILE]],
          [
            /\b(mz60\d|xoom[2 ]{0,2}) build\//i
          ],
          [MODEL, [VENDOR, MOTOROLA], [TYPE, TABLET]],
          [
            /((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i
          ],
          [MODEL, [VENDOR, LG], [TYPE, TABLET]],
          [
            /(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i,
            /\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i,
            /\blg-?([\d\w]+) bui/i
          ],
          [MODEL, [VENDOR, LG], [TYPE, MOBILE]],
          [
            /(ideatab[-\w ]+)/i,
            /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i
          ],
          [MODEL, [VENDOR, "Lenovo"], [TYPE, TABLET]],
          [
            /(?:maemo|nokia).*(n900|lumia \d+)/i,
            /nokia[-_ ]?([-\w\.]*)/i
          ],
          [[MODEL, /_/g, " "], [VENDOR, "Nokia"], [TYPE, MOBILE]],
          [
            /(pixel c)\b/i
          ],
          [MODEL, [VENDOR, GOOGLE], [TYPE, TABLET]],
          [
            /droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i
          ],
          [MODEL, [VENDOR, GOOGLE], [TYPE, MOBILE]],
          [
            /droid.+ ([c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i
          ],
          [MODEL, [VENDOR, SONY], [TYPE, MOBILE]],
          [
            /sony tablet [ps]/i,
            /\b(?:sony)?sgp\w+(?: bui|\))/i
          ],
          [[MODEL, "Xperia Tablet"], [VENDOR, SONY], [TYPE, TABLET]],
          [
            / (kb2005|in20[12]5|be20[12][59])\b/i,
            /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i
          ],
          [MODEL, [VENDOR, "OnePlus"], [TYPE, MOBILE]],
          [
            /(alexa)webm/i,
            /(kf[a-z]{2}wi)( bui|\))/i,
            /(kf[a-z]+)( bui|\)).+silk\//i
          ],
          [MODEL, [VENDOR, AMAZON], [TYPE, TABLET]],
          [
            /((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i
          ],
          [[MODEL, /(.+)/g, "Fire Phone $1"], [VENDOR, AMAZON], [TYPE, MOBILE]],
          [
            /(playbook);[-\w\),; ]+(rim)/i
          ],
          [MODEL, VENDOR, [TYPE, TABLET]],
          [
            /\b((?:bb[a-f]|st[hv])100-\d)/i,
            /\(bb10; (\w+)/i
          ],
          [MODEL, [VENDOR, BLACKBERRY], [TYPE, MOBILE]],
          [
            /(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i
          ],
          [MODEL, [VENDOR, ASUS], [TYPE, TABLET]],
          [
            / (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i
          ],
          [MODEL, [VENDOR, ASUS], [TYPE, MOBILE]],
          [
            /(nexus 9)/i
          ],
          [MODEL, [VENDOR, "HTC"], [TYPE, TABLET]],
          [
            /(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i,
            /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i,
            /(alcatel|geeksphone|nexian|panasonic|sony)[-_ ]?([-\w]*)/i
          ],
          [VENDOR, [MODEL, /_/g, " "], [TYPE, MOBILE]],
          [
            /droid.+; ([ab][1-7]-?[0178a]\d\d?)/i
          ],
          [MODEL, [VENDOR, "Acer"], [TYPE, TABLET]],
          [
            /droid.+; (m[1-5] note) bui/i,
            /\bmz-([-\w]{2,})/i
          ],
          [MODEL, [VENDOR, "Meizu"], [TYPE, MOBILE]],
          [
            /\b(sh-?[altvz]?\d\d[a-ekm]?)/i
          ],
          [MODEL, [VENDOR, "Sharp"], [TYPE, MOBILE]],
          [
            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[-_ ]?([-\w]*)/i,
            /(hp) ([\w ]+\w)/i,
            /(asus)-?(\w+)/i,
            /(microsoft); (lumia[\w ]+)/i,
            /(lenovo)[-_ ]?([-\w]+)/i,
            /(jolla)/i,
            /(oppo) ?([\w ]+) bui/i
          ],
          [VENDOR, MODEL, [TYPE, MOBILE]],
          [
            /(archos) (gamepad2?)/i,
            /(hp).+(touchpad(?!.+tablet)|tablet)/i,
            /(kindle)\/([\w\.]+)/i,
            /(nook)[\w ]+build\/(\w+)/i,
            /(dell) (strea[kpr\d ]*[\dko])/i,
            /(le[- ]+pan)[- ]+(\w{1,9}) bui/i,
            /(trinity)[- ]*(t\d{3}) bui/i,
            /(gigaset)[- ]+(q\w{1,9}) bui/i,
            /(vodafone) ([\w ]+)(?:\)| bui)/i
          ],
          [VENDOR, MODEL, [TYPE, TABLET]],
          [
            /(surface duo)/i
          ],
          [MODEL, [VENDOR, MICROSOFT], [TYPE, TABLET]],
          [
            /droid [\d\.]+; (fp\du?)(?: b|\))/i
          ],
          [MODEL, [VENDOR, "Fairphone"], [TYPE, MOBILE]],
          [
            /(u304aa)/i
          ],
          [MODEL, [VENDOR, "AT&T"], [TYPE, MOBILE]],
          [
            /\bsie-(\w*)/i
          ],
          [MODEL, [VENDOR, "Siemens"], [TYPE, MOBILE]],
          [
            /\b(rct\w+) b/i
          ],
          [MODEL, [VENDOR, "RCA"], [TYPE, TABLET]],
          [
            /\b(venue[\d ]{2,7}) b/i
          ],
          [MODEL, [VENDOR, "Dell"], [TYPE, TABLET]],
          [
            /\b(q(?:mv|ta)\w+) b/i
          ],
          [MODEL, [VENDOR, "Verizon"], [TYPE, TABLET]],
          [
            /\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i
          ],
          [MODEL, [VENDOR, "Barnes & Noble"], [TYPE, TABLET]],
          [
            /\b(tm\d{3}\w+) b/i
          ],
          [MODEL, [VENDOR, "NuVision"], [TYPE, TABLET]],
          [
            /\b(k88) b/i
          ],
          [MODEL, [VENDOR, "ZTE"], [TYPE, TABLET]],
          [
            /\b(nx\d{3}j) b/i
          ],
          [MODEL, [VENDOR, "ZTE"], [TYPE, MOBILE]],
          [
            /\b(gen\d{3}) b.+49h/i
          ],
          [MODEL, [VENDOR, "Swiss"], [TYPE, MOBILE]],
          [
            /\b(zur\d{3}) b/i
          ],
          [MODEL, [VENDOR, "Swiss"], [TYPE, TABLET]],
          [
            /\b((zeki)?tb.*\b) b/i
          ],
          [MODEL, [VENDOR, "Zeki"], [TYPE, TABLET]],
          [
            /\b([yr]\d{2}) b/i,
            /\b(dragon[- ]+touch |dt)(\w{5}) b/i
          ],
          [[VENDOR, "Dragon Touch"], MODEL, [TYPE, TABLET]],
          [
            /\b(ns-?\w{0,9}) b/i
          ],
          [MODEL, [VENDOR, "Insignia"], [TYPE, TABLET]],
          [
            /\b((nxa|next)-?\w{0,9}) b/i
          ],
          [MODEL, [VENDOR, "NextBook"], [TYPE, TABLET]],
          [
            /\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i
          ],
          [[VENDOR, "Voice"], MODEL, [TYPE, MOBILE]],
          [
            /\b(lvtel\-)?(v1[12]) b/i
          ],
          [[VENDOR, "LvTel"], MODEL, [TYPE, MOBILE]],
          [
            /\b(ph-1) /i
          ],
          [MODEL, [VENDOR, "Essential"], [TYPE, MOBILE]],
          [
            /\b(v(100md|700na|7011|917g).*\b) b/i
          ],
          [MODEL, [VENDOR, "Envizen"], [TYPE, TABLET]],
          [
            /\b(trio[-\w\. ]+) b/i
          ],
          [MODEL, [VENDOR, "MachSpeed"], [TYPE, TABLET]],
          [
            /\btu_(1491) b/i
          ],
          [MODEL, [VENDOR, "Rotor"], [TYPE, TABLET]],
          [
            /(shield[\w ]+) b/i
          ],
          [MODEL, [VENDOR, "Nvidia"], [TYPE, TABLET]],
          [
            /(sprint) (\w+)/i
          ],
          [VENDOR, MODEL, [TYPE, MOBILE]],
          [
            /(kin\.[onetw]{3})/i
          ],
          [[MODEL, /\./g, " "], [VENDOR, MICROSOFT], [TYPE, MOBILE]],
          [
            /droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i
          ],
          [MODEL, [VENDOR, ZEBRA], [TYPE, TABLET]],
          [
            /droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i
          ],
          [MODEL, [VENDOR, ZEBRA], [TYPE, MOBILE]],
          [
            /(ouya)/i,
            /(nintendo) ([wids3utch]+)/i
          ],
          [VENDOR, MODEL, [TYPE, CONSOLE]],
          [
            /droid.+; (shield) bui/i
          ],
          [MODEL, [VENDOR, "Nvidia"], [TYPE, CONSOLE]],
          [
            /(playstation [345portablevi]+)/i
          ],
          [MODEL, [VENDOR, SONY], [TYPE, CONSOLE]],
          [
            /\b(xbox(?: one)?(?!; xbox))[\); ]/i
          ],
          [MODEL, [VENDOR, MICROSOFT], [TYPE, CONSOLE]],
          [
            /smart-tv.+(samsung)/i
          ],
          [VENDOR, [TYPE, SMARTTV]],
          [
            /hbbtv.+maple;(\d+)/i
          ],
          [[MODEL, /^/, "SmartTV"], [VENDOR, SAMSUNG], [TYPE, SMARTTV]],
          [
            /(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i
          ],
          [[VENDOR, LG], [TYPE, SMARTTV]],
          [
            /(apple) ?tv/i
          ],
          [VENDOR, [MODEL, APPLE + " TV"], [TYPE, SMARTTV]],
          [
            /crkey/i
          ],
          [[MODEL, CHROME + "cast"], [VENDOR, GOOGLE], [TYPE, SMARTTV]],
          [
            /droid.+aft(\w)( bui|\))/i
          ],
          [MODEL, [VENDOR, AMAZON], [TYPE, SMARTTV]],
          [
            /\(dtv[\);].+(aquos)/i
          ],
          [MODEL, [VENDOR, "Sharp"], [TYPE, SMARTTV]],
          [
            /\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i,
            /hbbtv\/\d+\.\d+\.\d+ +\([\w ]*; *(\w[^;]*);([^;]*)/i
          ],
          [[VENDOR, trim], [MODEL, trim], [TYPE, SMARTTV]],
          [
            /\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i
          ],
          [[TYPE, SMARTTV]],
          [
            /((pebble))app/i
          ],
          [VENDOR, MODEL, [TYPE, WEARABLE]],
          [
            /droid.+; (glass) \d/i
          ],
          [MODEL, [VENDOR, GOOGLE], [TYPE, WEARABLE]],
          [
            /droid.+; (wt63?0{2,3})\)/i
          ],
          [MODEL, [VENDOR, ZEBRA], [TYPE, WEARABLE]],
          [
            /(quest( 2)?)/i
          ],
          [MODEL, [VENDOR, FACEBOOK], [TYPE, WEARABLE]],
          [
            /(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i
          ],
          [VENDOR, [TYPE, EMBEDDED]],
          [
            /droid .+?; ([^;]+?)(?: bui|\) applew).+? mobile safari/i
          ],
          [MODEL, [TYPE, MOBILE]],
          [
            /droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i
          ],
          [MODEL, [TYPE, TABLET]],
          [
            /\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i
          ],
          [[TYPE, TABLET]],
          [
            /(phone|mobile(?:[;\/]| safari)|pda(?=.+windows ce))/i
          ],
          [[TYPE, MOBILE]],
          [
            /(android[-\w\. ]{0,9});.+buil/i
          ],
          [MODEL, [VENDOR, "Generic"]]
        ],
        engine: [
          [
            /windows.+ edge\/([\w\.]+)/i
          ],
          [VERSION, [NAME, EDGE + "HTML"]],
          [
            /webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i
          ],
          [VERSION, [NAME, "Blink"]],
          [
            /(presto)\/([\w\.]+)/i,
            /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i,
            /ekioh(flow)\/([\w\.]+)/i,
            /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i,
            /(icab)[\/ ]([23]\.[\d\.]+)/i
          ],
          [NAME, VERSION],
          [
            /rv\:([\w\.]{1,9})\b.+(gecko)/i
          ],
          [VERSION, NAME]
        ],
        os: [
          [
            /microsoft (windows) (vista|xp)/i
          ],
          [NAME, VERSION],
          [
            /(windows) nt 6\.2; (arm)/i,
            /(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i,
            /(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i
          ],
          [NAME, [VERSION, strMapper, windowsVersionMap]],
          [
            /(win(?=3|9|n)|win 9x )([nt\d\.]+)/i
          ],
          [[NAME, "Windows"], [VERSION, strMapper, windowsVersionMap]],
          [
            /ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i,
            /cfnetwork\/.+darwin/i
          ],
          [[VERSION, /_/g, "."], [NAME, "iOS"]],
          [
            /(mac os x) ?([\w\. ]*)/i,
            /(macintosh|mac_powerpc\b)(?!.+haiku)/i
          ],
          [[NAME, "Mac OS"], [VERSION, /_/g, "."]],
          [
            /droid ([\w\.]+)\b.+(android[- ]x86)/i
          ],
          [VERSION, NAME],
          [
            /(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i,
            /(blackberry)\w*\/([\w\.]*)/i,
            /(tizen|kaios)[\/ ]([\w\.]+)/i,
            /\((series40);/i
          ],
          [NAME, VERSION],
          [
            /\(bb(10);/i
          ],
          [VERSION, [NAME, BLACKBERRY]],
          [
            /(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i
          ],
          [VERSION, [NAME, "Symbian"]],
          [
            /mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i
          ],
          [VERSION, [NAME, FIREFOX + " OS"]],
          [
            /web0s;.+rt(tv)/i,
            /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i
          ],
          [VERSION, [NAME, "webOS"]],
          [
            /crkey\/([\d\.]+)/i
          ],
          [VERSION, [NAME, CHROME + "cast"]],
          [
            /(cros) [\w]+ ([\w\.]+\w)/i
          ],
          [[NAME, "Chromium OS"], VERSION],
          [
            /(nintendo|playstation) ([wids345portablevuch]+)/i,
            /(xbox); +xbox ([^\);]+)/i,
            /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i,
            /(mint)[\/\(\) ]?(\w*)/i,
            /(mageia|vectorlinux)[; ]/i,
            /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i,
            /(hurd|linux) ?([\w\.]*)/i,
            /(gnu) ?([\w\.]*)/i,
            /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i,
            /(haiku) (\w+)/i
          ],
          [NAME, VERSION],
          [
            /(sunos) ?([\w\.\d]*)/i
          ],
          [[NAME, "Solaris"], VERSION],
          [
            /((?:open)?solaris)[-\/ ]?([\w\.]*)/i,
            /(aix) ((\d)(?=\.|\)| )[\w\.])*/i,
            /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux)/i,
            /(unix) ?([\w\.]*)/i
          ],
          [NAME, VERSION]
        ]
      };
      var UAParser = function(ua, extensions) {
        if (typeof ua === OBJ_TYPE) {
          extensions = ua;
          ua = undefined$1;
        }
        if (!(this instanceof UAParser)) {
          return new UAParser(ua, extensions).getResult();
        }
        var _ua = ua || (typeof window2 !== UNDEF_TYPE && window2.navigator && window2.navigator.userAgent ? window2.navigator.userAgent : EMPTY);
        var _rgxmap = extensions ? extend(regexes, extensions) : regexes;
        this.getBrowser = function() {
          var _browser = {};
          _browser[NAME] = undefined$1;
          _browser[VERSION] = undefined$1;
          rgxMapper.call(_browser, _ua, _rgxmap.browser);
          _browser.major = majorize(_browser.version);
          return _browser;
        };
        this.getCPU = function() {
          var _cpu = {};
          _cpu[ARCHITECTURE] = undefined$1;
          rgxMapper.call(_cpu, _ua, _rgxmap.cpu);
          return _cpu;
        };
        this.getDevice = function() {
          var _device = {};
          _device[VENDOR] = undefined$1;
          _device[MODEL] = undefined$1;
          _device[TYPE] = undefined$1;
          rgxMapper.call(_device, _ua, _rgxmap.device);
          return _device;
        };
        this.getEngine = function() {
          var _engine = {};
          _engine[NAME] = undefined$1;
          _engine[VERSION] = undefined$1;
          rgxMapper.call(_engine, _ua, _rgxmap.engine);
          return _engine;
        };
        this.getOS = function() {
          var _os = {};
          _os[NAME] = undefined$1;
          _os[VERSION] = undefined$1;
          rgxMapper.call(_os, _ua, _rgxmap.os);
          return _os;
        };
        this.getResult = function() {
          return {
            ua: this.getUA(),
            browser: this.getBrowser(),
            engine: this.getEngine(),
            os: this.getOS(),
            device: this.getDevice(),
            cpu: this.getCPU()
          };
        };
        this.getUA = function() {
          return _ua;
        };
        this.setUA = function(ua2) {
          _ua = typeof ua2 === STR_TYPE && ua2.length > UA_MAX_LENGTH ? trim(ua2, UA_MAX_LENGTH) : ua2;
          return this;
        };
        this.setUA(_ua);
        return this;
      };
      UAParser.VERSION = LIBVERSION;
      UAParser.BROWSER = enumerize([NAME, VERSION, MAJOR]);
      UAParser.CPU = enumerize([ARCHITECTURE]);
      UAParser.DEVICE = enumerize([MODEL, VENDOR, TYPE, CONSOLE, MOBILE, SMARTTV, TABLET, WEARABLE, EMBEDDED]);
      UAParser.ENGINE = UAParser.OS = enumerize([NAME, VERSION]);
      {
        if (module.exports) {
          exports = module.exports = UAParser;
        }
        exports.UAParser = UAParser;
      }
      var $ = typeof window2 !== UNDEF_TYPE && (window2.jQuery || window2.Zepto);
      if ($ && !$.ua) {
        var parser = new UAParser();
        $.ua = parser.getResult();
        $.ua.get = function() {
          return parser.getUA();
        };
        $.ua.set = function(ua) {
          parser.setUA(ua);
          var result = parser.getResult();
          for (var prop in result) {
            $.ua[prop] = result[prop];
          }
        };
      }
    })(typeof window === "object" ? window : commonjsGlobal);
  })(uaParser$1, uaParser$1.exports);
  const uaParser = uaParser$1.exports;
  function getEnv() {
    var _a;
    const { os, device } = uaParser(navigator.userAgent);
    return {
      os: `${os.name} ${os.version}`,
      app: window.location.host,
      sdk: "Web SDK v{TODO}",
      dev_model: (_a = device.model) != null ? _a : "",
      dev_id: ""
    };
  }
  const dnsResolveLogSchema = {
    name: "DnsResolveLog",
    fields: [
      { name: "r_id", type: "string" },
      { name: "loc", type: "string" },
      { name: "ip", type: "string" },
      { name: "domain", type: "string" },
      { name: "status_code", type: "int" },
      { name: "err_msg", type: "string" },
      { name: "err_desc", type: "string" },
      { name: "t_conn", type: "float" },
      { name: "t_total", type: "float" }
    ]
  };
  const downloadLogSchema = {
    name: "DownloadLog",
    fields: [
      { name: "r_id", type: "string" },
      { name: "loc", type: "string" },
      { name: "ip", type: "string" },
      { name: "domain", type: "string" },
      { name: "status_code", type: "int" },
      { name: "err_msg", type: "string" },
      { name: "err_desc", type: "string" },
      { name: "range_st", type: "int" },
      { name: "range_end", type: "int" },
      { name: "retry", type: "int" },
      { name: "ftask_id", type: "string" },
      { name: "lookup_type", type: "bool" },
      { name: "t_lookup", type: "float" },
      { name: "t_conn", type: "float" },
      { name: "t_tls", type: "float" },
      { name: "t_st_trans", type: "float" },
      { name: "t_content_trans", type: "float" },
      { name: "t_total", type: "float" },
      { name: "resp_size", type: "int" }
    ]
  };
  const schemas = [dnsResolveLogSchema, downloadLogSchema];
  const apiPrefix$1 = "https://log.qiniuapi.com";
  class Logger {
    constructor(fetch2 = self.fetch, flushNum = 100, flushWait = 30) {
      __publicField(this, "inited", this.callApiSchema(schemas));
      __publicField(this, "flushMutex", new Mutex());
      __publicField(this, "buffer", []);
      this.fetch = fetch2;
      this.flushNum = flushNum;
      this.flushWait = flushWait;
    }
    callApiSchema(_schemas) {
      const f = this.fetch;
      return f(new Request(`${apiPrefix$1}/v1/schema`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8"
        },
        body: JSON.stringify({ schemas: _schemas })
      }));
    }
    callApiLog(schemaName, logs) {
      const f = this.fetch;
      return f(new Request(`${apiPrefix$1}/v1/log/${schemaName}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/csv",
          "X-Env": queryStringify(getEnv())
        },
        body: toCSV(logs)
      }));
    }
    flush() {
      return __async(this, null, function* () {
        return this.flushMutex.runExclusive(() => __async(this, null, function* () {
          const allLogs = this.buffer.splice(0);
          const schemaLogsMap = new Map(schemas.map((s) => [s.name, []]));
          for (const log of allLogs) {
            schemaLogsMap.get(log.schema).push(log.data);
          }
          yield Promise.all(schemas.map((s) => {
            const logs = schemaLogsMap.get(s.name);
            if (logs == null || logs.length === 0)
              return;
            return this.callApiLog(s.name, logs);
          }));
        }));
      });
    }
    tryFlush() {
      return __async(this, null, function* () {
        yield this.inited;
        const flushOrRetry = yield this.flushMutex.runExclusive(() => {
          const buffer = this.buffer;
          if (buffer.length === 0)
            return false;
          if (buffer.length >= this.flushNum) {
            console.debug("buffer.length >= this.flushNum");
            return true;
          }
          const waited = unixTime() - buffer[0].data.timestamp;
          if (waited >= this.flushWait) {
            console.debug("waited >= this.flushWait");
            return true;
          }
          console.debug("this.flushWait - waited:", this.flushWait - waited);
          return this.flushWait - waited;
        });
        if (flushOrRetry === true)
          return this.flush();
        if (typeof flushOrRetry === "number") {
          setTimeout(() => this.tryFlush(), flushOrRetry * 1e3);
        }
      });
    }
    log(schemaName, logData) {
      this.buffer.push({
        schema: schemaName,
        data: __spreadValues({ timestamp: unixTime() }, logData)
      });
      this.tryFlush();
    }
  }
  function toCSV(logs) {
    const fields = Object.keys(logs[0]);
    const headLine = fields.map(encodeURIComponent).join(",");
    const bodyLines = logs.map(
      (log) => fields.map(
        (k) => log[k]
      ).map(
        (v) => v != null ? v + "" : ""
      ).map(encodeURIComponent).join(",")
    );
    return [headLine, ...bodyLines].join("\n");
  }
  function encodeUtf8(input) {
    const result = [];
    const size = input.length;
    for (let index = 0; index < size; index++) {
      let point = input.charCodeAt(index);
      if (point >= 55296 && point <= 56319 && size > index + 1) {
        const second = input.charCodeAt(index + 1);
        if (second >= 56320 && second <= 57343) {
          point = (point - 55296) * 1024 + second - 56320 + 65536;
          index += 1;
        }
      }
      if (point < 128) {
        result.push(point);
        continue;
      }
      if (point < 2048) {
        result.push(point >> 6 | 192);
        result.push(point & 63 | 128);
        continue;
      }
      if (point < 55296 || point >= 57344 && point < 65536) {
        result.push(point >> 12 | 224);
        result.push(point >> 6 & 63 | 128);
        result.push(point & 63 | 128);
        continue;
      }
      if (point >= 65536 && point <= 1114111) {
        result.push(point >> 18 | 240);
        result.push(point >> 12 & 63 | 128);
        result.push(point >> 6 & 63 | 128);
        result.push(point & 63 | 128);
        continue;
      }
      result.push(239, 191, 189);
    }
    return new Uint8Array(result).buffer;
  }
  function fmix(input) {
    input ^= input >>> 16;
    input = Math.imul(input, 2246822507);
    input ^= input >>> 13;
    input = Math.imul(input, 3266489909);
    input ^= input >>> 16;
    return input >>> 0;
  }
  const C = new Uint32Array([
    3432918353,
    461845907
  ]);
  function rotl(m, n) {
    return m << n | m >>> 32 - n;
  }
  function body(key, hash) {
    const blocks = key.byteLength / 4 | 0;
    const view32 = new Uint32Array(key, 0, blocks);
    for (let i = 0; i < blocks; i++) {
      view32[i] = Math.imul(view32[i], C[0]);
      view32[i] = rotl(view32[i], 15);
      view32[i] = Math.imul(view32[i], C[1]);
      hash[0] = hash[0] ^ view32[i];
      hash[0] = rotl(hash[0], 13);
      hash[0] = Math.imul(hash[0], 5) + 3864292196;
    }
  }
  function tail(key, hash) {
    const blocks = key.byteLength / 4 | 0;
    const reminder = key.byteLength % 4;
    let k = 0;
    const tail2 = new Uint8Array(key, blocks * 4, reminder);
    switch (reminder) {
      case 3:
        k = k ^ tail2[2] << 16;
      case 2:
        k = k ^ tail2[1] << 8;
      case 1:
        k = k ^ tail2[0] << 0;
        k = Math.imul(k, C[0]);
        k = rotl(k, 15);
        k = Math.imul(k, C[1]);
        hash[0] = hash[0] ^ k;
    }
  }
  function finalize(key, hash) {
    hash[0] = hash[0] ^ key.byteLength;
    hash[0] = fmix(hash[0]);
  }
  function murmur(key, seed) {
    seed = seed ? seed | 0 : 0;
    if (typeof key === "string") {
      key = encodeUtf8(key);
    }
    if (!(key instanceof ArrayBuffer)) {
      throw new TypeError("Expected key to be ArrayBuffer or string");
    }
    const hash = new Uint32Array([seed]);
    body(key, hash);
    tail(key, hash);
    finalize(key, hash);
    return hash.buffer;
  }
  class ConsistentHash {
    constructor(hasher = defaultHash$1) {
      __publicField(this, "circle", /* @__PURE__ */ new Map());
      __publicField(this, "members", /* @__PURE__ */ new Set());
      __publicField(this, "membersReplicas", /* @__PURE__ */ new Map());
      __publicField(this, "sortedHashes", []);
      this.hasher = hasher;
    }
    updateSortedHashes() {
      this.sortedHashes = [...this.circle.keys()].sort(
        (v1, v2) => v1 - v2
      );
    }
    _add({ key, replicas }) {
      for (let i = 0; i < replicas; i++) {
        const hash = this.hasher(getKey(key, i));
        this.circle.set(hash, key);
      }
      this.members.add(key);
      this.membersReplicas.set(key, replicas);
    }
    _remove({ key, replicas }) {
      for (let i = 0; i < replicas; i++) {
        const hash = this.hasher(getKey(key, i));
        this.circle.delete(hash);
      }
      this.members.delete(key);
      this.membersReplicas.delete(key);
    }
    get(key) {
      var _a;
      if (this.circle.size === 0)
        return null;
      const hash = this.hasher(key);
      const resultHash = (_a = this.sortedHashes.find((h) => h > hash)) != null ? _a : this.sortedHashes[0];
      return this.circle.get(resultHash);
    }
    add(key, replicas) {
      if (this.members.has(key))
        return false;
      this._add({ key, replicas });
      this.updateSortedHashes();
      return true;
    }
    remove(key) {
      if (!this.members.has(key))
        return false;
      const replicas = this.membersReplicas.get(key);
      this._remove({ key, replicas });
      this.updateSortedHashes();
      return true;
    }
    set(members) {
      this.circle.clear();
      this.members.clear();
      this.membersReplicas.clear();
      members.forEach((member) => {
        this._add(member);
      });
      this.updateSortedHashes();
    }
  }
  function getKey(memberKey, index) {
    return index + memberKey;
  }
  const defaultHash$1 = murmur3Hash32;
  function murmur3Hash32(key) {
    const ab = murmur(key);
    return new Uint32Array(ab)[0];
  }
  const apiPrefix = "https://httpdns.qcdn-sdk.qa.qiniu.io";
  function httpResolve(ctx, domain) {
    return __async(this, null, function* () {
      var _a;
      const params = { name: domain, type: "A" };
      const startAt = Date.now();
      const resp = yield fetch(`${apiPrefix}/v1/next/resolve?${queryStringify(params)}`);
      ctx.set("dnsResolveStatus", resp.status);
      ctx.set("dnsResolveReqID", (_a = resp.headers.get("x-reqid")) != null ? _a : "");
      ctx.set("dnsResolveConnectionTime", (Date.now() - startAt) / 1e3);
      if (!resp.ok)
        throw new Error(`Call resolve API failed, status: ${resp.status} ${resp.statusText}`);
      const body2 = yield resp.json();
      if (body2.code !== 0)
        throw new Error(`Call resolve API failed, code: ${body2.code}`);
      return body2.data;
    });
  }
  const defaultDuration = 1e3;
  class Resolver {
    constructor(logger2 = new Logger(), dnsResolver = httpResolve, initialDuration = defaultDuration) {
      __publicField(this, "cache", /* @__PURE__ */ new Map());
      __publicField(this, "fingerprints", /* @__PURE__ */ new Map());
      this.logger = logger2;
      this.dnsResolver = dnsResolver;
      this.initialDuration = initialDuration;
    }
    getFingerprint(ipPort) {
      const fingerprint = this.fingerprints.get(ipPort);
      if (fingerprint == null)
        throw new Error(`No fingerprint for ${ipPort}`);
      return fingerprint;
    }
    getResolveResult(ctx, domain) {
      return __async(this, null, function* () {
        var _a, _b, _c;
        const fromCache = this.cache.get(domain);
        if (fromCache != null && fromCache.expireAt > Date.now()) {
          ctx.set("dnsResolveFromCache", true);
          return fromCache;
        }
        const startAt = Date.now();
        let err;
        try {
          const resolved = yield this.dnsResolver(ctx, domain);
          const toSave = __spreadProps(__spreadValues({}, resolved), {
            groups: resolved.groups.map((g) => __spreadProps(__spreadValues({}, g), {
              duration: this.initialDuration,
              after: 0
            })),
            expireAt: Date.now() + resolved.ttl * 1e3
          });
          toSave.groups.forEach((g) => {
            g.elts.forEach((e) => {
              e.ips.forEach((ipPort) => {
                this.fingerprints.set(ipPort, e.fingerprint);
              });
            });
          });
          this.cache.set(domain, toSave);
          return toSave;
        } catch (e) {
          err = e;
          throw e;
        } finally {
          const totalTime = (Date.now() - startAt) / 1e3;
          this.logger.log("DnsResolveLog", {
            r_id: (_a = ctx.get("dnsResolveReqID")) != null ? _a : "",
            loc: "",
            ip: "",
            domain,
            status_code: (_b = ctx.get("dnsResolveStatus")) != null ? _b : -1,
            err_msg: err instanceof Error ? err.name : "Unknown",
            err_desc: err instanceof Error ? err.message : err + "",
            t_conn: (_c = ctx.get("dnsResolveConnectionTime")) != null ? _c : -1,
            t_total: totalTime
          });
          ctx.set("dnsResolveTotalTime", totalTime);
        }
      });
    }
    resolve(ctx, domain) {
      return __async(this, null, function* () {
        const now = Date.now();
        const resolved = yield this.getResolveResult(ctx, domain);
        const availableGroups = resolved.groups.filter((g) => g.after < now);
        if (availableGroups.length === 0)
          throw new Error("TODO: Empty group list");
        const group = random(availableGroups, (g) => g.weight);
        if (group == null)
          throw new Error("TODO: No available group");
        return group;
      });
    }
    do(ctx, url, attempts, job) {
      return __async(this, null, function* () {
        const urlObj = new URL(url);
        if (urlObj.port !== "")
          throw new Error("TODO: no port");
        let err;
        for (let i = 0; i < attempts; i++) {
          const group = yield this.resolve(ctx, urlObj.host);
          try {
            yield doWithGroup(group, url, job);
            group.duration = this.initialDuration;
            return;
          } catch (e) {
            console.debug("doWithGroup (weight:", group.weight, ") failed:", e);
            group.after = Date.now() + group.duration;
            group.duration *= 2;
            err = e;
          }
        }
        throw err;
      });
    }
  }
  function doWithGroup(group, url, job) {
    return __async(this, null, function* () {
      const elts = group.elts;
      if (elts.length === 0)
        throw new Error("Empty elt list");
      const ch = new ConsistentHash();
      ch.set(elts.map((e) => ({ key: e.id, replicas: e.replicas })));
      let err;
      for (let i = 0; i < 2; i++) {
        const eltId = ch.get(url);
        if (eltId == null)
          throw new Error("No available elt");
        const elt = elts.find((e) => e.id === eltId);
        if (elt == null)
          throw new Error("No available elt");
        try {
          yield doWithElt(elt, job);
          return;
        } catch (e) {
          console.debug("doWithElt", elt.id, "failed:", e);
          ch.remove(eltId);
          err = e;
        }
      }
      throw err;
    });
  }
  function doWithElt(elt, job) {
    return __async(this, null, function* () {
      let ips = elt.ips;
      let err;
      for (let i = 0; i < 2; i++) {
        const ip = random(ips);
        if (ip == null)
          throw new Error("No available ip");
        try {
          yield job(ip);
          return;
        } catch (e) {
          console.debug("do job with ip", ip, "failed:", e);
          ips = ips.filter((i2) => i2 !== ip);
          err = e;
        }
      }
      throw err;
    });
  }
  function random(items, getWeight = () => 1) {
    if (items.length === 0)
      return void 0;
    const weights = items.map(getWeight);
    const sum = weights.reduce((s, w) => s + w, 0);
    let val = Math.random() * sum;
    for (let i = 0; i < weights.length; i++) {
      const weight = weights[i];
      if (val < weight)
        return items[i];
      val -= weight;
    }
    return items[0];
  }
  function randomText(length) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    const charNum = chars.length;
    let text = "";
    for (let i = 0; i < length; i++) {
      text += chars[Math.floor(Math.random() * charNum)];
    }
    return text;
  }
  const defaultConfig = {
    size: 99999
  };
  function getBlockKey(itemKey, blockIdx) {
    return `${itemKey} ${blockIdx}`;
  }
  const debug$6 = (...args) => console.debug("[dcr]", ...args);
  class Cache {
    constructor(config2) {
      __publicField(this, "size");
      __publicField(this, "dbName", "cdnr/dcr");
      __publicField(this, "itemStoreName", "item");
      __publicField(this, "blockStoreName", "block");
      __publicField(this, "db");
      const configWithDefault = __spreadValues(__spreadValues({}, defaultConfig), config2);
      this.size = configWithDefault.size;
    }
    getDB() {
      return __async(this, null, function* () {
        if (this.db != null)
          return this.db;
        return new Promise((resolve) => {
          const request = indexedDB.open(this.dbName);
          request.addEventListener("upgradeneeded", () => {
            request.result.createObjectStore(this.itemStoreName);
            request.result.createObjectStore(this.blockStoreName);
          });
          resolve(promisifyRequest(request));
        });
      });
    }
    get(storeName, key) {
      return __async(this, null, function* () {
        const db = yield this.getDB();
        const request = db.transaction(storeName, "readonly").objectStore(storeName).get(key);
        return promisifyRequest(request);
      });
    }
    set(storeName, key, value) {
      return __async(this, null, function* () {
        const db = yield this.getDB();
        const transaction = db.transaction(storeName, "readwrite");
        transaction.objectStore(storeName).put(value, key);
        return promisifyTransaction(transaction);
      });
    }
    getItem(key) {
      return __async(this, null, function* () {
        return this.get(this.itemStoreName, key);
      });
    }
    setItem(key, item) {
      return __async(this, null, function* () {
        debug$6("setItem", key, item);
        const itemWithKey = __spreadProps(__spreadValues({}, item), { key });
        return this.set(this.itemStoreName, key, itemWithKey);
      });
    }
    getBlock(key, blockIdx) {
      return __async(this, null, function* () {
        const blockKey = getBlockKey(key, blockIdx);
        const block = yield this.get(this.blockStoreName, blockKey);
        debug$6("getBlock", key, blockIdx, block);
        return block;
      });
    }
    setBlock(key, blockIdx, blockContent) {
      return __async(this, null, function* () {
        const ua = new Uint8Array(blockContent.byteLength);
        ua.set(new Uint8Array(blockContent), 0);
        blockContent = ua.buffer;
        debug$6("setBlock", key, blockIdx, blockContent);
        const blockKey = getBlockKey(key, blockIdx);
        yield this.set(this.blockStoreName, blockKey, blockContent);
      });
    }
    dispose() {
      var _a;
      (_a = this.db) == null ? void 0 : _a.close();
    }
  }
  function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.addEventListener("success", () => resolve(request.result));
      request.addEventListener("error", () => reject(request.error));
    });
  }
  function promisifyTransaction(transaction) {
    return new Promise((resolve, reject) => {
      transaction.addEventListener("complete", () => resolve());
      transaction.addEventListener("error", () => reject(transaction.error));
      transaction.addEventListener("abort", () => reject(transaction.error));
    });
  }
  class HttpRequest {
    constructor(url, { method, headers, body: body2 }) {
      __publicField(this, "url");
      __publicField(this, "method");
      __publicField(this, "headers");
      __publicField(this, "body");
      this.url = url;
      this.method = method != null ? method : "GET";
      this.headers = new Headers(headers);
      this.body = body2 != null ? body2 : null;
    }
  }
  class HttpResponse {
    constructor(body2, { status, statusText, headers }) {
      __publicField(this, "status");
      __publicField(this, "statusText");
      __publicField(this, "headers");
      __publicField(this, "body");
      this.status = status != null ? status : 200;
      this.statusText = statusText != null ? statusText : "";
      this.headers = new Headers(headers);
      this.body = body2;
    }
  }
  class HttpClient {
    fetch(ctx, request) {
      return __async(this, null, function* () {
        var _b;
        const startAt = Date.now();
        const _a = request, { url } = _a, others = __objRest(_a, ["url"]);
        const nativeRequest = new Request(url, __spreadValues({
          mode: "cors",
          credentials: "omit"
        }, others));
        const { status, statusText, headers, body: body2 } = yield fetch(nativeRequest);
        const respTime = (Date.now() - startAt) / 1e3;
        ctx.set("downloadStatus", status);
        ctx.set("downloadReqID", (_b = headers.get("x-reqid")) != null ? _b : "");
        ctx.set("downloadConnectionTime", respTime);
        ctx.set("downloadTlsConnectionTime", -1);
        ctx.set("downloadFirstByteTime", 0);
        const resp = new HttpResponse(body2, { status, statusText, headers });
        return resp;
      });
    }
    dispose() {
    }
  }
  const defaultAttempts = 3;
  class Http {
    constructor(logger2, resolver2, client2 = new HttpClient()) {
      this.logger = logger2;
      this.resolver = resolver2;
      this.client = client2;
    }
    do(ctx, request) {
      return __async(this, null, function* () {
        const domain = new URL(request.url).host;
        const startAt = Date.now();
        let err;
        let currentRetryCount = 0;
        return new Promise((resolve) => {
          this.resolver.do(ctx, request.url, defaultAttempts, (ip) => __async(this, null, function* () {
            var _a;
            try {
              const req = withNode(request, ip);
              const resp = yield this.client.fetch(ctx, req);
              ctx.set("downloadStatus", resp.status);
              ctx.set("downloadReqID", (_a = resp.headers.get("x-reqid")) != null ? _a : "");
              ctx.set("downloadConnectionTime", (Date.now() - startAt) / 1e3);
              if (resp.status >= 500)
                throw new Error(`TODO: HTTP Status error: ${resp.status}`);
              resolve(resp);
            } catch (e) {
              err = e;
              throw e;
            } finally {
              const range = ctx.get("downloadRange");
              const retry = currentRetryCount;
              const doDownloadLog = (extra) => {
                var _a2, _b, _c, _d, _e, _f, _g, _h, _i;
                return this.logger.log("DownloadLog", __spreadValues({
                  loc: "",
                  ip,
                  domain,
                  range_st: (_a2 = range == null ? void 0 : range.start) != null ? _a2 : -1,
                  range_end: (_b = range == null ? void 0 : range.end) != null ? _b : -1,
                  retry,
                  ftask_id: (_c = ctx.get("downloadFileTaskID")) != null ? _c : "",
                  lookup_type: true,
                  t_lookup: (_d = ctx.get("dnsResolveFromCache") === true ? 0 : ctx.get("dnsResolveTotalTime")) != null ? _d : -1,
                  r_id: (_e = ctx.get("downloadReqID")) != null ? _e : "",
                  status_code: (_f = ctx.get("downloadStatus")) != null ? _f : -1,
                  t_conn: (_g = ctx.get("downloadConnectionTime")) != null ? _g : -1,
                  t_tls: (_h = ctx.get("downloadTlsConnectionTime")) != null ? _h : -1,
                  t_st_trans: (_i = ctx.get("downloadFirstByteTime")) != null ? _i : -1,
                  err_msg: "",
                  err_desc: "",
                  t_content_trans: -1,
                  t_total: -1,
                  resp_size: -1
                }, extra));
              };
              const onDownloadError = (e) => doDownloadLog({
                t_total: (Date.now() - startAt) / 1e3,
                err_msg: err instanceof Error ? err.name : "Unknown",
                err_desc: err instanceof Error ? err.message : err + ""
              });
              const onDownloadTransfered = (size, time) => doDownloadLog({
                t_content_trans: time,
                t_total: (Date.now() - startAt) / 1e3,
                resp_size: size
              });
              if (err != null) {
                onDownloadError();
              } else {
                ctx.set("downloadOnError", onDownloadError);
                ctx.set("downloadOnTransfered", onDownloadTransfered);
              }
              currentRetryCount++;
            }
          }));
        });
      });
    }
  }
  function withNode(originalReq, nodeIP) {
    const { url: originalUrl, method, headers: originalHeaders, body: body2 } = originalReq;
    const urlObject = new URL(originalUrl);
    const originalHost = urlObject.host;
    urlObject.host = nodeIP;
    const headers = new Headers(originalHeaders);
    headers.set("Host", originalHost);
    return new HttpRequest(urlObject.toString(), { method, headers, body: body2 });
  }
  function read(stream, expectedSize) {
    return __async(this, null, function* () {
      const container = new Uint8Array(expectedSize);
      let contentSize = 0;
      const reader = stream.getReader();
      while (contentSize < expectedSize) {
        const { value, done } = yield reader.read();
        if (done)
          break;
        const readSize = Math.min(value.byteLength, expectedSize - contentSize);
        container.set(new Uint8Array(value).slice(0, readSize), contentSize);
        contentSize += readSize;
      }
      return container.slice(0, contentSize);
    });
  }
  class Emitter {
    constructor() {
      __publicField(this, "map", /* @__PURE__ */ new Map());
    }
    on(type, handler) {
      var _a;
      const handlers = (_a = this.map.get(type)) != null ? _a : [];
      const newHandlers = [...handlers, handler];
      this.map.set(type, newHandlers);
      return () => this.off(type, handler);
    }
    once(type, handler) {
      const off = this.on(type, (e) => {
        off();
        handler(e);
      });
      return off;
    }
    off(type, handler) {
      var _a;
      const handlers = (_a = this.map.get(type)) != null ? _a : [];
      const newHandlers = handlers.filter((h) => h !== handler);
      this.map.set(type, newHandlers);
    }
    emit(...args) {
      var _a;
      const [type, event] = args;
      const handlers = (_a = this.map.get(type)) != null ? _a : [];
      handlers.forEach((handler) => {
        handler(event);
      });
    }
    dispose() {
      this.map.clear();
    }
  }
  class Context {
    constructor() {
      __publicField(this, "value", {});
    }
    set(key, value) {
      this.value[key] = value;
    }
    get(key) {
      return this.value[key];
    }
  }
  function getBlockIdx(blockSize, offset) {
    return Math.floor(offset / blockSize);
  }
  function getBlockNum(blockSize, fsize) {
    return Math.ceil(fsize / blockSize);
  }
  function getBlockOffset(blockSize, offset) {
    return offset % blockSize;
  }
  function decodeNAB(nab) {
    return new Uint8Array(nab);
  }
  function encodeNAB(nab) {
    return nab.buffer;
  }
  function makeNAB(fsize, blockSize) {
    const blockNum = getBlockNum(blockSize, fsize);
    const byteNum = Math.ceil(blockNum / 8);
    const initialByValue = (2 << 7) - 1;
    const arr = new Uint8Array(Array.from({ length: byteNum }).map(() => initialByValue));
    if (byteNum >= 1 && blockNum % 8 > 0) {
      arr[byteNum - 1] = (1 << blockNum % 8) - 1;
    }
    return arr;
  }
  function clearNAB(nab, blockIdx) {
    const i = Math.floor(blockIdx / 8);
    const ibit = blockIdx % 8;
    nab[i] = nab[i] & ~(1 << ibit) + __pow(2, 8);
  }
  function checkNAB(nab, blockIdx) {
    const i = Math.floor(blockIdx / 8);
    const ibit = blockIdx % 8;
    return (nab[i] & 1 << ibit) != 0;
  }
  function walkNAB(nab, startIdx, handler) {
    for (let i = startIdx; i < nab.length * 8; i++) {
      const unavailable = checkNAB(nab, i);
      const ret = handler(unavailable, i);
      if (ret === false)
        return;
    }
  }
  const highPriority = 100;
  const debug$5 = (...args) => console.debug("[cdnr/ftask]", ...args);
  class FileTask extends Emitter {
    constructor(taskq, cache, http, key, url, blockSize) {
      super();
      __publicField(this, "id", uuid());
      __publicField(this, "etag", null);
      __publicField(this, "fsize", null);
      __publicField(this, "udt", null);
      __publicField(this, "nab", new Uint8Array());
      __publicField(this, "progress", 0);
      __publicField(this, "dBlks", []);
      __publicField(this, "dProgress", 0);
      __publicField(this, "priority", 0);
      __publicField(this, "tasks", []);
      __publicField(this, "taskMutex", new Mutex());
      __publicField(this, "inited", false);
      __publicField(this, "meta", null);
      this.taskq = taskq;
      this.cache = cache;
      this.http = http;
      this.key = key;
      this.url = url;
      this.blockSize = blockSize;
    }
    startTask(task) {
      return __async(this, null, function* () {
        debug$5("startTask", task.url);
        this.taskMutex.runExclusive(() => __async(this, null, function* () {
          const inited = this.inited;
          if (!inited) {
            yield this.resumeItem();
            this.inited = true;
            this.emit("inited");
          }
          this.priority = Math.max(this.priority, task.priority);
          this.tasks = [...this.tasks, task];
          if (!inited) {
            if (this.isDone()) {
              debug$5("startTask already done");
              return;
            }
            this.getBlockLoop();
            if (this.udt == null) {
              this.taskq.add({
                name: `init: ${this.url}`,
                priority: this.priority,
                run: () => this.init()
              });
            } else {
              this.addBlockTask(1, this.priority);
            }
          }
        }));
      });
    }
    cancelTask(task) {
      return __async(this, null, function* () {
        this.taskMutex.runExclusive(() => __async(this, null, function* () {
          this.tasks = this.tasks.filter((t) => t !== task);
        }));
      });
    }
    finishTasks() {
      return __async(this, null, function* () {
        this.taskMutex.runExclusive(() => __async(this, null, function* () {
          this.tasks = [];
        }));
      });
    }
    getPendingBlock(fromIdx, toIdx) {
      let pendingBlockIdx = null;
      walkNAB(this.nab, fromIdx, (unavailable, i) => {
        if (toIdx != null && i >= toIdx)
          return false;
        if (unavailable && !this.dBlks.includes(i)) {
          pendingBlockIdx = i;
          return false;
        }
      });
      return pendingBlockIdx;
    }
    getUnfinisedBlock(fromIdx, toIdx) {
      let unfinisedBlockIdx = null;
      walkNAB(this.nab, fromIdx, (unavailable, i) => {
        if (toIdx != null && i >= toIdx)
          return false;
        if (unavailable) {
          unfinisedBlockIdx = i;
          return false;
        }
      });
      return unfinisedBlockIdx;
    }
    addBlockTask(fromIdx, priority) {
      var _a;
      debug$5("addBlockTask", this.url, fromIdx);
      if (this.fsize == null)
        throw new Error("fsize expected");
      if (this.noPending())
        return;
      const pendingBlockIdx = (_a = this.getPendingBlock(fromIdx)) != null ? _a : this.getPendingBlock(0, fromIdx);
      if (pendingBlockIdx == null) {
        console.error({
          progress: this.progress,
          dProgress: this.dProgress,
          dBlks: this.dBlks.join(","),
          fsize: this.fsize,
          noPending: this.noPending(),
          nab: this.nab,
          fromIdx,
          pendingBlockIdx: this.getPendingBlock(fromIdx)
        });
        throw new Error("Pending block not found");
      }
      const offset = pendingBlockIdx * this.blockSize;
      const leftSize = this.fsize - offset;
      const downloadSize = Math.min(leftSize, this.blockSize);
      this.dBlks = [...this.dBlks, pendingBlockIdx];
      this.dProgress += downloadSize;
      this.taskq.add({
        name: `block: ${this.url} [${pendingBlockIdx}]`,
        priority,
        run: () => this.getBlock(pendingBlockIdx, downloadSize)
      });
    }
    getRange(ctx, offset, size) {
      return __async(this, null, function* () {
        const rangeStart = offset;
        const rangeEnd = offset + size - 1;
        ctx.set("downloadRange", { start: rangeStart, end: rangeEnd });
        ctx.set("downloadFileTaskID", this.id);
        const request = new HttpRequest(this.url, {
          headers: {
            Range: `bytes=${rangeStart}-${rangeEnd}`,
            "Accept-Encoding": "identity;q=1, *;q=0"
          }
        });
        debug$5("do request:", request.url, [...request.headers.entries()]);
        const response = yield this.http.do(ctx, request);
        debug$5("do request resp:", request.url, [...response.headers.entries()]);
        return response;
      });
    }
    saveMeta(response) {
      var _a;
      debug$5("saveMeta headers:", [...response.headers.entries()]);
      let totalSize = null;
      if (response.status === 200) {
        const contentLengthStr = response.headers.get("Content-Length");
        const contentLength = contentLengthStr != null ? parseInt(contentLengthStr, 10) : null;
        totalSize = contentLength;
      }
      if (response.status === 206) {
        const contentRange = httpGetContentRange(response.headers);
        totalSize = (_a = contentRange == null ? void 0 : contentRange.totalSize) != null ? _a : null;
      }
      if (totalSize != null) {
        this.fsize = totalSize;
      }
      this.meta = {
        contentType: response.headers.get("Content-Type")
      };
      this.emit("meta-ready");
    }
    saveBlock(ctx, stream, blockIdx, expectedSize) {
      return __async(this, null, function* () {
        var _a, _b;
        let content;
        try {
          const startAt = Date.now();
          content = yield read(stream, expectedSize);
          (_a = ctx.get("downloadOnTransfered")) == null ? void 0 : _a(content.byteLength, (Date.now() - startAt) / 1e3);
        } catch (e) {
          (_b = ctx.get("downloadOnError")) == null ? void 0 : _b(e);
          throw e;
        }
        if (content.byteLength !== expectedSize)
          throw new Error(`TODO: not expected size: ${content.byteLength} / ${expectedSize}`);
        yield this.cache.setBlock(this.key, blockIdx, content);
      });
    }
    setChunkedContent(etag, fsize) {
      return __async(this, null, function* () {
        this.udt = unixTime();
        this.etag = etag;
        this.fsize = fsize;
        this.progress = fsize;
        yield this.saveItem();
        this.emitDone();
      });
    }
    saveFull(ctx, stream, headers) {
      return __async(this, null, function* () {
        var _a, _b;
        const reader = stream.getReader();
        const buffer = new Uint8Array(this.blockSize);
        let bufferSize = 0;
        let fsize = 0;
        let blockIdx = 0;
        const writeBuffer = (v) => {
          buffer.set(v, bufferSize);
          bufferSize += v.byteLength;
        };
        const saveBuffer = () => __async(this, null, function* () {
          const bufferContent = bufferSize === this.blockSize ? buffer : buffer.slice(0, bufferSize);
          yield this.cache.setBlock(this.key, blockIdx, bufferContent.buffer);
          this.progress += bufferSize;
          this.emitProgress();
        });
        const newBuffer = () => {
          blockIdx++;
          buffer.fill(0);
          bufferSize = 0;
        };
        try {
          const startReadAt = Date.now();
          while (true) {
            const { value, done } = yield reader.read();
            if (done)
              break;
            fsize += value.length;
            let left = value;
            while (true) {
              const blockMissing = this.blockSize - bufferSize;
              if (blockMissing >= left.length)
                break;
              writeBuffer(left.slice(0, blockMissing));
              yield saveBuffer();
              newBuffer();
              left = left.slice(blockMissing);
            }
            if (left.length > 0) {
              writeBuffer(left);
              continue;
            }
          }
          (_a = ctx.get("downloadOnTransfered")) == null ? void 0 : _a(bufferSize, (Date.now() - startReadAt) / 1e3);
        } catch (e) {
          (_b = ctx.get("downloadOnError")) == null ? void 0 : _b(e);
          throw e;
        }
        if (bufferSize != 0) {
          saveBuffer();
        }
        const etag = httpGetETagOrLastModified(headers);
        this.setChunkedContent(etag, fsize);
      });
    }
    saveItem() {
      return __async(this, null, function* () {
        yield this.cache.setItem(this.key, {
          etag: this.etag,
          fsize: this.fsize,
          udt: this.udt,
          progress: this.progress,
          nab: encodeNAB(this.nab),
          meta: this.meta
        });
      });
    }
    resumeItem() {
      return __async(this, null, function* () {
        let itemFromCache;
        try {
          itemFromCache = yield this.cache.getItem(this.key);
        } catch (e) {
        }
        if (itemFromCache != null) {
          debug$5("resumeItem itemFromCache", itemFromCache);
          Object.assign(this, {
            etag: itemFromCache.etag,
            fsize: itemFromCache.fsize,
            udt: itemFromCache.udt,
            progress: itemFromCache.progress,
            nab: decodeNAB(itemFromCache.nab),
            meta: itemFromCache.meta
          });
        }
      });
    }
    emitProgress() {
      this.emit("progress", this.getProgressInfo());
    }
    emitDone() {
      this.finishTasks();
      this.emit("done");
    }
    emitProgressOrDone() {
      if (this.isDone()) {
        this.emitDone();
      } else {
        this.emitProgress();
      }
    }
    finishBlock(blockIdx, size) {
      return __async(this, null, function* () {
        debug$5("finishBlock", blockIdx, size);
        const dBlks = this.dBlks;
        this.dBlks = dBlks.filter((b) => b !== blockIdx);
        if (this.dBlks.length === dBlks.length)
          throw new Error(`Non-exist download block: ${blockIdx}`);
        this.dProgress -= size;
        this.progress += size;
        clearNAB(this.nab, blockIdx);
        yield this.saveItem();
        this.emitProgressOrDone();
      });
    }
    getBlock(blockIdx, size) {
      return __async(this, null, function* () {
        const ctx = new Context();
        const offset = blockIdx * this.blockSize;
        const response = yield this.getRange(ctx, offset, size);
        if (response.status !== 206)
          throw new Error(`TODO: Unexpected status ${response.status}`);
        if (response.body == null)
          throw new Error(`TODO: empty body`);
        const etag = httpGetETagOrLastModified(response.headers);
        if (this.etag !== etag)
          throw new Error(`TODO: etag mismatch: ${etag}, ${this.etag}`);
        yield this.saveBlock(ctx, response.body, blockIdx, size);
        yield this.finishBlock(blockIdx, size);
        this.emit("getBlock-done", blockIdx);
      });
    }
    setContent(etag, fsize, progress, nab) {
      return __async(this, null, function* () {
        this.fsize = fsize;
        this.etag = etag;
        this.udt = unixTime();
        this.progress = progress;
        this.nab = nab;
        yield this.saveItem();
        this.emitProgressOrDone();
      });
    }
    getBlockLoop() {
      return __async(this, null, function* () {
        if (this.isDone())
          return;
        const off = this.on("getBlock-done", (blockIdx) => {
          if (this.noPending()) {
            off();
            return;
          }
          if (this.dProgress > 0)
            return;
          if (this.tasks.length === 0)
            return;
          this.addBlockTask(blockIdx, this.priority);
        });
        this.once("done", () => off());
      });
    }
    init() {
      return __async(this, null, function* () {
        debug$5("init", this.url);
        const ctx = new Context();
        const response = yield this.getRange(ctx, 0, this.blockSize);
        switch (response.status) {
          case 206:
            this.saveMeta(response);
            const etag = httpGetETagOrLastModified(response.headers);
            const contentRange = httpGetContentRange(response.headers);
            if (contentRange == null)
              throw new Error("TODO: No Content-Range info");
            if (contentRange.totalSize == null)
              throw new Error("TODO: No file size info");
            if (contentRange.rangeSize == null)
              throw new Error("TODO: No range size info");
            if (contentRange.totalSize === 0) {
              yield this.setChunkedContent(etag, 0);
              return;
            }
            if (response.body == null)
              throw new Error(`TODO: empty body`);
            yield this.saveBlock(ctx, response.body, 0, contentRange.rangeSize);
            const nab = makeNAB(contentRange.totalSize, this.blockSize);
            clearNAB(nab, 0);
            yield this.setContent(etag, contentRange.totalSize, contentRange.rangeSize, nab);
            this.emit("getBlock-done", 0);
            break;
          case 200:
            this.saveMeta(response);
            if (response.body == null)
              throw new Error(`TODO: empty body`);
            yield this.saveFull(ctx, response.body, response.headers);
            break;
          default:
            throw new Error(`TODO: Invalid response status: ${response.status}`);
        }
      });
    }
    waitForProgress() {
      return new Promise((resolve) => {
        const onChange = () => {
          offProgress();
          offDone();
          resolve();
        };
        const offProgress = this.on("progress", onChange);
        const offDone = this.on("done", onChange);
      });
    }
    requireRange(offset, size) {
      return __async(this, null, function* () {
        const end = size != null ? offset + size : null;
        while (true) {
          if (this.fsize == null) {
            if (end != null && this.progress >= end) {
              debug$5("requireRange finish for enough progress:", offset, size);
              return;
            }
          } else {
            if (offset >= this.fsize) {
              debug$5("requireRange exit for index exceeded:", offset, size);
              throw new IndexExceededError(`Read ${offset} from file with size ${this.fsize}.`);
            }
            if (this.isDone()) {
              debug$5("requireRange finish for file done:", offset, size);
              return;
            }
            const startIdx = getBlockIdx(this.blockSize, offset);
            const endIdx = end != null ? getBlockIdx(this.blockSize, end - 1) + 1 : void 0;
            const unfinished = this.getUnfinisedBlock(startIdx, endIdx);
            if (unfinished == null) {
              debug$5("requireRange finish for range done:", offset, size);
              return;
            }
            this.addBlockTask(startIdx, highPriority);
          }
          yield this.waitForProgress();
        }
      });
    }
    whenInited() {
      return __async(this, null, function* () {
        if (this.inited)
          return;
        return new Promise((resolve) => {
          this.once("inited", resolve);
        });
      });
    }
    whenMetaReady() {
      return __async(this, null, function* () {
        if (this.meta != null)
          return;
        return new Promise((resolve) => {
          this.once("meta-ready", resolve);
        });
      });
    }
    readBlock(blockIdx) {
      return __async(this, null, function* () {
        yield this.requireRange(blockIdx * this.blockSize, this.blockSize);
        const block = yield this.cache.getBlock(this.key, blockIdx);
        if (block == null)
          throw new Error(`TODO: block ${blockIdx} should be ready`);
        return new Uint8Array(block);
      });
    }
    noPending() {
      return this.fsize != null && this.progress + this.dProgress >= this.fsize;
    }
    isDone() {
      return this.fsize != null && this.progress === this.fsize;
    }
    getblockNum() {
      if (this.fsize == null)
        return null;
      return getBlockNum(this.blockSize, this.fsize);
    }
    getProgressInfo() {
      return { size: this.progress, fsize: this.fsize };
    }
  }
  class IndexExceededError extends Error {
    constructor() {
      super(...arguments);
      __publicField(this, "name", "IndexExceededError");
    }
  }
  const debug$4 = (...args) => console.debug("[cdnr/file]", ...args);
  class File {
    constructor(task, fileTask) {
      __publicField(this, "closed", false);
      this.task = task;
      this.fileTask = fileTask;
    }
    size() {
      return this.fileTask.fsize;
    }
    meta() {
      return __async(this, null, function* () {
        yield this.fileTask.whenMetaReady();
        return this.fileTask.meta;
      });
    }
    stream(offset = 0, size) {
      return __async(this, null, function* () {
        if (this.closed)
          throw new Error("File already closed");
        let streamCancelled = false;
        const stream = new ReadableStream({
          start: (ctrl) => {
            (() => __async(this, null, function* () {
              const blockSize = this.fileTask.blockSize;
              let blockIdx = getBlockIdx(blockSize, offset);
              let blockOffset = getBlockOffset(blockSize, offset);
              const fileLeftSize = this.fileTask.fsize != null ? this.fileTask.fsize - offset : null;
              let leftSize = size != null ? size : fileLeftSize;
              if (leftSize != null && fileLeftSize != null) {
                leftSize = Math.min(leftSize, fileLeftSize);
              }
              while (!this.closed && !streamCancelled) {
                if (leftSize === 0) {
                  debug$4("stream", this.task.url, "close for no left size", offset, fileLeftSize, this.fileTask.fsize);
                  ctrl.close();
                  return;
                }
                const blockNum = this.fileTask.getblockNum();
                if (blockNum != null && blockIdx >= blockNum) {
                  debug$4("stream", this.task.url, "close no more block", blockIdx, "/", blockNum);
                  ctrl.close();
                  return;
                }
                let block;
                try {
                  block = yield this.fileTask.readBlock(blockIdx);
                } catch (e) {
                  if (e instanceof IndexExceededError) {
                    debug$4("stream", this.task.url, "close for IndexExceededError");
                    ctrl.close();
                    return;
                  }
                  throw e;
                }
                if (this.closed || streamCancelled)
                  return;
                debug$4("readBlock", this.task.url, blockIdx, "/", blockNum);
                const readEnd = leftSize != null ? blockOffset + leftSize : void 0;
                const toRead = block.slice(blockOffset, readEnd);
                ctrl.enqueue(toRead);
                blockIdx += 1;
                blockOffset = 0;
                if (leftSize != null) {
                  leftSize -= toRead.byteLength;
                }
              }
            }))();
          },
          pull: (controller) => {
          },
          cancel: (reason) => {
            debug$4("stream", this.task.url, "cancelled for", reason);
            this.close();
            streamCancelled = true;
          }
        });
        return stream;
      });
    }
    blob() {
      return __async(this, null, function* () {
        const stream = yield this.stream(0);
        const reader = stream.getReader();
        const parts = [];
        while (true) {
          const { done, value } = yield reader.read();
          if (done)
            break;
          const arrayBuffer = value;
          parts.push(arrayBuffer);
        }
        return new Blob(parts);
      });
    }
    close() {
      this.closed = true;
      return this.fileTask.cancelTask(this.task);
    }
  }
  class Task extends Emitter {
    constructor(client2, url, expiry) {
      super();
      __publicField(this, "fileTask", null);
      __publicField(this, "priority", 0);
      this.client = client2;
      this.url = url;
      this.expiry = expiry;
    }
    setPriority(priority) {
      this.priority = priority;
    }
    isDone() {
      if (this.fileTask == null)
        return false;
      return this.fileTask.isDone();
    }
    getProgressInfo() {
      if (this.fileTask == null)
        return null;
      return this.fileTask.getProgressInfo();
    }
    start() {
      return __async(this, null, function* () {
        if (this.fileTask != null) {
          throw new Error("Task already started");
        }
        const fileTask = this.fileTask = this.client.startTask(this);
        fileTask.on("progress", (d) => this.emit("progress", d));
        fileTask.on("done", () => this.emit("done"));
        yield fileTask.whenInited();
        return new File(this, fileTask);
      });
    }
  }
  const debug$3 = (...args) => console.debug("[utils/taskq]", ...args);
  class TaskQueue {
    constructor(jobs) {
      __publicField(this, "tasks", []);
      __publicField(this, "emitter", new Emitter());
      __publicField(this, "running", true);
      for (let i = 0; i < jobs; i++) {
        this.comsumeLoop();
      }
    }
    add(task) {
      this.tasks = [...this.tasks, task].sort(
        (taskA, taskB) => taskA.priority - taskB.priority
      );
      this.emitter.emit("task");
    }
    pop() {
      return __async(this, null, function* () {
        const task = this.tasks.pop();
        if (task != null)
          return task;
        return new Promise((resolve) => {
          const off = this.emitter.on("task", () => {
            const task2 = this.tasks.pop();
            if (task2 != null) {
              resolve(task2);
              off();
            }
          });
        });
      });
    }
    consumeTask() {
      return __async(this, null, function* () {
        if (!this.running)
          return;
        const task = yield this.pop();
        debug$3("run task", task.name, ", with priority:", task.priority);
        try {
          yield task == null ? void 0 : task.run();
        } catch (e) {
          console.warn("Task run failed:", e);
        }
      });
    }
    comsumeLoop() {
      return __async(this, null, function* () {
        while (this.running) {
          yield this.consumeTask();
        }
      });
    }
    dispose() {
      this.emitter.dispose();
      this.running = false;
    }
  }
  const defaultWorkersCount = 5;
  const defaultBlockSize = 1 << 18;
  class Client {
    constructor(appInfo, config2) {
      __publicField(this, "fileTasks", /* @__PURE__ */ new Map());
      __publicField(this, "taskq");
      __publicField(this, "cache");
      __publicField(this, "hasher");
      __publicField(this, "http");
      __publicField(this, "logger");
      __publicField(this, "blockSize", defaultBlockSize);
      var _a, _b, _c, _d;
      this.appInfo = appInfo;
      this.cache = new Cache(config2 == null ? void 0 : config2.cache);
      this.hasher = (_a = config2 == null ? void 0 : config2.hasher) != null ? _a : defaultHash;
      this.logger = (_b = config2 == null ? void 0 : config2.logger) != null ? _b : new Logger();
      const resolver2 = new Resolver(this.logger, config2 == null ? void 0 : config2.dnsResolver);
      this.http = (_c = config2 == null ? void 0 : config2.http) != null ? _c : new Http(this.logger, resolver2);
      this.taskq = new TaskQueue((_d = config2 == null ? void 0 : config2.workersCount) != null ? _d : defaultWorkersCount);
    }
    createTask(url, expiry = 0) {
      const hashIdx = url.indexOf("#");
      if (hashIdx >= 0) {
        url = url.slice(0, hashIdx);
      }
      return new Task(this, url, expiry);
    }
    startTask(task) {
      const key = this.hasher(task.url);
      let fileTask = this.fileTasks.get(key);
      if (fileTask == null) {
        fileTask = new FileTask(this.taskq, this.cache, this.http, key, task.url, this.blockSize);
        this.fileTasks.set(key, fileTask);
      }
      fileTask.startTask(task);
      return fileTask;
    }
    dispose() {
      this.taskq.dispose();
      this.cache.dispose();
    }
  }
  function defaultHash(url) {
    return url;
  }
  function isResponseMessage(message) {
    return message && message.hoW === true && ["resp-head", "resp-body-chunk"].includes(message.type);
  }
  function dehydrateHeaders(headers) {
    const res = {};
    headers.forEach((v, k) => {
      res[k] = v;
    });
    return res;
  }
  function isInServiceWorker() {
    const scope2 = self;
    return !!(scope2.clients && scope2.registration);
  }
  const debug$2 = (...args) => console.debug("[cdnr/http/webrtc]", ...args);
  const messageEmitter = new Emitter();
  let scope$1;
  if (typeof self !== "undefined") {
    scope$1 = self;
    scope$1.addEventListener("message", (e) => messageEmitter.emit("message", e));
  }
  class HoWClient {
    constructor(getFingerprint2) {
      this.getFingerprint = getFingerprint2;
    }
    sendBody(client2, id, body2) {
      return __async(this, null, function* () {
        const reader = body2.getReader();
        while (true) {
          const { value, done } = yield reader.read();
          if (done) {
            const message2 = { hoW: true, type: "req-body-chunk", id, payload: null };
            client2.postMessage(message2);
            return;
          }
          const message = { hoW: true, type: "req-body-chunk", id, payload: value.buffer };
          client2.postMessage(message, [value.buffer]);
        }
      });
    }
    sendRequest(client2, id, request, fingerprint) {
      return __async(this, null, function* () {
        debug$2("sendRequest in Service Worker", id, request);
        const { body: body2, url, method, headers } = request;
        const message = {
          hoW: true,
          type: "req-head",
          id,
          url,
          method,
          headers: dehydrateHeaders(headers),
          fingerprint,
          hasBody: body2 != null
        };
        client2.postMessage(message);
        if (body2 != null) {
          yield this.sendBody(client2, id, body2);
        }
      });
    }
    receiveResponse(id) {
      return __async(this, null, function* () {
        let streamCtrl;
        return new Promise((resolve) => {
          const unlisten = messageEmitter.on("message", ({ data }) => {
            debug$2("Got message in Service Worker", data);
            if (!isResponseMessage(data))
              return;
            if (data.id !== id)
              return;
            if (data.type === "resp-head") {
              debug$2("Message resp-head", data);
              if (!data.hasBody) {
                debug$2("Resolve with no body");
                resolve(new HttpResponse(null, data));
                unlisten();
                return;
              }
              const stream = new ReadableStream({
                start: (ctrl) => streamCtrl = ctrl
              });
              const response = new HttpResponse(stream, data);
              debug$2("Resolve with body", response);
              resolve(response);
              return;
            }
            if (data.type === "resp-body-chunk") {
              if (streamCtrl == null)
                throw new Error("Stream Controller should be ready");
              if (data.payload == null) {
                streamCtrl.close();
                unlisten();
                return;
              }
              streamCtrl.enqueue(new Uint8Array(data.payload));
            }
          });
        });
      });
    }
    fetch(ctx, request) {
      return __async(this, null, function* () {
        const target = new URL(request.url).host;
        const fingerprint = yield this.getFingerprint(target);
        const clients = yield scope$1.clients.matchAll({ type: "window" });
        if (clients.length === 0)
          throw new Error("No available window client");
        const client2 = clients[0];
        const id = uuid();
        this.sendRequest(client2, id, request, fingerprint);
        const resp = yield this.receiveResponse(id);
        return resp;
      });
    }
    dispose() {
    }
  }
  class HoWHttpClientForSW {
    constructor(getFingerprint2) {
      __publicField(this, "client");
      this.getFingerprint = getFingerprint2;
      if (!isInServiceWorker())
        throw new Error("HoWHttpClientForSW should be used in Service Worker");
      this.client = new HoWClient(this.getFingerprint);
    }
    fetch(ctx, request) {
      return __async(this, null, function* () {
        return this.client.fetch(ctx, request);
      });
    }
    dispose() {
      this.client.dispose();
    }
  }
  const debug$1 = (...args) => console.debug("[cdnr/proxy/common]", ...args);
  function proxyRequest(client2, request) {
    return __async(this, null, function* () {
      return new Promise((resolve) => __async(this, null, function* () {
        var _a, _b, _c, _d, _e, _f, _g;
        const task = client2.createTask(request.url);
        const file = yield task.start();
        request.signal.addEventListener("abort", () => {
          file.close();
        });
        const range = httpGetRange(request.headers);
        const offset = (_a = range == null ? void 0 : range.start) != null ? _a : void 0;
        const size = (_b = range == null ? void 0 : range.rangeSize) != null ? _b : void 0;
        const [meta, stream] = yield Promise.all([
          file.meta(),
          file.stream(offset, size)
        ]);
        const fsize = file.size();
        const headers = {
          "Accept-Ranges": "bytes",
          "Access-Control-Allow-Origin": "*",
          "Content-Type": (_c = meta.contentType) != null ? _c : "",
          "Content-Length": ((_d = file.size()) != null ? _d : "") + "",
          "Content-Transfer-Encoding": "binary"
        };
        const realRangeEnd = (_e = range == null ? void 0 : range.end) != null ? _e : fsize != null ? fsize - 1 : null;
        const response = range == null ? new Response(stream, { status: 200, statusText: "OK", headers }) : new Response(stream, { status: 206, statusText: "Partial Content", headers: __spreadProps(__spreadValues({}, headers), {
          "Content-Length": realRangeEnd != null && range.start != null ? realRangeEnd - range.start + 1 + "" : "",
          "Content-Range": stringifyContentRange({
            start: (_f = range.start) != null ? _f : 0,
            end: (_g = range.end) != null ? _g : fsize != null ? fsize - 1 : null,
            rangeSize: range.rangeSize,
            totalSize: fsize
          })
        }) });
        debug$1("proxyRequest response got", response, [...response.headers.entries()]);
        resolve(response);
      }));
    });
  }
  const configQueryName = "CDNR_PROXY_CONFIG";
  function getProxyConfig(scriptUrl) {
    const search = scriptUrl.split("?")[1];
    if (!search)
      throw new Error("Invalid script url");
    const params = new URLSearchParams(search);
    const configText = params.get(configQueryName);
    if (configText == null)
      throw new Error("Invalid script url: no config info");
    return JSON.parse(configText);
  }
  const scope = self;
  const debug = (...args) => console.debug("[cdnr/proxy/service-worker]", ...args);
  const config = getProxyConfig(scope.location.href);
  const logger = {
    log: () => void 0
  };
  const mockResolver = () => __async(this, null, function* () {
    return {
      groups: [
        {
          elts: [
            {
              id: randomText(10),
              ips: ["10.202.18.253:2200"],
              fingerprint: "f0:63:f1:e5:e2:14:b8:0f:f7:6c:2a:5a:f6:a2:bd:b8:9f:c7:4a:1e:cf:e1:9b:d1:d1:63:62:fc:5c:56:c7:da",
              replicas: 40
            }
          ],
          weight: 50
        }
      ],
      ttl: 1
    };
  });
  const resolver = new Resolver(logger, mockResolver);
  const getFingerprint = (ipPort) => resolver.getFingerprint(ipPort);
  const client = new Client(config.app, __spreadProps(__spreadValues({}, config.client), {
    logger,
    http: new Http(logger, resolver, new HoWHttpClientForSW(getFingerprint))
  }));
  scope.addEventListener("fetch", (event) => __async(this, null, function* () {
    const { request } = event;
    if (shouldUseCDN(request, config.domains)) {
      debug("use cdn", request.url);
      event.respondWith(proxyRequest(client, request).catch((e) => {
        return fetch(request);
      }));
      return;
    }
  }));
  function shouldUseCDN(request, cdnDomains) {
    const requestDomain = new URL(request.url).hostname;
    if (!cdnDomains.includes(requestDomain))
      return false;
    if (request.method !== "GET")
      return false;
    return true;
  }
});
