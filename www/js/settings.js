var scl = []; // setting_configList
var setting_error_msg = "";
var setting_lasti = -1;
var setting_lastj = -1;
var current_setting_filter = 'nvs';
var setup_is_done = false;
var do_not_build_settings = false;

function refreshSettings(hide_setting_list) {
    do_not_build_settings = typeof hide_setting_list == 'undefined' ?false : !hide_setting_list;

    displayBlock('settings_loader');
    displayNone('settings_list_content');
    displayNone('settings_status');
    displayNone('settings_refresh_btn');

    scl = [];
    // ProcessGetHttp already fires getESPsettingsfailed(503, "Communication
    // locked!") when http_communication_locked is set -- no need to
    // pre-check and short-circuit here too.
    firmwareCommand("[ESP400]json=yes", getESPsettingsSuccess, getESPsettingsfailed);
}

function defval(i) {
    return scl[i].defaultvalue;
}

function build_select_flag_for_setting_list(i, j) {
    var html = "";
    var flag =
        html += "<select class='form-control' id='setting_" + i + "_" + j + "' onchange='setting_checkchange(" + i + "," + j + ")' >";
    html += "<option value='1'";
    var tmp = scl[i].defaultvalue;
    tmp |= getFlag(i, j);
    if (tmp == defval(i)) html += " selected ";
    html += ">";
    html += translate_text_item("Disable", true);
    html += "</option>\n";
    html += "<option value='0'";
    var tmp = defval(i);
    tmp &= ~(getFlag(i, j));
    if (tmp == defval(i)) html += " selected ";
    html += ">";
    html += translate_text_item("Enable", true);
    html += "</option>\n";
    html += "</select>\n";
    //console.log("default:" + defval(i));
    //console.log(html);
    return html;
}

function build_select_for_setting_list(i, j) {
    var html = "<select class='form-control input-min wauto' id='setting_" + i + "_" + j + "' onchange='setting_checkchange(" + i + "," + j + ")' >";
    for (var oi = 0; oi < scl[i].Options.length; oi++) {
        html += "<option value='" + scl[i].Options[oi].id + "'";
        if (scl[i].Options[oi].id == defval(i)) html += " selected ";
        html += ">";
        html += translate_text_item(scl[i].Options[oi].display, true);
        //Ugly workaround for OSX Chrome and Safari
        if (browser_is("MacOSX")) html += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
        html += "</option>\n";
    }
    html += "</select>\n";
    //console.log("default:" + defval(i));
    //console.log(html);
    return html;
}

//to generate setting editor in setting or setup
function build_control_from_index(i, extra_set_function) {
    var content = "<table>";
    if (i < scl.length) {
        nbsub = scl[i].type == "F" ? scl[i].Options.length : 1;
        for (var j = 0; j < nbsub; j++) {
            if (j > 0) {
                content += "<tr><td style='height:10px;'></td></tr>";
            }
            content += "<tr><td style='vertical-align: middle;'>";
            if (scl[i].type == "F") {
                content += translate_text_item(scl[i].Options[j].display, true);
                content += "</td><td>&nbsp;</td><td>";
            }

            content += "<div id='status_setting_" + i + "_" + j + "' class='form-group has-feedback' style='margin: auto;'>";
            content += "<div class='item-flex-row'>";
            content += "<table><tr><td>";
            content += "<div class='input-group'>";
            content += "<div class='input-group-btn'>";
            // setting_revert_to_default() does not work for FluidNC, which cannot report default values
            // content += "<button class='btn btn-default btn-svg' onclick='setting_revert_to_default(" + i + "," + j + ")' >";
            // content += get_icon_svg("repeat");
            // content += "</button>";
            content += "</div>";
            content += "<input class='hide_it'></input>";
            content += "</div>";
            content += "</td><td>";
            content += "<div class='input-group'>";
            content += "<span class='input-group-addon hide_it' ></span>";
            if (scl[i].type == "F") {
                //flag
                //console.log(scl[i].label + " " + scl[i].type);
                //console.log(scl[i].Options.length);
                content += build_select_flag_for_setting_list(i, j);
            } else if (scl[i].Options.length > 0) {
                //drop list
                content += build_select_for_setting_list(i, j);
            } else {
                //text
                input_type = defval(i).startsWith("******") ? "password" : "text";
                content += "<form><input autocomplete='off' id='setting_" + i + "_" + j + "' type='" + input_type + "' class='form-control input-min'  value='" + defval(i) + "' onkeyup='setting_checkchange(" + i + "," + j + ")' ></form>";
            }
            content += "<span id='icon_setting_" + i + "_" + j + "'class='form-control-feedback ico_feedback'></span>";
            content += "<span class='input-group-addon hide_it' ></span>";
            content += "</div>";
            content += "</td></tr></table>";
            content += "<div class='input-group'>";
            content += "<input class='hide_it'></input>";
            content += "<div class='input-group-btn'>";
            content += "<button  id='btn_setting_" + i + "_" + j + "' class='btn btn-default' onclick='settingsetvalue(" + i + "," + j + ");";
            if (typeof extra_set_function != 'undefined') {
                content += extra_set_function + "(" + i + ");"
            }
            content += "' translate english_content='Set' >" + translate_text_item("Set") + "</button>";
            if (scl[i].pos == EP_STA_SSID) {
                content += "<button class='btn btn-default btn-svg' onclick='scanwifidlg(\"" + i + "\",\"" + j + "\")'>";
                content += get_icon_svg("search");
                content += "</button>";
            }
            content += "</div>";
            content += "</div>";
            content += "</div>";
            content += "</div>";
            content += "</td></tr>";
        }
    }
    content += "</table>";
    return content;
}

