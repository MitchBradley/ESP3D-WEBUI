//Preferences dialog
var preferenceslist = [];
var language_save = language;
var default_preferenceslist = [];
var defaultpreferenceslist = "[{\
                                            \"language\":\"en\",\
                                            \"enable_lock_UI\":\"false\",\
                                            \"enable_ping\":\"true\",\
                                            \"enable_DHT\":\"false\",\
                                            \"enable_camera\":\"false\",\
                                            \"auto_load_camera\":\"false\",\
                                            \"camera_address\":\"\",\
                                            \"enable_redundant\":\"false\",\
                                            \"enable_probe\":\"false\",\
                                            \"enable_control_panel\":\"true\",\
                                            \"enable_grbl_panel\":\"false\",\
                                            \"autoreport_interval\":\"50\",\
                                            \"interval_positions\":\"3\",\
                                            \"interval_status\":\"3\",\
                                            \"xy_feedrate\":\"1000\",\
                                            \"z_feedrate\":\"100\",\
                                            \"a_feedrate\":\"100\",\
                                            \"b_feedrate\":\"100\",\
                                            \"c_feedrate\":\"100\",\
                                            \"e_feedrate\":\"400\",\
                                            \"e_distance\":\"5\",\
                                            \"f_filters\":\"gco;gcode\",\
                                            \"enable_files_panel\":\"true\",\
                                            \"has_TFT_SD\":\"false\",\
                                            \"has_TFT_USB\":\"false\",\
                                            \"enable_commands_panel\":\"true\",\
                                            \"enable_autoscroll\":\"true\",\
                                            \"enable_verbose_mode\":\"true\",\
                                            \"enable_grbl_probe_panel\":\"false\",\
                                            \"probemaxtravel\":\"40\",\
                                            \"probefeedrate\":\"100\",\
                                            \"proberetract\":\"1.0\",\
                                            \"probetouchplatethickness\":\"0.5\"\
                                            }]";
var fallback_preferences_file_name = '/preferences.json';
var preferences_file_name = '/preferences2.json';

function initpreferences() {
    defaultpreferenceslist = "[{\
                                            \"language\":\"en\",\
                                            \"enable_lock_UI\":\"false\",\
                                            \"enable_ping\":\"true\",\
                                            \"enable_DHT\":\"false\",\
                                            \"enable_camera\":\"false\",\
                                            \"auto_load_camera\":\"false\",\
                                            \"camera_address\":\"\",\
                                            \"number_extruders\":\"1\",\
                                            \"is_mixed_extruder\":\"false\",\
                                            \"enable_redundant\":\"false\",\
                                            \"enable_probe\":\"false\",\
                                            \"enable_control_panel\":\"true\",\
                                            \"enable_grbl_panel\":\"true\",\
                                            \"autoreport_interval\":\"50\",\
                                            \"interval_positions\":\"3\",\
                                            \"interval_status\":\"3\",\
                                            \"xy_feedrate\":\"1000\",\
                                            \"z_feedrate\":\"100\",\
                                            \"a_feedrate\":\"100\",\
                                            \"b_feedrate\":\"100\",\
                                            \"c_feedrate\":\"100\",\
                                            \"e_feedrate\":\"400\",\
                                            \"e_distance\":\"5\",\
                                            \"enable_files_panel\":\"true\",\
                                            \"has_TFT_SD\":\"false\",\
                                            \"has_TFT_USB\":\"false\",\
                                            \"f_filters\":\"g;G;gco;GCO;gcode;GCODE;nc;NC;ngc;NCG;tap;TAP;txt;TXT\",\
                                            \"enable_commands_panel\":\"true\",\
                                            \"enable_autoscroll\":\"true\",\
                                            \"enable_verbose_mode\":\"true\",\
                                            \"enable_grbl_probe_panel\":\"false\",\
                                            \"probemaxtravel\":\"40\",\
                                            \"probefeedrate\":\"100\",\
                                            \"proberetract\":\"1.0\",\
                                            \"probetouchplatethickness\":\"0.5\"\
                                            }]";

    displayNone('DHT_pref_panel');
    displayBlock('grbl_pref_panel');
    displayTable('has_tft_sd');
    displayTable('has_tft_usb');
        
    default_preferenceslist = JSON.parse(defaultpreferenceslist);
}

function getpreferenceslist() {
    var url = preferences_file_name;
    preferenceslist = [];
    //removeIf(production)
    var response = defaultpreferenceslist;
    processPreferencesGetSuccess(response);
    return;
    //endRemoveIf(production)
    SendGetHttp(url, processPreferencesGetSuccess, processPreferencesGetFailed);
}

