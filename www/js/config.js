var config_configList = [];
var config_override_List = [];
var config_lastindex = -1
var config_error_msg = "";
var config_lastindex_is_override = false;
var commandtxt = "$$";
var is_override_config = false;
var config_file_name = "/sd/config";


function refreshconfig(is_override) {
    if (http_communication_locked) {
        id('config_status').innerHTML = translate_text_item("Communication locked by another process, retry later.");
        return;
    }
    is_override_config = false;
    if ((typeof is_override != 'undefined') && is_override) is_override_config = is_override;
    config_display_override(is_override_config);
    displayBlock('config_loader');
    displayNone('config_list_content');
    displayNone('config_status');
    displayNone('config_refresh_btn');
    if (!is_override) config_configList = [];
    config_override_List = [];
    getprinterconfig(is_override_config);
}

function config_display_override(display_it) {
    if (display_it) {
        displayBlock('config_overrdisplayBlocke_list_content');
        displayNone('config_main_content');
        id('config_override_file').checked = true;
    } else {
        id('config_overrdisplayNonee_list_content');
        displayBlock('config_main_content');
        id('config_main_file').checked = true;
    }
}

function getprinterconfig(is_override) {
    if ((typeof is_override != 'undefined') && is_override) {
        config_override_List = [];
        is_override_config = true;
    } else is_override_config = false;
    var url = "/command?plain=" + encodeURIComponent(commandtxt);
    SendGetHttp(url);
}

function build_HTML_config_list() {
    var content = "";
    var array_len = config_configList.length;
    if (is_override_config) array_len = config_override_List.length;
    for (var i = 0; i < array_len; i++) {
        var item;
        var prefix = "";
        if (is_override_config) {
            item = config_override_List[i];
            prefix = "_override"
        } else item = config_configList[i];
        content += "<tr>";
        if (item.showcomment) {
            content += "<td colspan='3' class='info'>";
            content += item.comment;
        } else {
            content += "<td style='vertical-align:middle'>";
            content += item.label;
            content += "</td>";
            content += "<td style='vertical-align:middle;'>";
            content += "<table><tr><td>"
            content += "<div id='status_config_" + prefix + i + "' class='form-group has-feedback' style='margin: auto;'>";
            content += "<div class='item-flex-row'>";
            content += "<table><tr><td>";
            content += "<div class='input-group'>";
            content += "<span class='input-group-btn'>";
            content += "<button class='btn btn-default btn-svg' onclick='config_revert_to_default(" + i + "," + is_override_config + ")' >";
            content += get_icon_svg("repeat");
            content += "</button>";
            content += "</span>";
            content += "<input class='hide_it'></input>";
            content += "</div>";
            content += "</td><td>";
            content += "<div class='input-group'>";
            content += "<span class='input-group-addon hide_it' ></span>";
            content += "<input autocomplete='off' id='config_" + prefix + i + "' type='text' class='form-control' style='width:";
            content += "auto";
            content += "'  value='" + item.defaultvalue + "' onkeyup='config_checkchange(" + i + "," + is_override_config + ")' />";
            content += "<span id='icon_config_" + prefix + i + "'class='form-control-feedback ico_feedback' ></span>";
            content += "<span class='input-group-addon hide_it' ></span>";
            content += "</div>";
            content += "</td></tr></table>";
            content += "<div class='input-group'>";
            content += "<input class='hide_it'></input>";
            content += "<span class='input-group-btn'>";
            content += "<button  id='btn_config_" + prefix + i + "' class='btn btn-default' onclick='configGetvalue(" + i + "," + is_override_config + ")' translate english_content='Set' >" + translate_text_item("Set") + "</button>&nbsp;";
            content += "</span>";
            content += "</div>";
            content += "</div>";
            content += "</div>";
            content += "</td></tr></table>";
            content += "</td>";
            content += "<td style='vertical-align:middle'>";
            content += item.help;
        }
        content += "</td>";
        content += "</tr>\n";
    }
    if (content.length > 0) {
        id('config_list_data').innerHTML = content;
    }
    displayNone('config_loader');
    displayBlock('config_list_content');
    displayNone('config_status');
    displayBlock('config_refresh_btn');
}

function config_check_value(value, index, is_override) {
    var isvalid = true;
    if ((value.trim()[0] == '-') || (value.length === 0) || (value.toLowerCase().indexOf("#") != -1)) {
        isvalid = false;
        config_error_msg = translate_text_item("cannot have '-', '#' char or be empty");
    }
    return isvalid;
}

function process_config_answer(response_text) {
    var result = true;
    var tlines = response_text.split("\n");
    //console.log(tlines.length);
        //console.log("Config has " + tlines.length + " entries");
        var vindex = 0;
        for (var i = 0; i < tlines.length; i++) {
            vindex = create_config_entry(tlines[i], vindex);
        }
        if (vindex > 0) build_HTML_config_list();
        else result = false;

    return result;
}

