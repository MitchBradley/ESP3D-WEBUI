// FluidNC WASM demo bridge for the three transport gateways
// (firmwareCommand, SendPrinterCommand, and filetransport.js's functions)
// plus ws_source's WebSocket -- see FluidNC/wasm/README.md. Talks to the
// running WASM instance's ShimChannel over window.postMessage instead of
// real HTTP/WS -- the same protocol WebUI-mm's wasmBridgeTransport.ts and
// FigUI's shimTransport.ts speak (demo/index.html doesn't care which WebUI
// is loaded in its iframe).
//
// Gated entirely on a runtime marker (__FLUIDNC_WASM_BRIDGE__, injected by
// demo/index.html ahead of the page content) so a stock production build
// works unmodified when loaded in the demo -- everything in this file is a
// no-op otherwise.
//
// Unlike WebUI-mm/FigUI, this app has two real transports on real
// hardware, not one: HTTP (firmwareCommand/SendPrinterCommand/file ops)
// for sending, and a persistent WebSocket (ws_source, app.js's
// startSocket()) for receiving streamed G-code/status responses -- for a
// non-ESP command, SendPrinterCommand stashes the real callbacks into
// grbl_processfn/grbl_errorfn and discards the HTTP response entirely; the
// real response arrives later over ws_source, dispatched via
// grblHandleOk()/grblHandleError() (interface.js) from
// grblHandleMessage() (tablet/src/tablet/grbl.js). So besides overriding
// the three named gateways (mirroring WebUI-mm's pattern of swapping a
// dedicated transport function), this also installs a WasmBridgeWebSocket
// as window.WebSocket (mirroring FigUI's pattern, used where there's no
// dedicated seam to swap) so ws_source works transparently and all of
// app.js/interface.js/grbl.js stay completely stock.
(function () {
    if (typeof window === "undefined" || window.__FLUIDNC_WASM_BRIDGE__ !== true) {
        return;
    }

    // ── low level: postMessage <-> ShimChannel plumbing ────────────────
    // (same protocol as WebUI-mm's wasmBridgeTransport.ts / FigUI's
    // shimTransport.ts. Line buffering and [JSON:...] reassembly -- see
    // FluidNC's JSONencoder -- used to be reimplemented independently in
    // each of the three bridges; demo/index.html now does that once,
    // upstream of all of them, and just hands out whole, already-unwrapped
    // lines via 'fluidnc-shim-line'.)

    var shimLineListeners = [];
    var pendingFsRequests = {};
    var nextFsRequestId = 1;
    var pendingShimCommands = {};
    var nextShimCommandId = 1;

    function notifyShimLineListeners(line, isJson) {
        for (var i = 0; i < shimLineListeners.length; i++) {
            shimLineListeners[i](line, isJson);
        }
    }

    window.addEventListener("message", function (event) {
        // The demo page is the only legitimate sender. Checking event.source
        // === window.parent/window.top would be the obvious authenticity
        // check, but in practice event.source is unreliable here (observed
        // mismatching both even for messages genuinely posted by the parent,
        // possibly related to how the wasm module's MAIN_THREAD_EM_ASM
        // proxying or the blob: iframe's realm interacts with postMessage's
        // source attribution) -- so this just checks the message shape
        // instead. Not a real security boundary anyway: this only ever runs
        // inside demo/index.html's own sandboxed iframe.
        var msg = event.data;
        if (!msg) return;
        if (msg.type === "fluidnc-shim-line" && typeof msg.line === "string") {
            notifyShimLineListeners(msg.line, !!msg.isJson);
        } else if (msg.type === "fluidnc-shim-command-response" && typeof msg.id === "number") {
            var pendingCmd = pendingShimCommands[msg.id];
            if (!pendingCmd) return;
            delete pendingShimCommands[msg.id];
            if (msg.ok) {
                if (pendingCmd.successfn) pendingCmd.successfn(msg.response);
            } else {
                if (pendingCmd.errorfn) pendingCmd.errorfn(0, msg.ackLine);
            }
        } else if (msg.type === "fluidnc-fs-response" && typeof msg.id === "number") {
            var pending = pendingFsRequests[msg.id];
            if (!pending) return;
            delete pendingFsRequests[msg.id];
            if (msg.ok) pending.resolve(msg.result);
            else pending.reject(new Error(typeof msg.result === "string" ? msg.result : "File operation failed"));
        }
    });

    // window.top rather than window.parent: this demo only ever nests the
    // WebUI one level deep, so the two should be identical, but in testing
    // window.parent was observed to silently start pointing at something
    // else part-way through a session (postMessage undefined on it, even
    // though window.top kept working) -- root cause unconfirmed, but
    // window.top has been reliable throughout, so it's the safer target.
    function sendToShim(text) {
        window.top.postMessage({ type: "fluidnc-shim-send", text: text }, "*");
    }

    // isJson is true exactly when `line` is a fully reassembled [JSON:...]
    // payload (brackets already stripped, chunks concatenated).
    function addShimLineListener(fn) {
        shimLineListeners.push(fn);
        return function () {
            var i = shimLineListeners.indexOf(fn);
            if (i >= 0) shimLineListeners.splice(i, 1);
        };
    }

    // root is "native_sd" or "native_localfs"; path is POSIX-absolute-style
    // ("/", "/sub/file.nc"), matching demo/index.html's handleFsRequest()
    // (and the C++ fluidnc_fs_* bridge functions it calls).
    function fsRequest(op, params) {
        return new Promise(function (resolve, reject) {
            var id = nextFsRequestId++;
            pendingFsRequests[id] = { resolve: resolve, reject: reject };
            var msg = { type: "fluidnc-fs-request", id: id, op: op };
            for (var key in params) {
                if (Object.prototype.hasOwnProperty.call(params, key)) msg[key] = params[key];
            }
            window.top.postMessage(msg, "*");
        });
    }

    // ── gateways 1+2: firmwareCommand() / SendPrinterCommand() ─────────

    // Matches the real firmware's plain [ESP800] response shape exactly
    // (see WifiConfig.cpp's showFwInfo()) -- that handler isn't compiled
    // into the WASM build (WebUI/ is excluded -- see platformio.ini's
    // [env:wasm] build_src_filter), and connectdlg.js's getFWdata() only
    // needs the capability-discovery fields, not live device state.
    // Field positions matter: getFWdata() indexes tlist[0]/[1]/[3]/[4]/
    // [6]/[7]/[8] after splitting on "#", so the (unread) tlist[2] "FW HW"
    // segment still has to be present to keep everything after it aligned.
    var FAKE_ESP800_RESPONSE = [
        "FW version:FluidNC v4.0.3 (wasm-demo)",
        "FW target:grbl-embedded",
        "FW HW:Direct SD",
        "primary sd:/sd/",
        "secondary sd:none",
        "authentication:no",
        "webcommunication:Sync:81:127.0.0.1",
        "hostname:fluidnc-wasm-demo",
        "axis:3",
    ].join("#");

    // Sends a command and waits for its terminating "ok"/"error:N" line
    // (the grbl-protocol ACK/NACK, not part of the payload -- see
    // Command.ts's appendLine() in WebUI-mm for the same idea), including
    // any [JSON:...] reassembly -- all done centrally by demo/index.html's
    // 'fluidnc-shim-command' handler now, which also queues concurrent
    // commands instead of letting their response lines cross-attribute (see
    // its comment for why that matters over the bridge's one shared
    // channel). Used for both firmwareCommand() (always synchronous) and
    // SendPrinterCommand()'s ESP-branch (also synchronous over real HTTP,
    // so also synchronous here).
    function sendShimCommand(cmd, successfn, errorfn) {
        var id = nextShimCommandId++;
        pendingShimCommands[id] = { successfn: successfn, errorfn: errorfn };
        window.top.postMessage({ type: "fluidnc-shim-command", id: id, cmd: cmd }, "*");
    }

    window.firmwareCommand = function (cmd, successfn, errorfn) {
        if (cmd === "[ESP800]") {
            if (successfn) successfn(FAKE_ESP800_RESPONSE);
            return;
        }
        sendShimCommand(cmd, successfn, errorfn);
    };

    window.SendPrinterCommand = function (cmd, echo_on, processfn, errorfn, id, max_id, extra_arg) {
        var push_cmd = true;
        if (typeof echo_on !== "undefined") push_cmd = echo_on;
        if (cmd.length == 0) return;
        if (push_cmd) Monitor_output_Update("[#]" + cmd + "\n");
        if (typeof processfn === "undefined" || processfn == null) processfn = SendPrinterCommandSuccess;
        if (typeof errorfn === "undefined" || errorfn == null) errorfn = SendPrinterCommandFailed;
        if (cmd.startsWith("[ESP")) {
            sendShimCommand(cmd, processfn, errorfn);
            return;
        }
        // Real hardware discards the HTTP response for non-ESP commands --
        // the actual response streams back asynchronously over ws_source
        // instead. WasmBridgeWebSocket (installed as window.WebSocket
        // below) delivers shim output the same way stock ws_source would,
        // so all that's needed here is stashing the real callbacks the
        // same way stock SendPrinterCommand does, and getting the command
        // text into the shim.
        //
        // Sent raw, bypassing sendShimCommand()'s queue -- so a G-code line
        // sent here while an ESP command is awaiting its own ok/error could
        // in principle have that line's ack misattributed to this one, or
        // vice versa (same known, narrow gap FigUI's WasmBridgeWebSocket.ts
        // documents; not fixed here for the same reason: closing it would
        // mean holding up G-code sends behind unrelated ESP commands).
        grbl_processfn = processfn;
        grbl_errorfn = errorfn;
        sendToShim(cmd + "\n");
    };

    // ── gateway 3: filetransport.js ─────────────────────────────────────

    function bridgeRoot(volume) {
        return volume === FILE_VOLUME_SD ? "native_sd" : "native_localfs";
    }

    function bridgeJoinPath(dir, name) {
        return (dir.charAt(dir.length - 1) === "/" ? dir : dir + "/") + name;
    }

    // Real hardware's /upload and /files endpoints both return a fresh
    // directory listing after any mutation (see WebUIServer.cpp's
    // handleFileOps()) -- mirrors that by listing again once `op` settles.
    function bridgeOpThenList(volume, dir, op, successfn, errorfn) {
        var root = bridgeRoot(volume);
        op.then(function () {
            return fsRequest("list", { root: root, path: dir });
        }).then(
            function (result) {
                if (successfn) successfn(JSON.stringify(result));
            },
            function (err) {
                if (errorfn) errorfn(0, String(err));
            }
        );
    }

    window.fileList = function (volume, path, successfn, errorfn) {
        fsRequest("list", { root: bridgeRoot(volume), path: path }).then(
            function (result) {
                if (successfn) successfn(JSON.stringify(result));
            },
            function (err) {
                if (errorfn) errorfn(0, String(err));
            }
        );
    };

    window.fileCreateDir = function (volume, path, name, successfn, errorfn) {
        var root = bridgeRoot(volume);
        bridgeOpThenList(volume, path, fsRequest("mkdir", { root: root, path: bridgeJoinPath(path, name) }), successfn, errorfn);
    };

    window.fileDelete = function (volume, path, name, successfn, errorfn) {
        var root = bridgeRoot(volume);
        bridgeOpThenList(volume, path, fsRequest("delete", { root: root, path: bridgeJoinPath(path, name) }), successfn, errorfn);
    };

    window.fileDeleteDir = function (volume, path, name, successfn, errorfn) {
        var root = bridgeRoot(volume);
        bridgeOpThenList(volume, path, fsRequest("deletedir", { root: root, path: bridgeJoinPath(path, name) }), successfn, errorfn);
    };

    window.fileRename = function (volume, path, name, newname, successfn, errorfn) {
        // No fluidnc_fs_rename() bridge function exists yet -- same
        // documented gap as WebUI-mm's/FigUI's wasm bridges.
        if (errorfn) errorfn(0, "rename is not supported in the wasm demo");
    };

    function bridgeReadFileText(file) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () {
                resolve(reader.result);
            };
            reader.onerror = function () {
                reject(reader.error);
            };
            reader.readAsText(file);
        });
    }

    window.fileUpload = function (volume, path, files, progressfn, successfn, errorfn) {
        var root = bridgeRoot(volume);
        var writes = [];
        for (var i = 0; i < files.length; i++) {
            (function (file) {
                writes.push(
                    bridgeReadFileText(file).then(function (content) {
                        return fsRequest("write", { root: root, path: bridgeJoinPath(path, file.name), content: content });
                    })
                );
            })(files[i]);
        }
        Promise.all(writes)
            .then(function () {
                return fsRequest("list", { root: root, path: path });
            })
            .then(
                function (result) {
                    if (successfn) successfn(JSON.stringify(result));
                },
                function (err) {
                    if (errorfn) errorfn(0, String(err));
                }
            );
    };

    // fileDownloadUrl() has to return a URL string synchronously (callers
    // assign it straight to window.location.href, or embed it in an <a
    // href> built ahead of time), but reading a file's content over the
    // shim is inherently async and there's no real static file server
    // behind this iframe to point a plain URL at. A "javascript:" URI
    // sidesteps both problems: it's a valid, synchronously-returnable URL
    // string, and evaluating it (on assignment or click) runs real code
    // that performs the async read and triggers a real blob download.
    function bridgeDownloadViaShim(volumeCode, encPath, encName) {
        var volume = volumeCode === "s" ? FILE_VOLUME_SD : FILE_VOLUME_FLASH;
        var path = decodeURIComponent(encPath);
        var name = decodeURIComponent(encName);
        var root = bridgeRoot(volume);
        fsRequest("read", { root: root, path: bridgeJoinPath(path, name) }).then(
            function (content) {
                var blob = new Blob([content], { type: "application/octet-stream" });
                var blobUrl = URL.createObjectURL(blob);
                var anchor = document.createElement("a");
                anchor.href = blobUrl;
                anchor.download = name;
                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);
                URL.revokeObjectURL(blobUrl);
            },
            function (err) {
                alertdlg(translate_text_item("Error"), String(err));
            }
        );
    }
    window.bridgeDownloadViaShim = bridgeDownloadViaShim;

    window.fileDownloadUrl = function (volume, path, name) {
        var volumeCode = volume === FILE_VOLUME_SD ? "s" : "f";
        return "javascript:bridgeDownloadViaShim('" + volumeCode + "','" + encodeURIComponent(path) + "','" + encodeURIComponent(name) + "')";
    };

    // Unlike fileDownloadUrl(), path here is already the complete path
    // (matches fileRead()'s stock signature -- see e.g. preferencesdlg.js's
    // getpreferenceslist(), which passes preferences_file_name as one
    // complete "/preferences2.json"-style path), and the caller wants
    // content via callback, not a URL -- so this can just read directly.
    window.fileRead = function (volume, path, successfn, errorfn) {
        fsRequest("read", { root: bridgeRoot(volume), path: path }).then(
            function (content) {
                if (successfn) successfn(content);
            },
            function (err) {
                if (errorfn) errorfn(0, String(err));
            }
        );
    };

    // ── ws_source: window.WebSocket ─────────────────────────────────────

    function WasmBridgeWebSocket(url, protocols) {
        this.url = url;
        this.protocol = Array.isArray(protocols) ? protocols[0] || "" : protocols || "";
        this.readyState = WasmBridgeWebSocket.CONNECTING;
        this.binaryType = "blob";
        this.bufferedAmount = 0;
        this.extensions = "";
        this.onopen = null;
        this.onclose = null;
        this.onerror = null;
        this.onmessage = null;
        this._unsubscribe = null;
        var self = this;
        // Deferred rather than synchronous so callers that set onopen/
        // onmessage right after `new WebSocket(...)` (as startSocket()
        // does) don't miss the open event -- matches a real WebSocket's
        // inherently async connect.
        setTimeout(function () {
            self._open();
        }, 0);
    }
    WasmBridgeWebSocket.CONNECTING = 0;
    WasmBridgeWebSocket.OPEN = 1;
    WasmBridgeWebSocket.CLOSING = 2;
    WasmBridgeWebSocket.CLOSED = 3;

    WasmBridgeWebSocket.prototype._open = function () {
        this.readyState = WasmBridgeWebSocket.OPEN;
        var self = this;
        this._unsubscribe = addShimLineListener(function (line) {
            // Always delivered as an ArrayBuffer: app.js's startSocket()
            // always sets ws_source.binaryType = "arraybuffer" right after
            // construction, and onmessage's byte-scanning line reassembly
            // expects exactly that -- one "\n"-terminated line per message
            // is exactly what that loop looks for. isJson is irrelevant
            // here: whether a line came from a [JSON:...] reassembly or
            // not, ws_source consumers want the same plain text real
            // hardware's WSChannel would have sent either way.
            if (self.onmessage) {
                var bytes = new TextEncoder().encode(line + "\n");
                self.onmessage({ data: bytes.buffer });
            }
        });
        if (this.onopen) this.onopen({});
    };

    WasmBridgeWebSocket.prototype.send = function (data) {
        // Nothing in this app actually calls ws_source.send() -- all
        // commands go out via HTTP (SendPrinterCommand/firmwareCommand),
        // with responses streamed back over this socket. Implemented for
        // completeness/robustness rather than because it's exercised.
        if (this.readyState !== WasmBridgeWebSocket.OPEN) return;
        if (typeof data === "string") {
            sendToShim(data);
            return;
        }
        var bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        var chars = "";
        for (var i = 0; i < bytes.length; i++) chars += String.fromCharCode(bytes[i]);
        sendToShim(chars);
    };

    WasmBridgeWebSocket.prototype.close = function (code, reason) {
        if (this.readyState === WasmBridgeWebSocket.CLOSED) return;
        this.readyState = WasmBridgeWebSocket.CLOSED;
        if (this._unsubscribe) {
            this._unsubscribe();
            this._unsubscribe = null;
        }
        if (this.onclose) this.onclose({ code: code || 1000, reason: reason || "", wasClean: true });
    };

    window.WebSocket = WasmBridgeWebSocket;

    // app.js's check_ping() (called every 10s once ws_source has received
    // at least one message -- see startSocket()'s onmessage handler) is a
    // transport-liveness heuristic: it exists to catch a real WebSocket
    // silently dying (WiFi drop, NAT/router timeout swallowing the
    // connection without a close frame) that a real hardware target's own
    // 10s server-side PING (WebUI_Server::poll() -> WSChannels::sendPing(),
    // not compiled into the wasm build -- see platformio.ini's -<WebUI>)
    // exists to paper over between real user/report traffic. None of that
    // applies to WasmBridgeWebSocket: it's just JS object references inside
    // the same page, not a real network socket, so it cannot silently die
    // the way check_ping() is watching for -- close() is always an explicit,
    // synchronous call (see above), never a silent timeout. Rather than
    // manufacture traffic to satisfy a page-level heuristic that doesn't
    // apply here (e.g. periodic '?' status polls, which would show up as
    // real, spurious activity at the FluidNC/GCode level), this replaces
    // the heuristic itself with a no-op for exactly the transport that
    // doesn't need it -- matching how a synthetic transport should behave:
    // always live until it explicitly says otherwise.
    window.check_ping = function () {};
})();