function prefs_toggledisplay(id_source, forcevalue) {
    if (typeof forcevalue != 'undefined') {
        id(id_source).checked = forcevalue;
    }
    switch (id_source) {
        case 'show_files_panel':
            if (id(id_source).checked) displayBlock("files_preferences");
            else displayNone("files_preferences");
            break;
        case 'show_grbl_panel':
            if (id(id_source).checked) displayBlock("grbl_preferences");
            else displayNone("grbl_preferences");
            break;
        case 'show_camera_panel':
            if (id(id_source).checked) displayBlock("camera_preferences");
            else displayNone("camera_preferences");
            break;
        case 'show_control_panel':
            if (id(id_source).checked) displayBlock("control_preferences");
            else displayNone("control_preferences");
            break;
        case 'show_commands_panel':
            if (id(id_source).checked) displayBlock("cmd_preferences");
            else displayNone("cmd_preferences");
            break;
        case 'show_grbl_probe_tab':
            if (id(id_source).checked) displayBlock("grbl_probe_preferences");
            else displayNone("grbl_probe_preferences");
            break;
    }
}

function processFallbackPreferencesGetSuccess(response) {
    if (response.indexOf("<HTML>") == -1) Preferences_build_list(response);
    else Preferences_build_list(defaultpreferenceslist);
}

function processFallbackPreferencesGetFailed(errorcode, response) {
    console.log("Error " + errorcode + " : " + response);
    Preferences_build_list(defaultpreferenceslist);
}

function getFallbackPreferences() {
    var url = fallback_preferences_file_name;
    SendGetHttp(url, processFallbackPreferencesGetSuccess, processFallbackPreferencesGetFailed);
}

function processPreferencesGetSuccess(response) {
    if (response.indexOf("<HTML>") == -1) Preferences_build_list(response);
    else Preferences_build_list(defaultpreferenceslist);
}

function processPreferencesGetFailed(errorcode, response) {
    console.log("Error " + errorcode + " : " + response);
    console.log("Trying fallback to preferences.json");
    getFallbackPreferences();
}

function Preferences_build_list(response_text) {
    preferenceslist = [];
    try {
        if (response_text.length != 0) {
            //console.log(response_text);  
            preferenceslist = JSON.parse(response_text);
            // This handles the case where the preferences file is in
            // WebUI3 format, with a top-level object instead of an array
            if (!Array.isArray(preferenceslist)) {
                console.log("Invalid preferences format; possibly a WebuI3 file");
                preferenceslist = JSON.parse(defaultpreferenceslist);
            }
        } else {
            preferenceslist = JSON.parse(defaultpreferenceslist);
        }
    } catch (e) {
        console.error("Parsing error:", e);
        preferenceslist = JSON.parse(defaultpreferenceslist);
    }
    applypreferenceslist();
}

