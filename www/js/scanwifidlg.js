var ssid_item_scanwifi = -1;
var ssid_subitem_scanwifi = -1;
//scanwifi dialog
function scanwifidlg(item, subitem) {
    var modal = setactiveModal('scanwifidlg.html', scanwifidlg_close);
    if (modal == null) return;
    ssid_item_scanwifi = item;
    ssid_subitem_scanwifi = subitem;
    showModal();
    refresh_scanwifi();
}

function refresh_scanwifi() {
    displayBlock('AP_scan_loader');
    displayNone('AP_scan_list');
    displayBlock('AP_scan_status');
    id('AP_scan_status').innerHTML = translate_text_item("Scanning");
    displayNone('refresh_scanwifi_btn');
    firmwareCommand("[ESP410]json=yes", getscanWifiSuccess, getscanWififailed);
}

// [ESP410]json=yes wraps the same per-entry shape (SSID/SIGNAL/
// IS_PROTECTED) in {cmd,status,data} instead of the legacy {AP_LIST:[...]}
// -- see WifiConfig.cpp's listAPs().
function process_scanWifi_answer(response_text) {
    var result = true;
    var content = "";
    try {
        var response = JSON.parse(response_text);
        if (response.cmd != 410 || response.status == "error" || typeof response.data == 'undefined') {
            result = false;
        } else {
            var aplist = response.data;
            //console.log("found " + aplist.length + " AP");
            aplist.sort(function(a, b) {
                return (parseInt(a.SIGNAL) < parseInt(b.SIGNAL)) ? -1 : (parseInt(a.SIGNAL) > parseInt(b.SIGNAL)) ? 1 : 0
            });
            for (var i = aplist.length - 1; i >= 0; i--) {
                content += "<tr>";
                content += "<td style='vertical-align:middle'>";
                content += aplist[i].SSID;
                content += "</td>";
                content += "<td style='text-align: center;vertical-align:middle;'>";
                content += aplist[i].SIGNAL;
                content += "%</td>";
                content += "<td style='vertical-align:middle'><center>";
                if (aplist[i].IS_PROTECTED == "1") content += get_icon_svg("lock");
                content += "</></td>";
                content += "<td>";
                content += "<button class='btn btn-primary' onclick='select_ap_ssid(\"" + aplist[i].SSID.replace("'","\\'").replace("\"","\\\"") + "\");'>";
                content += get_icon_svg("ok");
                content += "</button>";
                content += "</td>";
                content += "</tr>";
            }
        }
    } catch (e) {
        console.error("Parsing error:", e);
        result = false;
    }
    id('AP_scan_data').innerHTML = content;
    return result;
}

function select_ap_ssid(ssid_name) {
    var val = id("setting_" + ssid_item_scanwifi + "_" + ssid_subitem_scanwifi).value;
    id("setting_" + ssid_item_scanwifi + "_" + ssid_subitem_scanwifi).value = ssid_name;
    id("setting_" + ssid_item_scanwifi + "_" + ssid_subitem_scanwifi).focus();
    if (val != ssid_name)setsettingchanged(ssid_item_scanwifi, ssid_subitem_scanwifi);
    closeModal("Ok");
}

function getscanWifiSuccess(response) {
    if (!process_scanWifi_answer(response)) {
        getscanWififailed(406, translate_text_item("Wrong data"));
        return;
    }
    displayNone('AP_scan_loader');
    displayBlock('AP_scan_list');
    displayNone('AP_scan_status');
    displayBlock('refresh_scanwifi_btn');
}

function getscanWififailed(error_code, response) {
    console.log("Error " + error_code + " :" + response);
    displayNone('AP_scan_loader');
    displayBlock('AP_scan_status');
    id('AP_scan_status').innerHTML = translate_text_item("Failed:") + error_code + " " + response;
    displayBlock('refresh_scanwifi_btn');
}

function scanwifidlg_close(response) {
    //console.log(response);
}
