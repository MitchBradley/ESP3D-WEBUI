var grbl_processfn = null;
var grbl_errorfn = null;

function traceBootPrinter(stage, detail) {
    console.log("[TRACE_BOOT][printercmd] " + stage + " " + detail);
    if (typeof sendTraceToServer === 'function') sendTraceToServer('[TRACE_BOOT][printercmd]', stage, detail);
}

function noop() {}
function SendPrinterCommand(cmd, echo_on, processfn, errorfn, id, max_id, extra_arg) {
    var url = "/command?commandText=";
    var push_cmd = true;
    if (typeof echo_on !== 'undefined') {
        push_cmd = echo_on;
    }
    if (cmd.length == 0) return;
    if (cmd == '?' || cmd.indexOf('$Report/Interval') === 0) {
        traceBootPrinter("send", "cmd=" + cmd + " id=" + id + " max_id=" + max_id + " extra=" + extra_arg);
    }
    if (push_cmd) Monitor_output_Update("[#]" + cmd + "\n");
    //removeIf(production)
    traceBootPrinter("dev_stub", "SendPrinterCommand returning test response for " + cmd);
    console.log(cmd);
    if (typeof processfn !== 'undefined') processfn("Test response");
    else SendPrinterCommandSuccess("Test response");
    return;
    //endRemoveIf(production)
    if (typeof processfn === 'undefined' || processfn == null) processfn = SendPrinterCommandSuccess;
    if (typeof errorfn === 'undefined' || errorfn == null) errorfn = SendPrinterCommandFailed;
    if (!cmd.startsWith("[ESP")) {
        grbl_processfn = processfn;
        grbl_errorfn = errorfn;
        processfn = noop;
        errorfn = noop;
    }
    cmd = encodeURI(cmd);
    cmd = cmd.replace("#", "%23");
    if (extra_arg) {
        cmd += "&" + extra_arg;
    }
    if (cmd == '%3F' || cmd.indexOf('$Report/Interval') === 0) {
        traceBootPrinter("http", url + cmd);
    }
    SendGetHttp(url + cmd, processfn, errorfn, id, max_id);
    //console.log(cmd);
}

function SendPrinterCommandSuccess(response) {
}

function SendPrinterCommandFailed(error_code, response) {
    traceBootPrinter("error", "code=" + error_code + " response=" + decode_entitie(response));
    if (error_code == 0) {
        Monitor_output_Update(translate_text_item("Connection error") + "\n");
    } else {
         Monitor_output_Update(translate_text_item("Error : ") + error_code + " :" + decode_entitie(response) + "\n");
    }
    console.log("printer cmd Error " + error_code + " :" + decode_entitie(response));
}