function applypreferenceslist() {
    //Assign each control state
    translate_text(preferenceslist[0].language);
    build_HTML_setting_list(current_setting_filter);
    if (typeof id('camtab') != "undefined") {
        var camoutput = false;
        if (typeof(preferenceslist[0].enable_camera) !== 'undefined') {
            if (preferenceslist[0].enable_camera === 'true') {
                displayBlock('camtablink');
                camera_GetAddress();
                if (typeof(preferenceslist[0].auto_load_camera) !== 'undefined') {
                    if (preferenceslist[0].auto_load_camera === 'true') {
                        var saddress = id('camera_webaddress').value
                        camera_loadframe();
                        camoutput = true;
                    }
                }
            } else {
                id("maintablink").click();
                displayNone('camtablink');
            }
        } else {
            id("maintablink").click();
            displayNone('camtablink');
        }
        if (!camoutput) {
            id('camera_frame').src = "";
            displayNone('camera_frame_display');
            displayNone('camera_detach_button');
        }
    }
    if (preferenceslist[0].enable_grbl_probe_panel === 'true') {
        displayBlock('grblprobetablink');
    } else {
        id("grblcontroltablink").click();
        displayNone('grblprobetablink');
    }

    if (preferenceslist[0].enable_DHT === 'true') {
        displayBlock('DHT_humidity');
        displayBlock('DHT_temperature');
    } else {
        displayNone('DHT_humidity');
        displayNone('DHT_temperature');
    }
    if (preferenceslist[0].enable_lock_UI === 'true') {
        displayBlock('lock_ui_btn');
        ontoggleLock(true);
    } else {
        displayNone('lock_ui_btn');
        ontoggleLock(false);
    }
    if (preferenceslist[0].enable_ping === 'true') {
        ontogglePing(true);
    } else {
        ontogglePing(false);
    }

    if (preferenceslist[0].enable_grbl_panel === 'true') displayFlex('grblPanel');
    else {
        displayNone('grblPanel');
        reportNone(false);
    }

    if (preferenceslist[0].enable_control_panel === 'true') displayFlex('controlPanel');
    else {
        displayNone('controlPanel');
        on_autocheck_position(false);
    }
    if (preferenceslist[0].enable_verbose_mode === 'true') {
        id('monitor_enable_verbose_mode').checked = true;
        Monitor_check_verbose_mode();
    } else id('monitor_enable_verbose_mode').checked = false;

    if (preferenceslist[0].enable_files_panel === 'true') displayFlex('filesPanel');
    else displayNone('filesPanel');
    
    if (preferenceslist[0].has_TFT_SD === 'true'){
         displayFlex('files_refresh_tft_sd_btn');
     }
    else {
        displayNone('files_refresh_tft_sd_btn');
    }
    
    if (preferenceslist[0].has_TFT_USB === 'true') {
        displayFlex('files_refresh_tft_usb_btn');
    }
    else {
        displayNone('files_refresh_tft_usb_btn');
    }
    
    if ((preferenceslist[0].has_TFT_SD === 'true') || (preferenceslist[0].has_TFT_USB === 'true')){
        displayFlex('files_refresh_printer_sd_btn');
        displayNone('files_refresh_btn');
    } else {
        displayNone('files_refresh_printer_sd_btn');
        displayFlex('files_refresh_btn');
    }
    
    if (preferenceslist[0].enable_commands_panel === 'true') {
        displayFlex('commandsPanel');
        if (preferenceslist[0].enable_autoscroll === 'true') {
            id('monitor_enable_autoscroll').checked = true;
            Monitor_check_autoscroll();
        } else id('monitor_enable_autoscroll').checked = false;
    } else displayNone('commandsPanel');

    var autoReportValue = parseInt(preferenceslist[0].autoreport_interval);
    var autoReportChanged = id('autoReportInterval').value != autoReportValue;
    if (autoReportChanged) {
        id('autoReportInterval').value = autoReportValue;
    }
    var statusIntervalValue = parseInt(preferenceslist[0].interval_status);
    statusIntervalChanged =  id('statusInterval_check').value != statusIntervalValue;
    if (statusIntervalChanged) {
        id('statusInterval_check').value = statusIntervalValue;
    }
    if (autoReportChanged || statusIntervalChanged) {
        onAutoReportIntervalChange();
    }

    id('posInterval_check').value = parseInt(preferenceslist[0].interval_positions);
    id('control_xy_velocity').value = parseInt(preferenceslist[0].xy_feedrate);
    id('control_z_velocity').value = parseInt(preferenceslist[0].z_feedrate);

    if (grblaxis > 2 )axis_Z_feedrate = parseInt(preferenceslist[0].z_feedrate);
    if (grblaxis > 3 )axis_A_feedrate = parseInt(preferenceslist[0].a_feedrate);
    if (grblaxis > 4 )axis_B_feedrate = parseInt(preferenceslist[0].b_feedrate);
    if (grblaxis > 5 )axis_C_feedrate = parseInt(preferenceslist[0].c_feedrate);
        
    if (grblaxis > 3 ){
        var letter = id('control_select_axis').value;
        switch(letter) {
            case "Z":
                id('control_z_velocity').value = axis_Z_feedrate;
                break;
            case "A":
                id('control_z_velocity').value = axis_A_feedrate;
                break;
            case "B":
                id('control_z_velocity').value = axis_B_feedrate;
                break;
            case "C":
                id('control_z_velocity').value = axis_C_feedrate;
                break;
            }
    }

    id('probemaxtravel').value = parseFloat(preferenceslist[0].probemaxtravel);
    id('probefeedrate').value = parseInt(preferenceslist[0].probefeedrate);
    id('proberetract').value = parseFloat(preferenceslist[0].proberetract);
    id('probetouchplatethickness').value = parseFloat(preferenceslist[0].probetouchplatethickness);
    build_file_filter_list(preferenceslist[0].f_filters);
}

function showpreferencesdlg() {
    var modal = setactiveModal('preferencesdlg.html');
    if (modal == null) return;
    language_save = language;
    build_dlg_preferences_list();
    displayNone('preferencesdlg_upload_msg');
    showModal();
}

