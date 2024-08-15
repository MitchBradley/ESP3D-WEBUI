//setup dialog

var active_wizard_page = 0;
var maz_page_wizard = 5;

function td(value) {
    return "<td>" + value + "</td>";
}
function table(value) {
    return "<table><tr>" + value + "</tr></table>";
}
function heading(label) {
    return "<h4>" + translate_text_item(label) + "</h4><hr>";
}
function item(label, pos, extra) {
    return translate_text_item(label) + table(build_control_from_pos(pos, extra));
}
function wizardDone(element) {
    id(element).className = id(element).className.replace(" wizard_done", "");
}
function disableStep(wizard, step) {
    id(wizard).style.background = "#e0e0e0";
    id(step).disabled = true;
    id(step).className = "steplinks disabled";
    wizardDone(step);
}
function openStep(wizard, step) {
    id(wizard).style.background = "#337AB7";
    id(step).disabled = "";
    id(step).className = id(step).className.replace(" disabled", "");
}
function closeStep(step) {
    if (id(step).className.indexOf(" wizard_done") == -1) {
        id(step).className += " wizard_done";
        if (!can_revert_wizard) id(step).className += " no_revert_wizard";
    }
}
function spacer() {
    return "<hr>\n";
}
function startDiv(name) {
    return "<div id='" + name + "'>";
}
function endDiv() {
    return "</div>";
}

function setupdlg() {
    setup_is_done = false;
    language_save = language;
    displayNone('main_ui');
    id('settings_list_data').innerHTML = "";
    active_wizard_page = 0;

    wizardDone("startsteplink");

    id("wizard_button").innerHTML = translate_text_item("Start setup");

    disableStep("wizard_line1", "step1link");
    disableStep("wizard_line2", "step2link");
    disableStep("wizard_line3", "step3link");

    displayNone("step3link");
    displayNone("wizard_line4")
    disableStep("wizard_line4", "endsteplink");

    var content = table( td(get_icon_svg("flag") + "&nbsp;") + td(build_language_list("language_selection")));
    id("setup_langage_list").innerHTML = content;

    var modal = setactiveModal('setupdlg.html', setupdone);
    if (modal == null) return;
    showModal();
    id("startsteplink", true).click();
}


function setupdone(response) {
    setup_is_done = true;
    do_not_build_settings = false;
    build_HTML_setting_list(current_setting_filter);
    translate_text(language_save);
    displayUndoNone('main_ui');
    closeModal("setup done");
}

function continue_setup_wizard() {
    active_wizard_page++;
    switch (active_wizard_page) {
        case 1:
            enablestep1();
            preferenceslist[0].language = language;
            SavePreferences(true);
            language_save = language;
            break;
        case 2:
            enablestep2();
            break;
        case 3:
            active_wizard_page++;
            id("wizard_line3").style.background = "#337AB7";
            enablestep4();
            break;
        case 4:
            enablestep4();
            break;
        case 5:
            closeModal('ok')
            break;
        default:
            console.log("wizard page out of range");
    }
}

function enablestep1() {
    var content = "";
    closeStep("startsteplink")
    id("wizard_button").innerHTML = translate_text_item("Continue");
    openStep("wizard_line1", "step1link");
    content += heading("FluidNC Settings");
    content += item("Define ESP name:", EP_HOSTNAME);

    id("step1").innerHTML = content
    id("step1link").click();
}

function enablestep2() {
    var content = "";
    closeStep("step1link");
    openStep("wizard_line2", "step2link");
    content += heading("WiFi Configuration");

    content += item("Define ESP role:", EP_WIFI_MODE, "define_esp_role");
    content += translate_text_item("AP define access point / STA allows to join existing network") + "<br>";
    content += spacer();

    content += startDiv("setup_STA");

    content += item("What access point ESP need to be connected to:", EP_STA_SSID);
    content += translate_text_item("You can use scan button, to list available access points.") + "<br>";

    content += item("Password to join access point:", EP_STA_PASSWORD);
    content += spacer();
    content += endDiv();

    content += startDiv("setup_AP");

    content += item("What is ESP access point SSID:", EP_AP_SSID);

    content += item("Password for access point:", EP_AP_PASSWORD);

    content += endDiv();

    id("step2").innerHTML = content;
    define_esp_role_from_pos(EP_WIFI_MODE);
    id("step2link").click();
}

function define_sd_role(index) {
    if (setting_configList[index].defaultvalue == 1) {
        displayBlock("setup_SD");
        displayNone("setup_primary_SD");;
    } else {
        displayNone("setup_SD");
        displayNone("setup_primary_SD");
    }
}

function enablestep3() {
    var content = "";
    closeStep("step2link");
    openStep("wizard_line3", "step3link");
    content += heading("SD Card Configuration");
    content += item("Is ESP connected to SD card:", EP_IS_DIRECT_SD, "define_sd_role");
    content += spacer();

    content += startDiv("setup_SD");
    content += item("Check update using direct SD access:", EP_DIRECT_SD_CHECK);
    content += spacer();

    content += startDiv("setup_primary_SD");
    content += item("SD card connected to ESP", EP_PRIMARY_SD);
    content += spacer();

    content += item("SD card connected to printer", EP_SECONDARY_SD);
    content += spacer();
    content += endDiv();

    content += endDiv();

    id("step3").innerHTML = content;
    define_sd_role(get_index_from_eeprom_pos(EP_IS_DIRECT_SD));
    id("step3link").click();
}

function enablestep4() {
    closeStep("step3link");
    id("wizard_button").innerHTML = translate_text_item("Close");
    openStep("wizard_line4", "endsteplink");
    id("endsteplink").click();
}