//get setting UI for specific component instead of parse all   
function get_index_from_eeprom_pos(pos) {
    for (var i = 0; i < scl.length; i++) {
        if (pos == scl[i].pos) {
            return i;
        }
    }
    return -1;
}

function build_control_from_pos(pos, extra) {
    return build_control_from_index(get_index_from_eeprom_pos(pos), extra);
}

// "nvs"/"tree" are this dialog's own filter keys (also used to build the
// "<filter>_setting_filter" radio id below) -- they predate FluidNC and
// don't match its actual category strings, which come straight from
// listSettingsJSON()'s j.setCategory("Flash/Settings")/("Running/Config")
// (WebCommands.cpp). Map to those before comparing against scl[i].F.
var SETTING_FILTER_CATEGORY = { nvs: "flash/settings", tree: "running/config" };

function build_HTML_setting_list(filter) {
    //this to prevent concurent process to update after we clean content
    if (do_not_build_settings) return;
    var content = "";
    current_setting_filter = filter;
    id(current_setting_filter + "_setting_filter").checked = true;
    var category = SETTING_FILTER_CATEGORY[filter] || filter;

    for (var i = 0; i < scl.length; i++) {
        fname = scl[i].F.trim().toLowerCase();
        if (fname == 'network' || fname == category || filter == "all" ) {
            content += "<tr>";
            content += "<td style='vertical-align:middle'>";
            content += translate_text_item(scl[i].label, true);
            content += "</td>";
            content += "<td style='vertical-align:middle'>";
            content += "<table><tr><td>" + build_control_from_index(i) + "</td></tr></table>";
            content += "</td>";
            content += "</tr>\n";
        }
    }
    id('settings_list_data').innerHTML = content;
}

function setting_check_value(value, i) {
    var valid = true;
    var entry = scl[i];
    //console.log("checking value");
    if (entry.type == "F") return valid;
    //does it part of a list?
    if (entry.Options.length > 0) {
        var in_list = false;
        for (var oi = 0; oi < entry.Options.length; oi++) {
            //console.log("checking *" + entry.Options[oi].id + "* and *"+ value + "*" );
            if (entry.Options[oi].id == value) in_list = true;
        }
        valid = in_list;
        if (!valid) setting_error_msg = " in provided list";
    }
    //check byte / integer
    if (entry.type == "B" || entry.type == "I") {
        //cannot be empty
        value.trim();
        if (value.length == 0) valid = false;
        //check minimum?
        if (parseInt(entry.min_val) > parseInt(value)) valid = false;
        //check maximum?
        if (parseInt(entry.max_val) < parseInt(value)) valid = false;
        if (!valid) setting_error_msg = " between " + entry.min_val + " and " + entry.max_val;
        if (isNaN(value)) valid = false;
    } else if (entry.type == "S") {
        if (entry.min_val > value.length) valid = false;
        if (entry.max_val < value.length) valid = false;
        if (value == "********") valid = false;
        if (!valid) setting_error_msg = " between " + entry.min_val + " char(s) and " + entry.max_val + " char(s) long, and not '********'";
    } else if (entry.type == "A") {
        //check ip address
        var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!value.match(ipformat)) {
            valid = false;
            setting_error_msg = " a valid IP format (xxx.xxx.xxx.xxx)";
        }
    }
    return valid;
}