function build_dlg_preferences_list() {
    //use preferenceslist to set dlg status
    var content = "<table><tr><td>";
    content += get_icon_svg("flag") + "&nbsp;</td><td>";
    content += build_language_list("language_preferences");
    content += "</td></tr></table>";
    id("preferences_langage_list").innerHTML = content;
    //camera
    if (typeof(preferenceslist[0].enable_camera) !== 'undefined') {
        id('show_camera_panel').checked = (preferenceslist[0].enable_camera === 'true');
    } else id('show_camera_panel').checked = false;
    //autoload camera
    if (typeof(preferenceslist[0].auto_load_camera) !== 'undefined') {
        id('autoload_camera_panel').checked = (preferenceslist[0].auto_load_camera === 'true');
    } else id('autoload_camera_panel').checked = false;
    //camera address
    if (typeof(preferenceslist[0].camera_address) !== 'undefined') {
        id('preferences_camera_webaddress').value = decode_entitie(preferenceslist[0].camera_address);
    } else id('preferences_camera_webaddress').value = "";
    //DHT
    if (typeof(preferenceslist[0].enable_DHT) !== 'undefined') {
        id('enable_DHT').checked = (preferenceslist[0].enable_DHT === 'true');
    } else id('enable_DHT').checked = false;
    //lock UI
    if (typeof(preferenceslist[0].enable_lock_UI) !== 'undefined') {
        id('enable_lock_UI').checked = (preferenceslist[0].enable_lock_UI === 'true');
    } else id('enable_lock_UI').checked = false;
    //Monitor connection
    if (typeof(preferenceslist[0].enable_ping) !== 'undefined') {
        id('enable_ping').checked = (preferenceslist[0].enable_ping === 'true');
    } else id('enable_ping').checked = false;

    //grbl panel
    if (typeof(preferenceslist[0].enable_grbl_panel) !== 'undefined') {
        id('show_grbl_panel').checked = (preferenceslist[0].enable_grbl_panel === 'true');
    } else id('show_grbl_panel').checked = false;
    //grbl probe panel
    if (typeof(preferenceslist[0].enable_grbl_probe_panel) !== 'undefined') {
        id('show_grbl_probe_tab').checked = (preferenceslist[0].enable_grbl_probe_panel === 'true');
    } else id('show_grbl_probe_tab').checked = false;
    //control panel
    if (typeof(preferenceslist[0].enable_control_panel) !== 'undefined') {
        id('show_control_panel').checked = (preferenceslist[0].enable_control_panel === 'true');
    } else id('show_control_panel').checked = false;
    //files panel
    if (typeof(preferenceslist[0].enable_files_panel) !== 'undefined') {
        id('show_files_panel').checked = (preferenceslist[0].enable_files_panel === 'true');
    } else id('show_files_panel').checked = false;
    //TFT SD
    if (typeof(preferenceslist[0].has_TFT_SD) !== 'undefined') {
        id('has_tft_sd').checked = (preferenceslist[0].has_TFT_SD === 'true');
    } else id('has_tft_sd').checked = false;
    //TFT USB
    if (typeof(preferenceslist[0].has_TFT_USB) !== 'undefined') {
        id('has_tft_usb').checked = (preferenceslist[0].has_TFT_USB === 'true');
    } else id('has_tft_usb').checked = false;
    //commands
    if (typeof(preferenceslist[0].enable_commands_panel) !== 'undefined') {
        id('show_commands_panel').checked = (preferenceslist[0].enable_commands_panel === 'true');
    } else id('show_commands_panel').checked = false;
    //autoreport interval
    if (typeof(preferenceslist[0].autoreport_interval) !== 'undefined') {
        id('preferences_autoReport_Interval').value = parseInt(preferenceslist[0].autoreport_interval);
    } else id('preferences_autoReport_Interval').value = parseInt(default_preferenceslist[0].autoreport_interval);
    //interval positions
    if (typeof(preferenceslist[0].interval_positions) !== 'undefined') {
        id('preferences_pos_Interval_check').value = parseInt(preferenceslist[0].interval_positions);
    } else id('preferences_pos_Interval_check').value = parseInt(default_preferenceslist[0].interval_positions);
    //interval status
    if (typeof(preferenceslist[0].interval_status) !== 'undefined') {
        id('preferences_status_Interval_check').value = parseInt(preferenceslist[0].interval_status);
    } else id('preferences_status_Interval_check').value = parseInt(default_preferenceslist[0].interval_status);
    //xy feedrate
    if (typeof(preferenceslist[0].xy_feedrate) !== 'undefined') {
        id('preferences_control_xy_velocity').value = parseInt(preferenceslist[0].xy_feedrate);
    } else id('preferences_control_xy_velocity').value = parseInt(default_preferenceslist[0].xy_feedrate);
    if (grblaxis > 2) {
        //z feedrate
        if (typeof(preferenceslist[0].z_feedrate) !== 'undefined') {
            id('preferences_control_z_velocity').value = parseInt(preferenceslist[0].z_feedrate);
        } else id('preferences_control_z_velocity').value = parseInt(default_preferenceslist[0].z_feedrate);
    }
    if (grblaxis > 3) {
        //a feedrate
        if (typeof(preferenceslist[0].a_feedrate) !== 'undefined') {
            id('preferences_control_a_velocity').value = parseInt(preferenceslist[0].a_feedrate);
        } else id('preferences_control_a_velocity').value = parseInt(default_preferenceslist[0].a_feedrate);
    }
    if (grblaxis > 4) {
        //b feedrate
        if (typeof(preferenceslist[0].b_feedrate) !== 'undefined') {
            id('preferences_control_b_velocity').value = parseInt(preferenceslist[0].b_feedrate);
        } else id('preferences_control_b_velocity').value = parseInt(default_preferenceslist[0].b_feedrate);
    }
    if (grblaxis > 5) {
        //c feedrate
        if (typeof(preferenceslist[0].c_feedrate) !== 'undefined') {
            id('preferences_control_c_velocity').value = parseInt(preferenceslist[0].c_feedrate);
        } else id('preferences_control_c_velocity').value = parseInt(default_preferenceslist[0].c_feedrate);
    }

    //probemaxtravel
    if ((typeof(preferenceslist[0].probemaxtravel) !== 'undefined') && (preferenceslist[0].probemaxtravel.length != 0)) {
        id('preferences_probemaxtravel').value = parseFloat(preferenceslist[0].probemaxtravel);
    } else {
        id('preferences_probemaxtravel').value = parseFloat(default_preferenceslist[0].probemaxtravel);
    }
    //probefeedrate
    if ((typeof(preferenceslist[0].probefeedrate) !== 'undefined') && (preferenceslist[0].probefeedrate.length != 0)) {
        id('preferences_probefeedrate').value = parseInt(preferenceslist[0].probefeedrate);
    } else id('preferences_probefeedrate').value = parseInt(default_preferenceslist[0].probefeedrate);
    //proberetract
    if ((typeof(preferenceslist[0].proberetract) !== 'undefined') && (preferenceslist[0].proberetract.length != 0)) {
        id('preferences_proberetract').value = parseFloat(preferenceslist[0].proberetract);
    } else id('preferences_proberetract').value = parseFloat(default_preferenceslist[0].proberetract);
    //probetouchplatethickness
    if ((typeof(preferenceslist[0].probetouchplatethickness) !== 'undefined') && (preferenceslist[0].probetouchplatethickness.length != 0)) {
        id('preferences_probetouchplatethickness').value = parseFloat(preferenceslist[0].probetouchplatethickness);
    } else id('preferences_probetouchplatethickness').value = parseFloat(default_preferenceslist[0].probetouchplatethickness);
    //autoscroll
    if (typeof(preferenceslist[0].enable_autoscroll) !== 'undefined') {
        id('preferences_autoscroll').checked = (preferenceslist[0].enable_autoscroll === 'true');
    } else id('preferences_autoscroll').checked = false;
    //Verbose Mode
    if (typeof(preferenceslist[0].enable_verbose_mode) !== 'undefined') {
        id('preferences_verbose_mode').checked = (preferenceslist[0].enable_verbose_mode === 'true');
    } else id('preferences_verbose_mode').checked = false;
    //file filters
    if (typeof(preferenceslist[0].f_filters) != 'undefined') {
        console.log("Use prefs filters");
        id('preferences_filters').value = preferenceslist[0].f_filters;
    } else {
        console.log("Use default filters");
        id('preferences_filters').value = String(default_preferenceslist[0].f_filters);
    }

    prefs_toggledisplay('show_camera_panel');
    prefs_toggledisplay('show_grbl_panel');
    prefs_toggledisplay('show_control_panel');
    prefs_toggledisplay('show_commands_panel');
    prefs_toggledisplay('show_files_panel');
    prefs_toggledisplay('show_grbl_probe_tab');
}

