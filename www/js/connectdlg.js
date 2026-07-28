//Connect dialog
function connectdlg(getFw) {
    var modal = setactiveModal('connectdlg.html');
    var get_FW = true;
    if (modal == null) return;
    showModal();
    if (typeof getFw != 'undefined') get_FW = getFw;
    if (get_FW) retryconnect();
}

// [ESP800]json=yes wraps the same fields the legacy "FW version:... #
// FW target:... # ..." plain-text response carried in {cmd,status,data}
// instead -- see WifiConfig.cpp's showFwInfoJSON()/FwInfo.cpp's wasm
// equivalent. "primary sd"/"secondary sd" have no JSON counterpart, but
// nothing downstream ever actually reads primary_sd/secondary_sd (dead
// vars even in the plain-text version), so they're just dropped here
// rather than force-mapped from something that doesn't exist.
function getFWdata(response) {
    var parsed;
    try {
        parsed = JSON.parse(response);
    } catch (e) {
        return false;
    }
    if (parsed.cmd != 800 || parsed.status == "error" || typeof parsed.data == 'undefined') {
        return false;
    }
    var data = parsed.data;
    fw_version = (data.FWVersion || "").toLowerCase().trim();
    target_firmware = (data.FWTarget || "").toLowerCase().trim();

    async_webcommunication = data.WebCommunication == "Asynchronous";
    if (!async_webcommunication) {
        websocket_port = data.WebSocketPort;
        websocket_ip = data.WebSocketIP || document.location.hostname;
    }
    esp_hostname = data.HostName || "";
    if (typeof data.Axisletters == "string") {
        grblaxis = data.Axisletters.length;
    }

    if (async_webcommunication) {
        if (!!window.EventSource) {
            event_source = new EventSource('/events');
            event_source.addEventListener('InitID', Init_events, false);
            event_source.addEventListener('ActiveID', ActiveID_events, false);
            event_source.addEventListener('DHT', DHT_events, false);
        }
    }
    startSocket();

    return true;
}

function connectsuccess(response) {
    if (getFWdata(response)) {
        console.log("Fw identification:" + response);
        initUI();
    } else {
        console.log(response);
        connectfailed(406, "Wrong data");
    }
}

function connectfailed(errorcode, response) {
    displayBlock('connectbtn');
    displayBlock('failed_connect_msg');
    displayNone('connecting_msg');
    console.log("Fw identification error " + errorcode + " : " + response);
}

function retryconnect() {
    displayNone('connectbtn');
    displayNone('failed_connect_msg');
    displayBlock('connecting_msg');
    firmwareCommand("[ESP800]json=yes", connectsuccess, connectfailed);
}