function create_config_entry(sentry, vindex) {
    var iscomment;
    var ssentry = sentry;
    if (!is_config_entry(ssentry)) return vindex;
    while (ssentry.indexOf("\t") > -1) {
        ssentry = ssentry.replace("\t", " ");
    }
    while (ssentry.indexOf("  ") > -1) {
        ssentry = ssentry.replace("  ", " ");
    }
    while (ssentry.indexOf("##") > -1) {
        ssentry = ssentry.replace("##", "#");
    }

    iscomment = is_config_commented(ssentry);
    if (iscomment) {
        while (ssentry.indexOf("<") != -1) {
            var m = ssentry.replace("<", "&lt;");
            ssentry = m.replace(">", "&gt;");
        }
        var config_entry = {
            comment: ssentry,
            showcomment: true,
            index: vindex,
            label: "",
            help: "",
            defaultvalue: "",
            cmd: ""
        };
        if (is_override_config) config_override_List.push(config_entry);
        else config_configList.push(config_entry);
    } else {
        var slabel = get_config_label(ssentry);
        var svalue = get_config_value(ssentry);
        var shelp = get_config_help(ssentry);
        var scmd = get_config_command(ssentry)
        var config_entry = {
            comment: ssentry,
            showcomment: false,
            index: vindex,
            label: slabel,
            help: shelp,
            defaultvalue: svalue,
            cmd: scmd,
            is_override: is_override_config
        };
        if (is_override_config) config_override_List.push(config_entry);
        else config_configList.push(config_entry);
    }
    vindex++;
    return vindex;
}
//check it is valid entry
function is_config_entry(sline) {
    var line = sline.trim();
    if (line.length == 0) return false;
    return (line.indexOf("$") == 0) && (line.indexOf("=") != -1);
}

function get_config_label(sline) {
    var tline = sline.trim().split(" ");
    var tsize = tline.length;

    var tline2 = sline.trim().split("=");
    return tline2[0];
}

function get_config_value(sline) {
    var tline = sline.trim().split(" ");
    var tline2 = sline.trim().split("=");
    return tline2.length > 1 ? tline2[1] : "???";
}

function get_config_help(sline) {
    if (is_override_config) return "";
    return inline_help(get_config_label(sline))
}

function get_config_command(sline) {
    return get_config_label(sline) + "=";
}

function is_config_commented(sline) {
    var line = sline.trim();
    if (line.length == 0) return false;
    if (is_override_config) return line.startsWith(";");
    return false;
}

function config_revert_to_default(index, is_override) {
    var prefix = "";
    var item = config_configList[index];
    if (is_override) {
        prefix = "_override";
        item = config_override_List[index];
    }
    console.log()
    id('config_' + prefix + index).value = item.defaultvalue;
    id('btn_config_' + prefix + index).className = "btn btn-default";
    id('status_config_' + prefix + index).className = "form-group has-feedback";
    id('icon_config_' + prefix + index).innerHTML = "";
}

function is_config_override_file() {
    if (config_override_List.length > 5) {
        for (i = 0; i < 5; i++) {
            if (config_override_List[i].comment.startsWith("; No config override")) return true;
        }
    }
    return false;
}

function configGetvalue(index, is_override) {
    var prefix = "";
    var item = config_configList[index];
    if (is_override) {
        prefix = "_override";
        item = config_override_List[index];
    }
    //remove possible spaces
    value = id('config_' + prefix + index).value.trim();
    if (value == item.defaultvalue) return;
    //check validity of value
    var isvalid = config_check_value(value, index, is_override);
    //if not valid show error
    if (!isvalid) {
        id('btn_config_' + prefix + index).className = "btn btn-danger";
        id('icon_config_' + prefix + index).className = "form-control-feedback has-error ico_feedback";
        id('icon_config_' + prefix + index).innerHTML = get_icon_svg("remove");
        id('status_config_' + prefix + index).className = "form-group has-feedback has-error";
        alertdlg(translate_text_item("Out of range"), translate_text_item("Value ") + config_error_msg + " !");
    } else {
        //value is ok save it
        var cmd = item.cmd + value;
        config_lastindex = index;
        config_lastindex_is_override = is_override;
        item.defaultvalue = value;
        id('btn_config_' + prefix + index).className = "btn btn-success";
        id('icon_config_' + prefix + index).className = "form-control-feedback has-success ico_feedback";
        id('icon_config_' + prefix + index).innerHTML = get_icon_svg("ok");
        id('status_config_' + prefix + index).className = "form-group has-feedback has-success";
        var url = "/command?plain=" + encodeURIComponent(cmd);
        SendGetHttp(url, setESPconfigSuccess, setESPconfigfailed);
    }
}