function closePreferencesDialog() {
    var modified = false;
    if (preferenceslist[0].length != 0) {
        //check dialog compare to global state
        if ((typeof(preferenceslist[0].language) === 'undefined') ||
            (typeof(preferenceslist[0].enable_camera) === 'undefined') ||
            (typeof(preferenceslist[0].auto_load_camera) === 'undefined') ||
            (typeof(preferenceslist[0].camera_address) === 'undefined') ||
            (typeof(preferenceslist[0].enable_DHT) === 'undefined') ||
            (typeof(preferenceslist[0].enable_lock_UI) === 'undefined') ||
            (typeof(preferenceslist[0].enable_ping) === 'undefined') ||
            (typeof(preferenceslist[0].enable_redundant) === 'undefined') ||
            (typeof(preferenceslist[0].enable_probe) === 'undefined') ||
            (typeof(preferenceslist[0].xy_feedrate) === 'undefined') ||
            (typeof(preferenceslist[0].z_feedrate) === 'undefined') ||
            (typeof(preferenceslist[0].e_feedrate) === 'undefined') ||
            (typeof(preferenceslist[0].e_distance) === 'undefined') ||
            (typeof(preferenceslist[0].enable_control_panel) === 'undefined') ||
            (typeof(preferenceslist[0].enable_grbl_panel) === 'undefined') ||
            (typeof(preferenceslist[0].enable_grbl_probe_panel) === 'undefined') ||
            (typeof(preferenceslist[0].probemaxtravel) === 'undefined') ||
            (typeof(preferenceslist[0].probefeedrate) === 'undefined') ||
            (typeof(preferenceslist[0].proberetract) === 'undefined') ||
            (typeof(preferenceslist[0].probetouchplatethickness) === 'undefined') ||
            (typeof(preferenceslist[0].enable_files_panel) === 'undefined') ||
            (typeof(preferenceslist[0].has_TFT_SD) === 'undefined') ||
            (typeof(preferenceslist[0].has_TFT_USB) === 'undefined') ||
            (typeof(preferenceslist[0].autoreport_interval) === 'undefined') ||
            (typeof(preferenceslist[0].interval_positions) === 'undefined') ||
            (typeof(preferenceslist[0].interval_status) === 'undefined') ||
            (typeof(preferenceslist[0].enable_autoscroll) === 'undefined') ||
            (typeof(preferenceslist[0].enable_verbose_mode) === 'undefined') ||
            (typeof(preferenceslist[0].enable_commands_panel) === 'undefined')) {
            modified = true;
        } else {
            //camera
            if (id('show_camera_panel').checked != (preferenceslist[0].enable_camera === 'true')) modified = true;
            //Autoload
            if (id('autoload_camera_panel').checked != (preferenceslist[0].auto_load_camera === 'true')) modified = true;
            //camera address
            if (id('preferences_camera_webaddress').value != decode_entitie(preferenceslist[0].camera_address)) modified = true;
            //DHT
            if (id('enable_DHT').checked != (preferenceslist[0].enable_DHT === 'true')) modified = true;
            //Lock UI
            if (id('enable_lock_UI').checked != (preferenceslist[0].enable_lock_UI === 'true')) modified = true;
            //Monitor connection
            if (id('enable_ping').checked != (preferenceslist[0].enable_ping === 'true')) modified = true;
            //control panel
            if (id('show_control_panel').checked != (preferenceslist[0].enable_control_panel === 'true')) modified = true;
            //grbl panel
            if (id('show_grbl_panel').checked != (preferenceslist[0].enable_grbl_panel === 'true')) modified = true;
            //grbl probe panel
            if (id('show_grbl_probe_tab').checked != (preferenceslist[0].enable_grbl_probe_panel === 'true')) modified = true;
            //files panel
            if (id('show_files_panel').checked != (preferenceslist[0].enable_files_panel === 'true')) modified = true;
            //TFT SD
            if (id('has_tft_sd').checked != (preferenceslist[0].has_TFT_SD === 'true')) modified = true;
            //TFT USB
            if (id('has_tft_usb').checked != (preferenceslist[0].has_TFT_USB === 'true')) modified = true;
            //commands
            if (id('show_commands_panel').checked != (preferenceslist[0].enable_commands_panel === 'true')) modified = true;
            //interval positions
            if (id('preferences_autoReport_Interval').value != parseInt(preferenceslist[0].autoReport_interval)) modified = true;
            if (id('preferences_pos_Interval_check').value != parseInt(preferenceslist[0].interval_positions)) modified = true;
            //interval status
            if (id('preferences_status_Interval_check').value != parseInt(preferenceslist[0].interval_status)) modified = true;
            //xy feedrate
            if (id('preferences_control_xy_velocity').value != parseInt(preferenceslist[0].xy_feedrate)) modified = true;
            if (grblaxis > 2) {
                //z feedrate
                if (id('preferences_control_z_velocity').value != parseInt(preferenceslist[0].z_feedrate)) modified = true;
            }
            if (grblaxis > 3) {
                //a feedrate
                if (id('preferences_control_a_velocity').value != parseInt(preferenceslist[0].a_feedrate)) modified = true;
            }
            if (grblaxis > 4) {
                //b feedrate
                if (id('preferences_control_b_velocity').value != parseInt(preferenceslist[0].b_feedrate)) modified = true;
            }
            if (grblaxis > 5) {
                //c feedrate
                if (id('preferences_control_c_velocity').value != parseInt(preferenceslist[0].c_feedrate)) modified = true;
            }
        }
        //autoscroll
        if (id('preferences_autoscroll').checked != (preferenceslist[0].enable_autoscroll === 'true')) modified = true;
        //Verbose Mode
        if (id('preferences_verbose_mode').checked != (preferenceslist[0].enable_verbose_mode === 'true')) modified = true;
        //file filters
        if (id('preferences_filters').value != preferenceslist[0].f_filters) modified = true;
        //probemaxtravel
        if (id('preferences_probemaxtravel').value != parseFloat(preferenceslist[0].probemaxtravel)) modified = true;
        //probefeedrate
        if (id('preferences_probefeedrate').value != parseInt(preferenceslist[0].probefeedrate)) modified = true;
        //proberetract
        if (id('preferences_proberetract').value != parseFloat(preferenceslist[0].proberetract)) modified = true;
        //probetouchplatethickness
        if (id('preferences_probetouchplatethickness').value != parseFloat(preferenceslist[0].probetouchplatethickness)) modified = true;
    }

    if (language_save != language) modified = true;
    if (modified) {
        confirmdlg(translate_text_item("Data mofified"), translate_text_item("Do you want to save?"), process_preferencesCloseDialog)
    } else {
        closeModal('cancel');
    }
}

