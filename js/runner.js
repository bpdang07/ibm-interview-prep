// Runs challenge code in a Web Worker so a slow or infinite loop can't freeze the page.
// JavaScript runs directly; Python runs on Pyodide (CPython compiled to WebAssembly),
// downloaded from jsDelivr the first time you run Python and cached by the browser after that.
window.CodeRunner = (function () {
  'use strict';

  const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  // Per-test time limits. Generous, since the big hidden tests are meant to catch O(n²), not to be tight.
  const LIMIT_MS = { js: 4000, py: 6000 };

  const JS_WORKER = `
    self.onmessage = (e) => {
      const { code, fn, tests } = e.data;
      const logs = [];
      let logSize = 0;
      const show = (v) => typeof v === 'string' ? v : (() => { try { return JSON.stringify(v); } catch (err) { return String(v); } })();
      console.log = console.info = console.warn = console.error = (...args) => {
        const line = args.map(show).join(' ');
        logSize += line.length;
        if (logSize < 6000) logs.push(line);
      };
      // new Function adds two lines before the code, so stack line numbers are off by two
      const where = (err) => { const m = /<anonymous>:(\\d+):\\d+/.exec(err.stack || ''); return m ? ' (line ' + (m[1] - 2) + ')' : ''; };
      let f;
      try {
        f = new Function(code + '\\nreturn typeof ' + fn + ' === "function" ? ' + fn + ' : null;')();
      } catch (err) {
        postMessage({ type: 'compile', error: err.name + ': ' + err.message + where(err) });
        return postMessage({ type: 'done', logs });
      }
      if (!f) {
        postMessage({ type: 'compile', error: 'Define a function named ' + fn + '.' });
        return postMessage({ type: 'done', logs });
      }
      postMessage({ type: 'compile', error: null });
      tests.forEach((t, i) => {
        const t0 = performance.now();
        try {
          const out = f(...t.args);
          postMessage({ type: 'result', i, got: JSON.parse(JSON.stringify(out === undefined ? null : out)), ms: performance.now() - t0 });
        } catch (err) {
          postMessage({ type: 'result', i, error: err.name + ': ' + err.message + where(err), ms: performance.now() - t0 });
        }
      });
      postMessage({ type: 'done', logs });
    };`;

  const PY_HARNESS = `
import json, time, traceback, js

def _where(tb):
    frames = [f for f in traceback.extract_tb(tb) if f.filename == "solution.py"]
    return f" (line {frames[-1].lineno})" if frames else ""

def _run(code, fn, tests_json):
    ns = {"__name__": "solution"}
    try:
        exec(compile(code, "solution.py", "exec"), ns)
    except SyntaxError as e:
        js.post(json.dumps({"type": "compile", "error": f"SyntaxError: {e.msg} (line {e.lineno})"}))
        return
    except Exception as e:
        js.post(json.dumps({"type": "compile", "error": f"{type(e).__name__}: {e}{_where(e.__traceback__)}"}))
        return
    f = ns.get(fn)
    if not callable(f):
        js.post(json.dumps({"type": "compile", "error": f"Define a function named {fn}."}))
        return
    js.post(json.dumps({"type": "compile", "error": None}))
    for i, t in enumerate(json.loads(tests_json)):
        t0 = time.perf_counter()
        try:
            out = f(*t["args"])
            got = json.loads(json.dumps(out, default=list))
            js.post(json.dumps({"type": "result", "i": i, "got": got, "ms": (time.perf_counter() - t0) * 1000}))
        except Exception as e:
            js.post(json.dumps({"type": "result", "i": i, "error": f"{type(e).__name__}: {e}{_where(e.__traceback__)}", "ms": (time.perf_counter() - t0) * 1000}))
`;

  const PY_WORKER = `
    importScripts('${PYODIDE}pyodide.js');
    let logs = [];
    let logSize = 0;
    self.post = (s) => postMessage(JSON.parse(s));
    const ready = loadPyodide({ indexURL: '${PYODIDE}' }).then(async (py) => {
      py.setStdout({ batched: (line) => { logSize += line.length; if (logSize < 6000) logs.push(line); } });
      py.setStderr({ batched: (line) => { logSize += line.length; if (logSize < 6000) logs.push(line); } });
      await py.runPythonAsync(${JSON.stringify(PY_HARNESS)});
      postMessage({ type: 'ready' });
      return py.globals.get('_run');
    }).catch((err) => { postMessage({ type: 'loadError', error: String(err) }); });
    self.onmessage = async (e) => {
      const runTests = await ready;
      if (!runTests) return;
      logs = [];
      logSize = 0;
      const { code, fn, tests } = e.data;
      runTests(code, fn, JSON.stringify(tests));
      postMessage({ type: 'done', logs });
    };`;

  const workers = { js: null, py: null };
  let pyReady = false;

  function spawn(lang) {
    const src = lang === 'py' ? PY_WORKER : JS_WORKER;
    const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
    const worker = new Worker(url);
    URL.revokeObjectURL(url);
    if (lang === 'py') pyReady = false;
    return worker;
  }

  function kill(lang) {
    if (workers[lang]) workers[lang].terminate();
    workers[lang] = null;
    if (lang === 'py') pyReady = false;
  }

  /**
   * Run `code` against `tests` (each { args }). Calls hooks.onStatus(text) while loading,
   * hooks.onResult(i, { got | error, ms }) per test, and resolves with
   * { compileError, timedOut: index | null, logs }.
   */
  function run(lang, code, fn, tests, hooks = {}) {
    return new Promise((resolve) => {
      if (!workers[lang]) workers[lang] = spawn(lang);
      const worker = workers[lang];
      let next = 0;
      let watchdog = 0;
      let finished = false;
      let compileError = null;
      const LOAD_FAILED = 'Couldn\'t load Python. Check your connection and try again.';

      const finish = (outcome) => {
        if (finished) return;
        finished = true;
        clearTimeout(watchdog);
        worker.onmessage = null;
        worker.onerror = null;
        resolve(outcome);
      };
      // Each test gets its own time limit; a test that runs past it is reported and the worker is replaced
      const arm = () => {
        clearTimeout(watchdog);
        watchdog = setTimeout(() => {
          kill(lang);
          finish({ compileError: null, timedOut: next, logs: [] });
        }, LIMIT_MS[lang]);
      };

      worker.onmessage = (e) => {
        const msg = e.data;
        if (msg.type === 'ready') { pyReady = true; hooks.onStatus && hooks.onStatus('Running…'); arm(); }
        else if (msg.type === 'loadError') { kill(lang); finish({ compileError: LOAD_FAILED, timedOut: null, logs: [] }); }
        else if (msg.type === 'compile') {
          compileError = msg.error;
          if (compileError) clearTimeout(watchdog); else arm();
          hooks.onCompile && hooks.onCompile(compileError);
        }
        else if (msg.type === 'result') { next = msg.i + 1; hooks.onResult && hooks.onResult(msg.i, msg); arm(); }
        else if (msg.type === 'done') finish({ compileError, timedOut: null, logs: msg.logs || [] });
      };
      worker.onerror = (e) => {
        e.preventDefault();
        const loading = lang === 'py' && !pyReady;
        kill(lang);
        finish({ compileError: loading ? LOAD_FAILED : e.message || 'The code runner crashed.', timedOut: null, logs: [] });
      };

      if (lang === 'py' && !pyReady) {
        hooks.onStatus && hooks.onStatus('Loading Python (about 12 MB the first time, then cached)…');
        // Give the first download plenty of time, but don't spin forever on a dead connection
        watchdog = setTimeout(() => { kill(lang); finish({ compileError: LOAD_FAILED, timedOut: null, logs: [] }); }, 90000);
      } else {
        hooks.onStatus && hooks.onStatus('Running…');
        arm();
      }
      worker.postMessage({ code, fn, tests: tests.map((t) => ({ args: t.args })) });
    });
  }

  return { run, LIMIT_MS };
})();
