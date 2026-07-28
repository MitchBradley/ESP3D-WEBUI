var statuspage = 0;
var statuscontent = "";
//status dialog
function statusdlg() {
    var modal = setactiveModal('statusdlg.html');
    if (modal == null) return;
    showModal();
    refreshstatus();
    update_btn_status(0);
}

function next_status() {
    var modal = getactiveModal();
    var text = modal.element.getElementsByClassName("modal-text")[0];
    if (statuspage == 0) {
        text.innerHTML = statuscontent;
    } else {
        text.innerHTML = "<table><tr><td width='auto' style='vertical-align:top;'><label translate>Browser:</label></td><td>&nbsp;</td><td width='100%'><span class='text-info'><strong>" + navigator.userAgent + "</strong></span></td></tr></table>";
    }
    update_btn_status();
}

function update_btn_status(forcevalue) {
    if (typeof forcevalue !== 'undefined') {
        statuspage = forcevalue;
    }
    if (statuspage == 0) {
        statuspage = 1;
        id('next_status_btn').innerHTML = get_icon_svg("triangle-right", "1em", "1em")
    } else {
        statuspage = 0;
        id('next_status_btn').innerHTML = get_icon_svg("triangle-left", "1em", "1em")
    }
}

// [ESP420]json=yes wraps each stat as a plain {id,value} object (see
// WebCommands.cpp's showSysStatsJSON()/JSONencoder::id_value_object())
// instead of a "Label: value" text line -- no more hand-splitting on ":"
// and " (" to tell a label from a value that might itself contain either.
function statussuccess(response) {
    displayBlock('refreshstatusbtn');
    displayNone('status_loader');
    var modal = getactiveModal();
    if (modal == null) return;
    var text = modal.element.getElementsByClassName("modal-text")[0];
    statuscontent = "";
    try {
        var jsonResponse = JSON.parse(response);
        if (jsonResponse.cmd != 420 || jsonResponse.status == "error" || typeof jsonResponse.data == 'undefined') {
            statusfailed(0, response);
            return;
        }
        for (var i = 0; i < jsonResponse.data.length; i++) {
            statuscontent += "<label>" + translate_text_item(jsonResponse.data[i].id) + ": </label>&nbsp;<span class='text-info'><strong>";
            statuscontent += translate_text_item(jsonResponse.data[i].value);
            statuscontent += "</strong></span><br>";
        }
    } catch (e) {
        console.error("Parsing error:", e);
        statusfailed(0, response);
        return;
    }
    statuscontent += "<label>" + translate_text_item("WebUI version") + ": </label>&nbsp;<span class='text-info'><strong>";
    statuscontent += web_ui_version
    statuscontent += "</strong></span><br>";
    text.innerHTML = statuscontent;
    update_btn_status(0);
    //console.log(response);
}

function statusfailed(errorcode, response) {
    displayBlock('refreshstatusbtn');
    displayNone('status_loader');
    displayBlock('status_msg');
    console.log("Error " + errorcode + " : " + response);
    id('status_msg').innerHTML = "Error " + errorcode + " : " + response;
}

function refreshstatus() {
    displayNone('refreshstatusbtn');
    displayBlock('status_loader');
    var modal = getactiveModal();
    if (modal == null) return;
    var text = modal.element.getElementsByClassName("modal-text")[0];
    text.innerHTML = "";
    displayNone('status_msg');
    firmwareCommand("[ESP420]json=yes", statussuccess, statusfailed);
}