function process_preferencesCloseDialog(answer) {
    if (answer == 'no') {
        //console.log("Answer is no so exit");
        translate_text(language_save);
        closeModal('cancel');
    } else {
        // console.log("Answer is yes so let's save");
        SavePreferences();
    }
}

function SavePreferences(current_preferences) {
    if (http_communication_locked) {
        alertdlg(translate_text_item("Busy..."), translate_text_item("Communications are currently locked, please wait and retry."));
        return;
    }
    console.log("save prefs");
    if (((typeof(current_preferences) != 'undefined') && !current_preferences) || (typeof(current_preferences) == 'undefined')) {
        if (!Checkvalues("preferences_autoReport_Interval") ||
            !Checkvalues("preferences_pos_Interval_check") ||
            !Checkvalues("preferences_status_Interval_check") ||
            !Checkvalues("preferences_control_xy_velocity") ||
            !Checkvalues("preferences_filters") ||
            !Checkvalues("preferences_probemaxtravel") ||
            !Checkvalues("preferences_probefeedrate") ||
            !Checkvalues("preferences_proberetract") ||
            !Checkvalues("preferences_probetouchplatethickness")
        ) return;
        if (grblaxis > 2) {
            if(!Checkvalues("preferences_control_z_velocity")) return;
        }
        if( (grblaxis > 3) && (!Checkvalues("preferences_control_a_velocity"))) return;
        if( (grblaxis > 4) && (!Checkvalues("preferences_control_b_velocity"))) return;
        if( (grblaxis > 5) && (!Checkvalues("preferences_control_c_velocity"))) return;

        preferenceslist = [];
        var saveprefs = "[{\"language\":\"" + language;
        saveprefs += "\",\"enable_camera\":\"" + id('show_camera_panel').checked;
        saveprefs += "\",\"auto_load_camera\":\"" + id('autoload_camera_panel').checked;
        saveprefs += "\",\"camera_address\":\"" + HTMLEncode(id('preferences_camera_webaddress').value);
        saveprefs += "\",\"enable_DHT\":\"" + id('enable_DHT').checked;
        saveprefs += "\",\"enable_lock_UI\":\"" + id('enable_lock_UI').checked;
        saveprefs += "\",\"enable_ping\":\"" + id('enable_ping').checked;
        saveprefs += "\",\"enable_control_panel\":\"" + id('show_control_panel').checked;
        saveprefs += "\",\"enable_grbl_probe_panel\":\"" + id('show_grbl_probe_tab').checked;
        saveprefs += "\",\"enable_grbl_panel\":\"" + id('show_grbl_panel').checked;
        saveprefs += "\",\"enable_files_panel\":\"" + id('show_files_panel').checked;
        saveprefs += "\",\"has_TFT_SD\":\"" + id('has_tft_sd').checked;
        saveprefs += "\",\"has_TFT_USB\":\"" + id('has_tft_usb').checked;
        saveprefs += "\",\"probemaxtravel\":\"" + id('preferences_probemaxtravel').value;
        saveprefs += "\",\"probefeedrate\":\"" + id('preferences_probefeedrate').value;
        saveprefs += "\",\"proberetract\":\"" + id('preferences_proberetract').value;
        saveprefs += "\",\"probetouchplatethickness\":\"" + id('preferences_probetouchplatethickness').value;
        saveprefs += "\",\"autoreport_interval\":\"" + id('preferences_autoReport_Interval').value;
        saveprefs += "\",\"interval_positions\":\"" + id('preferences_pos_Interval_check').value;
        saveprefs += "\",\"interval_status\":\"" + id('preferences_status_Interval_check').value;
        saveprefs += "\",\"xy_feedrate\":\"" + id('preferences_control_xy_velocity').value;
        if (grblaxis > 2) {
            saveprefs += "\",\"z_feedrate\":\"" + id('preferences_control_z_velocity').value;
        }
        if (grblaxis > 3){
            saveprefs += "\",\"a_feedrate\":\"" + id('preferences_control_a_velocity').value;
        }
        if (grblaxis > 4){
            saveprefs += "\",\"b_feedrate\":\"" + id('preferences_control_b_velocity').value;
        }
        if (grblaxis > 5){
            saveprefs += "\",\"c_feedrate\":\"" + id('preferences_control_c_velocity').value;
        }

        saveprefs += "\",\"f_filters\":\"" + id('preferences_filters').value;
        saveprefs += "\",\"enable_autoscroll\":\"" + id('preferences_autoscroll').checked;
        saveprefs += "\",\"enable_verbose_mode\":\"" + id('preferences_verbose_mode').checked;
        saveprefs += "\",\"enable_commands_panel\":\"" + id('show_commands_panel').checked + "\"}]";
        preferenceslist = JSON.parse(saveprefs);
    }
    var blob = new Blob([JSON.stringify(preferenceslist, null, " ")], {
        type: 'application/json'
    });
    var file;
    if (browser_is("IE") || browser_is("Edge")) {
        file = blob;
        file.name = preferences_file_name;
        file.lastModifiedDate = new Date();
    } else file = new File([blob], preferences_file_name);
    var formData = new FormData();
    var url = "/files";
    formData.append('path', '/');
    formData.append('myfile[]', file, preferences_file_name);
    if ((typeof(current_preferences) != 'undefined') && current_preferences) SendFileHttp(url, formData);
    else SendFileHttp(url, formData, preferencesdlgUploadProgressDisplay, preferencesUploadsuccess, preferencesUploadfailed);
}