// [ESP400]json=yes wraps the same per-entry shape (F/P/H/T/V/M/S/O, still
// handled unchanged by create_setting_entry/is_setting_entry below) in
// {cmd,status,data} instead of the legacy {EEPROM:[...]} -- matches
// WebUI-mm/FigUI's ESP400Response convention (see WebUI-mm's
// src/tabs/features/index.tsx).
function process_settings_answer(response_text) {
    var result = true;
    try {
        var response = JSON.parse(response_text);
        if (response.cmd != 400 || response.status == "error" || typeof response.data == 'undefined') {
            result = false;
            console.log('No data');
        } else {
            //console.log("data has " + response.data.length + " entries");
            if (response.data.length > 0) {
                var vi = 0;
                for (var i = 0; i < response.data.length; i++) {
                    vi = create_setting_entry(response.data[i], vi);

                }
                if (vi > 0) {
                    if (setup_is_done) build_HTML_setting_list(current_setting_filter);
                } else result = false;
            } else result = false;
        }
    } catch (e) {
        console.error("Parsing error:", e);
        result = false;
    }
    return result;
}

function create_setting_entry(sentry, vi) {
    if (!is_setting_entry(sentry)) return vi;
    var slabel = sentry.H;
    var svalue = sentry.V;
    var scmd = "[ESP401]P=" + sentry.P + " T=" + sentry.T + " V=";
    var options = [];
    var min;
    var max;
    if (typeof sentry.M !== 'undefined') {
        min = sentry.M;
    } else { //add limit according the type
        if (sentry.T == "B") min = -127
        else if (sentry.T == "S") min = 0
        else if (sentry.T == "A") min = 7
        else if (sentry.T == "I") min = 0
    }
    if (typeof sentry.S !== 'undefined') {
        max = sentry.S;
    } else { //add limit according the type
        if (sentry.T == "B") max = 255;
        else if (sentry.T == "S") max = 255;
        else if (sentry.T == "A") max = 15;
        else if (sentry.T == "I") max = 2147483647;
    }
    //list possible options if defined
    if (typeof sentry.O !== 'undefined') {
        for (var i in sentry.O) {
            var key = i;
            var val = sentry.O[i];
            for (var j in val) {
                var option = {
                    id: val[j].trim(),
                    display: j.trim()
                };
                options.push(option);
                //console.log("*" + option.display + "* and *" + option.id + "*");
            }
        }
    }
    svalue = svalue.trim();
    //create entry in list
    var config_entry = {
        index: vi,
        F: sentry.F,
        label: slabel,
        defaultvalue: svalue,
        cmd: scmd,
        Options: options,
        min_val: min,
        max_val: max,
        type: sentry.T,
        pos: sentry.P
    };
    scl.push(config_entry);
    vi++;
    return vi;
}
//check it is valid entry
function is_setting_entry(sline) {
    if (typeof sline.T === 'undefined' || typeof sline.V === 'undefined' || typeof sline.P === 'undefined' || typeof sline.H === 'undefined') {
        return false
    }
    return true;
}

function getFlag(i, j) {
    var flag = 0;
    if (scl[i].type != "F") return -1;
    if (scl[i].Options.length <= j) return -1;
    flag = parseInt(scl[i].Options[j].id);
    return flag;
}

function getFlag_description(i, j) {
    if (scl[i].type != "F") return -1;
    if (scl[i].Options.length <= j) return -1;
    return scl[i].Options[j].display;
}

function setting(i,j) {
    return id('setting_' + i + "_" + j);
}
function setBtn(i, j, value) {
    id('btn_setting_' + i + "_" + j).className = "btn " + value;
}
function setStatus(i, j, value) {
    id('status_setting_' + i + "_" + j).className = "form-group " + value;
}
function setIcon(i, j, value) {
    id('icon_setting_' + i + "_" + j).className = "form-control-feedback " + value;
}
function setIconHTML(i, j, value) {
    id('icon_setting_' + i + "_" + j).innerHTML = value;
}

function setting_revert_to_default(i, j) {
    if (typeof j == 'undefined') j = 0;
    if (scl[i].type == "F") {
        var flag = getFlag(i, j);
        var enabled = 0;
        var tmp = parseInt(defval(i));
        tmp |= flag;
        if (tmp == parseInt(defval(i))) setting(i, j).value = "1";
        else setting(i,j).value = "0";
    } else setting(i, j).value = defval(i)
    setBtn(i, j, "btn-default");
    setStatus(i, j, "form-group has-feedback");
    setIconHTML(i, j, "");
}

function settingsetvalue(i, j) {
    if (typeof j == 'undefined') j = 0;
    //remove possible spaces
    value = setting(i, j).value.trim();
    //Apply flag here
    if (scl[i].type == "F") {
        var tmp = defval(i);
        if (value == "1") {
            tmp |= getFlag(i, j);
        } else {
            tmp &= ~(getFlag(i, j));
        }
        value = tmp;
    }
    if (value == defval(i)) return;
    //check validity of value
    var isvalid = setting_check_value(value, i);
    //if not valid show error
    if (!isvalid) {
        setsettingerror(i);
        alertdlg(translate_text_item("Out of range"), translate_text_item("Value must be ") + setting_error_msg + " !");
    } else {
        //value is ok save it
        var cmd = scl[i].cmd + value + " json=yes";
        setting_lasti = i;
        setting_lastj = j;
        scl[i].defaultvalue = value;
        setBtn(i, j, "btn-success");
        setIcon(i, j, "has-success ico_feedback");
        setIconHTML(i, j, get_icon_svg("ok"));
        setStatus(i, j, "has-feedback has-success");
        firmwareCommand(cmd, setESPsettingsSuccess, setESPsettingsfailed);
    }
}

