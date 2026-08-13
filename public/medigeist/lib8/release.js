async function instantiate(module, imports = {}) {
  const adaptedImports = {
    env: Object.setPrototypeOf({
      abort(message, fileName, lineNumber, columnNumber) {
        // ~lib/builtins/abort(~lib/string/String | null?, ~lib/string/String | null?, u32?, u32?) => void
        message = __liftString(message >>> 0);
        fileName = __liftString(fileName >>> 0);
        lineNumber = lineNumber >>> 0;
        columnNumber = columnNumber >>> 0;
        (() => {
          // @external.js
          throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`);
        })();
      },
    }, Object.assign(Object.create(globalThis), imports.env || {})),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    initString(init_set) {
      // assembly/index/initString(~lib/string/String) => ~lib/array/Array<~lib/array/Array<~lib/string/String>>
      init_set = __lowerString(init_set) || __notnull();
      return __liftArray(pointer => __liftArray(pointer => __liftString(__getU32(pointer)), 2, __getU32(pointer)), 2, exports.initString(init_set) >>> 0);
    },
    initNumbers(init_set) {
      // assembly/index/initNumbers(~lib/array/Array<i32>) => ~lib/array/Array<~lib/array/Array<i32>>
      init_set = __lowerArray(__setU32, 8, 2, init_set) || __notnull();
      return __liftArray(pointer => __liftArray(__getI32, 2, __getU32(pointer)), 2, exports.initNumbers(init_set) >>> 0);
    },
    setNames() {
      // assembly/index/setNames() => ~lib/array/Array<~lib/string/String>
      return __liftArray(pointer => __liftString(__getU32(pointer)), 2, exports.setNames() >>> 0);
    },
    isValidSet(name) {
      // assembly/index/isValidSet(~lib/string/String) => bool
      name = __lowerString(name) || __notnull();
      return exports.isValidSet(name) != 0;
    },
    glyphs() {
      // assembly/index/glyphs() => ~lib/string/String
      return __liftString(exports.glyphs() >>> 0);
    },
    SVGNode(w, h, children) {
      // assembly/index/SVGNode(~lib/string/String, ~lib/string/String, ~lib/array/Array<~lib/string/String>) => ~lib/string/String
      w = __retain(__lowerString(w) || __notnull());
      h = __retain(__lowerString(h) || __notnull());
      children = __lowerArray((pointer, value) => { __setU32(pointer, __lowerString(value) || __notnull()); }, 7, 2, children) || __notnull();
      try {
        return __liftString(exports.SVGNode(w, h, children) >>> 0);
      } finally {
        __release(w);
        __release(h);
      }
    },
    StyleNode(children) {
      // assembly/index/StyleNode(~lib/array/Array<~lib/string/String>) => ~lib/string/String
      children = __lowerArray((pointer, value) => { __setU32(pointer, __lowerString(value) || __notnull()); }, 7, 2, children) || __notnull();
      return __liftString(exports.StyleNode(children) >>> 0);
    },
    GroupNode(id, children, transform) {
      // assembly/index/GroupNode(~lib/string/String, ~lib/array/Array<~lib/string/String>, ~lib/string/String?) => ~lib/string/String
      id = __retain(__lowerString(id) || __notnull());
      children = __retain(__lowerArray((pointer, value) => { __setU32(pointer, __lowerString(value) || __notnull()); }, 7, 2, children) || __notnull());
      transform = __lowerString(transform) || __notnull();
      try {
        exports.__setArgumentsLength(arguments.length);
        return __liftString(exports.GroupNode(id, children, transform) >>> 0);
      } finally {
        __release(id);
        __release(children);
      }
    },
    RectNode(id, x, y, w, h, cl, transform) {
      // assembly/index/RectNode(~lib/string/String, ~lib/string/String, ~lib/string/String, ~lib/string/String, ~lib/string/String, ~lib/string/String, ~lib/string/String?) => ~lib/string/String
      id = __retain(__lowerString(id) || __notnull());
      x = __retain(__lowerString(x) || __notnull());
      y = __retain(__lowerString(y) || __notnull());
      w = __retain(__lowerString(w) || __notnull());
      h = __retain(__lowerString(h) || __notnull());
      cl = __retain(__lowerString(cl) || __notnull());
      transform = __lowerString(transform) || __notnull();
      try {
        exports.__setArgumentsLength(arguments.length);
        return __liftString(exports.RectNode(id, x, y, w, h, cl, transform) >>> 0);
      } finally {
        __release(id);
        __release(x);
        __release(y);
        __release(w);
        __release(h);
        __release(cl);
      }
    },
    LineNode(id, x1, y1, x2, y2, cl, transform) {
      // assembly/index/LineNode(~lib/string/String, ~lib/string/String, ~lib/string/String, ~lib/string/String, ~lib/string/String, ~lib/string/String, ~lib/string/String?) => ~lib/string/String
      id = __retain(__lowerString(id) || __notnull());
      x1 = __retain(__lowerString(x1) || __notnull());
      y1 = __retain(__lowerString(y1) || __notnull());
      x2 = __retain(__lowerString(x2) || __notnull());
      y2 = __retain(__lowerString(y2) || __notnull());
      cl = __retain(__lowerString(cl) || __notnull());
      transform = __lowerString(transform) || __notnull();
      try {
        exports.__setArgumentsLength(arguments.length);
        return __liftString(exports.LineNode(id, x1, y1, x2, y2, cl, transform) >>> 0);
      } finally {
        __release(id);
        __release(x1);
        __release(y1);
        __release(x2);
        __release(y2);
        __release(cl);
      }
    },
    createSVGDocument(ratio, map, text) {
      // assembly/index/createSVGDocument(f64, ~lib/string/String, ~lib/string/String) => ~lib/string/String
      map = __retain(__lowerString(map) || __notnull());
      text = __lowerString(text) || __notnull();
      try {
        return __liftString(exports.createSVGDocument(ratio, map, text) >>> 0);
      } finally {
        __release(map);
      }
    },
  }, exports);
  function __liftString(pointer) {
    if (!pointer) return null;
    const
      end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1,
      memoryU16 = new Uint16Array(memory.buffer);
    let
      start = pointer >>> 1,
      string = "";
    while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  function __lowerString(value) {
    if (value == null) return 0;
    const
      length = value.length,
      pointer = exports.__new(length << 1, 2) >>> 0,
      memoryU16 = new Uint16Array(memory.buffer);
    for (let i = 0; i < length; ++i) memoryU16[(pointer >>> 1) + i] = value.charCodeAt(i);
    return pointer;
  }
  function __liftArray(liftElement, align, pointer) {
    if (!pointer) return null;
    const
      dataStart = __getU32(pointer + 4),
      length = __dataview.getUint32(pointer + 12, true),
      values = new Array(length);
    for (let i = 0; i < length; ++i) values[i] = liftElement(dataStart + (i << align >>> 0));
    return values;
  }
  function __lowerArray(lowerElement, id, align, values) {
    if (values == null) return 0;
    const
      length = values.length,
      buffer = exports.__pin(exports.__new(length << align, 1)) >>> 0,
      header = exports.__pin(exports.__new(16, id)) >>> 0;
    __setU32(header + 0, buffer);
    __dataview.setUint32(header + 4, buffer, true);
    __dataview.setUint32(header + 8, length << align, true);
    __dataview.setUint32(header + 12, length, true);
    for (let i = 0; i < length; ++i) lowerElement(buffer + (i << align >>> 0), values[i]);
    exports.__unpin(buffer);
    exports.__unpin(header);
    return header;
  }
  const refcounts = new Map();
  function __retain(pointer) {
    if (pointer) {
      const refcount = refcounts.get(pointer);
      if (refcount) refcounts.set(pointer, refcount + 1);
      else refcounts.set(exports.__pin(pointer), 1);
    }
    return pointer;
  }
  function __release(pointer) {
    if (pointer) {
      const refcount = refcounts.get(pointer);
      if (refcount === 1) exports.__unpin(pointer), refcounts.delete(pointer);
      else if (refcount) refcounts.set(pointer, refcount - 1);
      else throw Error(`invalid refcount '${refcount}' for reference '${pointer}'`);
    }
  }
  function __notnull() {
    throw TypeError("value must not be null");
  }
  let __dataview = new DataView(memory.buffer);
  function __setU32(pointer, value) {
    try {
      __dataview.setUint32(pointer, value, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      __dataview.setUint32(pointer, value, true);
    }
  }
  function __getI32(pointer) {
    try {
      return __dataview.getInt32(pointer, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      return __dataview.getInt32(pointer, true);
    }
  }
  function __getU32(pointer) {
    try {
      return __dataview.getUint32(pointer, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      return __dataview.getUint32(pointer, true);
    }
  }
  return adaptedExports;
}
export const {
  memory,
  __new,
  __pin,
  __unpin,
  __collect,
  __rtti_base,
  glyphLimit,
  initString,
  initNumbers,
  setNames,
  isValidSet,
  glyphs,
  SVGNode,
  StyleNode,
  GroupNode,
  RectNode,
  LineNode,
  createSVGDocument,
} = await (async url => instantiate(
  await (async () => {
    const isNodeOrBun = typeof process != "undefined" && process.versions != null && (process.versions.node != null || process.versions.bun != null);
    if (isNodeOrBun) { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
    else { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
  })(), {
  }
))(new URL("release.wasm", import.meta.url));