function preferencesdlgUploadProgressDisplay(oEvent) {
    if (oEvent.lengthComputable) {
        var percentComplete = (oEvent.loaded / oEvent.total) * 100;
        id('preferencesdlg_prg').value = percentComplete;
        id('preferencesdlg_upload_percent').innerHTML = percentComplete.toFixed(0);
        displayBlock('preferencesdlg_upload_msg');
    } else {
        // Impossible because size is unknown
    }
}

function preferencesUploadsuccess(response) {
    displayNone('preferencesdlg_upload_msg');
    applypreferenceslist();
    closeModal('ok');
}

function preferencesUploadfailed(errorcode, response) {
    alertdlg(translate_text_item("Error"), translate_text_item("Save preferences failed!"));
}


function Checkvalues(id_2_check) {
    var status = true;
    var value = 0;
    switch (id_2_check) {
        case "preferences_autoReport_Interval":
            value = parseInt(id(id_2_check).value);
            if (!(!isNaN(value) && (value == 0 || (value >= 50 && value <= 30000)))) {
                error_message = translate_text_item("Value of auto-report must be 0 or between 50ms and 30000ms !!");
                status = false;
            }
            break;
        case "preferences_status_Interval_check":
            value = parseInt(id(id_2_check).value);
            if (!(!isNaN(value) && value >= 0 && value <= 100)) {
                error_message = translate_text_item("Value of auto-check must be between 0s and 99s !!");
                status = false;
            }
            break;
        case "preferences_pos_Interval_check":
            value = parseInt(id(id_2_check).value);
            if (!(!isNaN(value) && value >= 1 && value <= 100)) {
                error_message = translate_text_item("Value of auto-check must be between 0s and 99s !!");
                status = false;
            }
            break;
        case "preferences_control_xy_velocity":
            value = parseInt(id(id_2_check).value);
            if (!(!isNaN(value) && value >= 1)) {
                error_message = translate_text_item("XY Feedrate value must be at least 1 mm/min!");
                status = false;
            }
            break;
        case "preferences_control_z_velocity":
            value = parseInt(id(id_2_check).value);
            if (!(!isNaN(value) && value >= 1)) {
                error_message = translate_text_item("Z Feedrate value must be at least 1 mm/min!");
                status = false;
            }
            break;
        case "preferences_control_a_velocity":
        case "preferences_control_b_velocity":
        case "preferences_control_c_velocity":
            value = parseInt(id(id_2_check).value);
            if (!(!isNaN(value) && value >= 1)) {
                error_message = translate_text_item("Axis Feedrate value must be at least 1 mm/min!");
                status = false;
            }
            break;
        case "preferences_probefeedrate":
            value = parseInt(id(id_2_check).value);
            if (!(!isNaN(value) && value >= 1 && value <= 9999)) {
                error_message = translate_text_item("Value of probe feedrate must be between 1 mm/min and 9999 mm/min !");
                status = false;
            }
            break;
        case "preferences_probemaxtravel":
            value = parseInt(id(id_2_check).value);
            if (!(!isNaN(value) && value >= 1 && value <= 9999)) {
                error_message = translate_text_item("Value of maximum probe travel must be between 1 mm and 9999 mm !");
                status = false;
            }
            break;
        case "preferences_proberetract":
            value = parseInt(id(id_2_check).value);
            if (!(!isNaN(value) && value >= 0 && value <= 9999)) {
                error_message = translate_text_item("Value of probe retract must be between 0 mm and 9999 mm !");
                status = false;
            }
            break;
        case "preferences_probetouchplatethickness":
            value = parseInt(id(id_2_check).value);
            if (!(!isNaN(value) && value >= 0 && value <= 9999)) {
                error_message = translate_text_item("Value of probe touch plate thickness must be between 0 mm and 9999 mm !");
                status = false;
            }
            break;
        case "preferences_filters":
            //TODO a regex would be better
            value = id(id_2_check).value;
            if ((value.indexOf(".") != -1) ||
                (value.indexOf("*") != -1)) {
                error_message = translate_text_item("Only alphanumeric chars separated by ; for extensions filters");
                status = false;
            }
            break;
    }
    if (status) {
        id(id_2_check + "_group").classList.remove("has-feedback");
        id(id_2_check + "_group").classList.remove("has-error");
        id(id_2_check + "_icon").innerHTML = "";
    } else {
        // has-feedback hides the value so it is hard to fix it
        // id(id_2_check + "_group").classList.add("has-feedback");
        id(id_2_check + "_group").classList.add("has-error");
        // id(id_2_check + "_icon").innerHTML = get_icon_svg("remove");
        alertdlg(translate_text_item("Out of range"), error_message);
    }
    return status;
}