function config_checkchange(index, is_override) {
    //console.log("check " + "config_"+index);
    var prefix = "";
    var item = config_configList[index];
    if (is_override) {
        prefix = "_override";
        item = config_override_List[index];
    }
    var val = id('config_' + prefix + index).value.trim();
    //console.log("value: " + val);
    if (item.defaultvalue == val) {
        id('btn_config_' + prefix + index).className = "btn btn-default";
        id('icon_config_' + prefix + index).className = "form-control-feedback";
        id('icon_config_' + prefix + index).innerHTML = "";
        id('status_config_' + prefix + index).className = "form-group has-feedback";
    } else if (config_check_value(val, index, is_override)) {
        id('status_config_' + prefix + index).className = "form-group has-feedback has-warning";
        id('btn_config_' + prefix + index).className = "btn btn-warning";
        id('icon_config_' + prefix + index).className = "form-control-feedback has-warning ico_feedback";
        id('icon_config_' + prefix + index).innerHTML = get_icon_svg("warning-sign");
        //console.log("change ok");
    } else {
        //console.log("change bad");
        id('btn_config_' + prefix + index).className = "btn btn-danger";
        id('icon_config_' + prefix + index).className = "form-control-feedback has-error ico_feedback";
        id('icon_config_' + prefix + index).innerHTML = get_icon_svg("remove");
        id('status_config_' + prefix + index).className = "form-group has-feedback has-error";
    }

}

function setESPconfigSuccess(response) {
    //console.log(response);
}
var grbl_help = {
    "$0": "Step pulse, microseconds",
    "$1": "Step idle delay, milliseconds",
    "$2": "Step port invert, mask",
    "$3": "Direction port invert, mask",
    "$4": "Step enable invert, boolean",
    "$5": "Limit pins invert, boolean",
    "$6": "Probe pin invert, boolean",
    "$10": "Status report, mask",
    "$11": "Junction deviation, mm",
    "$12": "Arc tolerance, mm",
    "$13": "Report inches, boolean",
    "$20": "Soft limits, boolean",
    "$21": "Hard limits, boolean",
    "$22": "Homing cycle, boolean",
    "$23": "Homing dir invert, mask",
    "$24": "Homing feed, mm/min",
    "$25": "Homing seek, mm/min",
    "$26": "Homing debounce, milliseconds",
    "$27": "Homing pull-off, mm",
    "$30": "Max spindle speed, RPM",
    "$31": "Min spindle speed, RPM",
    "$32": "Laser mode, boolean",
    "$100": "X steps/mm",
    "$101": "Y steps/mm",
    "$102": "Z steps/mm",
    "$103": "A steps/mm",
    "$104": "B steps/mm",
    "$105": "C steps/mm",
    "$110": "X Max rate, mm/min",
    "$111": "Y Max rate, mm/min",
    "$112": "Z Max rate, mm/min",
    "$113": "A Max rate, mm/min",
    "$114": "B Max rate, mm/min",
    "$115": "C Max rate, mm/min",
    "$120": "X Acceleration, mm/sec^2",
    "$121": "Y Acceleration, mm/sec^2",
    "$122": "Z Acceleration, mm/sec^2",
    "$123": "A Acceleration, mm/sec^2",
    "$124": "B Acceleration, mm/sec^2",
    "$125": "C Acceleration, mm/sec^2",
    "$130": "X Max travel, mm",
    "$131": "Y Max travel, mm",
    "$132": "Z Max travel, mm",
    "$133": "A Max travel, mm",
    "$134": "B Max travel, mm",
    "$135": "C Max travel, mm"

};

function inline_help(label) {
    var shelp = "";
    shelp = grbl_help[label];
    if (typeof shelp === 'undefined') shelp = "";
    return translate_text_item(shelp);
}

function setESPconfigfailed(error_code, response) {
    alertdlg(translate_text_item("Set failed"), "Error " + error_code + " :" + response);
    console.log("Error " + error_code + " :" + response);
    var prefix = "";
    if (config_lastindex_is_override) prefix = "_override";
    id('btn_config_' + prefix + config_lastindex).className = "btn btn-danger";
    id('icon_config_' + prefix + config_lastindex).className = "form-control-feedback has-error ico_feedback";
    id('icon_config_' + prefix + config_lastindex).innerHTML = get_icon_svg("remove");
    id('status_config_' + prefix + config_lastindex).className = "form-group has-feedback has-error";
}

function getESPconfigSuccess(response) {
    //console.log(response);
    if (!process_config_answer(response)) {
        getESPconfigfailed(406, translate_text_item("Wrong data"));
        displayNone('config_loader');
        displayBlock('config_list_content');
        displayNone('config_status');
        displayBlock('config_refresh_btn');
        return;
    }
}

function getESPconfigfailed(error_code, response) {
    console.log("Error " + error_code + " :" + response);
    displayNone('config_loader');
    displayBlock('config_status');
    id('config_status').innerHTML = translate_text_item("Failed:") + error_code + " " + response;
    displayBlock('config_refresh_btn');
}