function setting_checkchange(i, j) {
    //console.log("list value changed");
    var val = setting(i, j).value.trim();
    if (scl[i].type == "F") {
        //console.log("it is flag value");
        var tmp = defval(i);
        if (val == "1") {
            tmp |= getFlag(i, j);
        } else {
            tmp &= ~(getFlag(i, j));
        }
        val = tmp;
    }
    //console.log("value: " + val);
    //console.log("default value: " + defval(i));
    if (defval(i) == val) {
        console.log("values are identical");
        setBtn(i, j, "btn-default");
        setIcon(i, j, "");
        setIconHTML(i, j, "");
        setStatus(i, j, "has-feedback");
    } else if (setting_check_value(val, i)) {
        //console.log("Check passed");
        setsettingchanged(i, j);
    } else {
        console.log("change bad");
        setsettingerror(i, j);
    }

}

function setsettingchanged(i, j) {
    setStatus(i, j, "has-feedback has-warning");
    setBtn(i, j, "btn-warning");
    setIcon(i, j, "has-warning ico_feedback");
    setIconHTML(i, j, get_icon_svg("warning-sign"));
}

function setsettingerror(i, j) {
    setBtn(i, j, "btn-danger");
    setIcon(i, j, "has-error ico_feedback");
    setIconHTML(i, j, get_icon_svg("remove"));
    setStatus(i, j, "has-feedback has-error");
}

// [ESP401]...json=yes wraps the write's outcome in {cmd,status,data}
// (data is the error message text on failure) instead of a bare "ok"/
// "error:N" line -- see WebCommands.cpp's setWebSetting()/
// send_json_command_response(). That means an HTTP-level success (a 200,
// which is all firmwareCommand's resultfn/this function actually checked
// before) no longer implies the write itself succeeded -- a rejected value
// still comes back as a 200 with status:"error" in the body, so that has
// to be checked here now.
function setESPsettingsSuccess(response) {
    try {
        var jsonResponse = JSON.parse(response);
        if (jsonResponse.cmd == 401 && jsonResponse.status == "error") {
            setESPsettingsfailed(0, jsonResponse.data);
        }
    } catch (e) {
        console.error("Parsing error:", e);
    }
}

function setESPsettingsfailed(error_code, response) {
    alertdlg(translate_text_item("Set failed"), "Error " + error_code + " :" + response);
    console.log("Error " + error_code + " :" + response);
    setBtn(setting_lasti, setting_lastj, "btn-danger");
    id('icon_setting_' + setting_lasti + "_" + setting_lastj).className = "form-control-feedback has-error ico_feedback";
    id('icon_setting_' + setting_lasti + "_" + setting_lastj).innerHTML = get_icon_svg("remove");
    setStatus(setting_lasti, setting_lastj, "has-feedback has-error");
}

function getESPsettingsSuccess(response) {
    if (!process_settings_answer(response)) {
        getESPsettingsfailed(406, translate_text_item("Wrong data"));
        console.log(response);
        return;
    }
    displayNone('settings_loader');
    displayBlock('settings_list_content');
    displayNone('settings_status');
    displayBlock('settings_refresh_btn');
}

function getESPsettingsfailed(error_code, response) {
    console.log("Error " + error_code + " :" + response);
    displayNone('settings_loader');
    displayBlock('settings_status');
    id('settings_status').innerHTML = translate_text_item("Failed:") + error_code + " " + response;
    displayBlock('settings_refresh_btn');
}

function restart_esp() {
    confirmdlg(translate_text_item("Please Confirm"), translate_text_item("Restart FluidNC"), process_restart_esp);
}

function process_restart_esp(answer) {
    if (answer == "yes") {
        restartdlg();
    }
}

function define_esp_role(index) {
    switch (Number(defval(index))) {
        case SETTINGS_FALLBACK_MODE:
            displayBlock("setup_STA");
            displayBlock("setup_AP");
            break;
        case SETTINGS_AP_MODE:
            displayNone("setup_STA");
            displayBlock("setup_AP");
            break;
        case SETTINGS_STA_MODE:
            displayBlock("setup_STA");
            displayNone("setup_AP");
            break;
        default:
            displayNone("setup_STA");
            displayNone("setup_AP");
            break;
    }
}
function define_esp_role_from_pos(pos) {
    define_esp_role(get_index_from_eeprom_pos(pos))
}
