let grblaxis = 3;
let grblzerocmd = 'X0 Y0 Z0';
let feedrate = [0, 0, 0, 0, 0, 0];
let last_axis_letter = 'Z';

let snd = null;
let sndok = true;

const beep = (vol, freq, duration) => {
    if (snd == null && sndok) {
        try {
            snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
        } catch (error) {
            snd = null;
            sndok = false;
        }
    }
    if (snd) {
        snd.play();
    }
}

const sendCommand = (cmd) => {
    SendPrinterCommand(cmd, true, get_Position);
}

const getAxisValueSuccess = () => {}

const getAxisValueFailure = () => {
    displayer.disableBoundary()
    // console.log("Failed to get axis data");
}

const askAxis = (name) => {
    var url = "/command?plain=" + encodeURIComponent(name);
    SendGetHttp(url, getAxisValueSuccess, getAxisValueFailure);
}

const files_downloadFile = (name) => {
    fetch(encodeURIComponent('SD' + gCodeFilename))
        .then(response => response.text())
        .then(gcode => showGCode(gcode));
};

const tabletGetFileList = (path) => {
    gCodeFilename = '';
    SendGetHttp('/upload?path=' + encodeURI(path), files_list_success);
}

const toggleDropdown = () => {
    id('tablet-dropdown-menu').classList.toggle('hidden');
};

const enterFullscreen = () => {
    try {
        document.documentElement.requestFullscreen();
    } catch (exception) {
        try {
            document.documentElement.webkitRequestFullscreen();
        } catch (exception) {
            return;
        }
    }
    messages.rows = 4;
    messages.scrollTop = messages.scrollHeight;
}

const exitFullscreen = () => {
    try {
        document.exitFullscreen();
    } catch (exception) {
        try {
            document.webkitExitFullscreen();
        } catch (exception) {
            return;
        }
    }
    messages.rows = 2;
    messages.scrollTop = messages.scrollHeight;
}

const toggleFullscreen = () => {
    if (document.fullscreenElement) {
        exitFullscreen();
    } else {
        enterFullscreen();
    }
}

const addInterfaceListeners = () => {
    id('tablettablink').addEventListener('DOMActivate', fullscreenIfMobile, false);
    id('tablettablink').addEventListener('DOMActivate', setBottomHeight, false);

//    id('tablettab').addEventListener('activate', askMachineBbox, false);

    id("control-pad").classList.add("open");

    id('toolpath').addEventListener("mouseup", updateGcodeViewerAngle);
};

const fullscreenIfMobile = () => {
    if (/Mobi|Android/i.test(navigator.userAgent)) {
        toggleFullscreen();
    }
}
const initInterface = () => {
    tabletGetFileList('/');
};

const bodyHeight = () => {
    return window.innerHeight;
}

const navbarHeight = () => {
    return heightId('navbar');
}

// UI interface
const setClickability = (element, visible) => {
    setDisplay(element, visible ? 'table-row' : 'none');
}

let autocheck = 'report_auto';
const getAutocheck = () => getChecked(autocheck);
const setAutocheck = (flag) => setChecked(autocheck, flag);

const build_axis_selection = () => {
    let html = "<select class='form-control wauto' id='control_select_axis' onchange='control_changeaxis()' >";
    for (let i = 3; i <= grblaxis; i++) {
        let letter;
        if (i == 3) letter = "Z";
        else if (i == 4) letter = "A";
        else if (i == 5) letter = "B";
        else if (i == 6) letter = "C";
        html += "<option value='" + letter + "'";
        if (i == 3) html += " selected ";
        html += ">";
        html += letter;
        html += "</option>\n";
    }

    html += "</select>\n";
    if (grblaxis > 3) {
        setHTML("axis_selection", html);
        setHTML("axis_label", translate_text_item("Axis") + ":");
        setClickability("axis_selection", true)
    }
}

const control_changeaxis = () => {
    let letter = getValue('control_select_axis');
    setHTML('axisup', '+' + letter);
    setHTML('axisdown', '-' + letter);
    setHTML('homeZlabel', ' ' + letter + ' ');
    switch (last_axis_letter) {
        case 'Z':
            axis_feedrate[2] = getValue('control_z_velocity');
            break;
        case 'A':
            axis_feedrate[3] = getValue('control_a_velocity');
            break;
        case 'B':
            axis_feedrate[4] = getValue('control_b_velocity');
            break;
        case 'C':
            axis_feedrate[5] = getValue('control_c_velocity');
            break;
    }

    last_axis_letter = letter;
    switch (last_axis_letter) {
        case 'Z':
            setValue('control_z_velocity', axis_feedrate[2]);
            break;
        case 'A':
            setValue('control_a_velocity', axis_feedrate[3]);
            break;
        case 'B':
            setValue('control_b_velocity', axis_feedrate[4]);
            break;
        case 'C':
            setValue('control_c_velocity', axis_feedrate[5]);
            break;
    }
}
const init_grbl_panel = () => {
    grbl_set_probe_detected(false);
}
const grbl_clear_status = () => {
    grbl_set_probe_detected(false);
    grbl_error_msg = "";
    setHTML("grbl_status_text", grbl_error_msg);
    setHTML("grbl_status", "");
}

let reportType = 'none';

let interval_status = -1;

const disablePolling = () => {
    setAutocheck(false);
    // setValue('statusInterval_check', 0);
    if (interval_status != -1) {
        clearInterval(interval_status);
        interval_status = -1;
    }

    grbl_clear_status();
    reportType = 'none';
}

const enablePolling = () => {
    const interval = parseFloat(getValue('statusInterval_check'));
    if (!isNaN(interval) && interval == 0) {
        if (interval_status != -1) {
            clearInterval(interval_status);
        }
        disablePolling();
        reportNone();
        return;
    }
    if (!isNaN(interval) && interval > 0 && interval < 100) {
        if (interval_status != -1) {
            clearInterval(interval_status);
        }
        interval_status = setInterval(() => {
            get_status()
        }, interval * 1000);
        reportType = 'polled';
        setChecked('report_poll', true);
        return;
    }
    setValue("statusInterval_check", 0);
    alertdlg(translate_text_item("Out of range"), translate_text_item("Value of auto-check must be between 0s and 99s !!"));
    disablePolling();
    reportNone();
}

const tryAutoReport = () => {
    if (reportType == 'polled') {
        disablePolling();
    }
    reportType == 'auto';
    const interval = id('autoReportInterval').value;
    if (interval == 0) {
        enablePolling();
        return;
    }
    setChecked('report_auto', true);
    reportType = 'auto';
    SendPrinterCommand("$Report/Interval="+interval, true,
                       // Do nothing more on success
                       () => {},

                       // Fall back to polling if the firmware does not support auto-reports
                       () => {    
                           enablePolling();
                       },

                       99.1, 1);
}
const onAutoReportIntervalChange = () => {
    tryAutoReport();
}

const disableAutoReport = () => {
    SendPrinterCommand("$Report/Interval=0", true, null, null, 99.0, 1);
    setChecked('report_auto', false);
}

const reportNone = () => {
    switch (reportType) {
        case 'polled':
            disablePolling();
            break;
        case 'auto':
            disableAutoReport();
            break;
    }
    setChecked('report_none', true);
    reportType = 'none';
}

const reportPolled = () => {
    if (reportType == 'auto') {
        disableAutoReport();
    }
    enablePolling();
}

const onReportType = (e) => {
    switch (e.value) {
        case 'none':
            reportNone();
            break;
        case 'auto':
            tryAutoReport()
            break;
        case 'poll':
            reportPolled();
            break;
    }
}

const onstatusIntervalChange = () => {
    enablePolling();
}

//TODO handle authentication issues
//errorfn cannot be NULL
const get_status = () => {      
    sendRealtimeCmd('\x3f'); // '?'
}

const show_grbl_position = (wpos, mpos) => {
    if (wpos) {
        wpos.forEach((pos, axis) => {
            const element =  'control_' + axisNames[axis] + '_position';
            setHTML(element, pos.toFixed(3));
        });
    }
    if (mpos) {
        mpos.forEach((pos, axis) => {
            const element = 'control_' + axisNames[axis] + 'm_position';
            setHTML(element, pos.toFixed(3));
        });
    }
}

const clickableFromStateName = (state, hasSD) => {
    const clickable = {
        resume: false,
        pause: false,
        reset: false
    }
    switch(state) {
        case 'Run':
            clickable.pause = true;
            clickable.reset = true;
            break;
        case 'Door1':
            clickable.reset = true;
            break;
        case 'Door0':
        case 'Hold':
            clickable.resume = true;
            clickable.reset = true;
            break;
        case 'Alarm':
            if (hasSD) {
                //guess print is stopped because of alarm so no need to pause
                clickable.resume = true;
            }
            break;
        case 'Idle':
        case 'Jog':
        case 'Home':
        case 'Check':
        case 'Sleep':
            break;
    }
    return clickable;
}

const show_grbl_status = (stateName, message, hasSD) => {
    if (stateName) {
        const clickable = clickableFromStateName(stateName, hasSD);
        setHTML('grbl_status', stateName);
        setClickability('sd_resume_btn', clickable.resume);
        setClickability('sd_pause_btn', clickable.pause);
        setClickability('sd_reset_btn', clickable.reset);

        // This notification seems unnecessary; the hold state indication is enough
        // if (stateName == 'Hold' && is_probing) {
        //     probe_failed_notification('Probe Paused');
        // }
    }

    setHTML('grbl_status_text', translate_text_item(message));
    setClickability('clear_status_btn', stateName == 'Alarm');
}

const show_grbl_SD = (sdName, sdPercent) => {
    const status = sdName ? sdName + '&nbsp;<progress id="print_prg" value=' + sdPercent + ' max="100"></progress>' + sdPercent + '%' : '';
    setHTML('grbl_SD_status', status);
}

const mainGrblState = (grblstate) => {
    show_grbl_position(WPOS, MPOS);
    show_grbl_status(grblstate.stateName, grblstate.message, grblstate.sdName);
    show_grbl_SD(grblstate.sdName, grblstate.sdPercent);
    show_grbl_probe_status(grblstate.pins && (grblstate.pins.indexOf('P') != -1));
};

const grblHandleOk = () => {
    if (grbl_processfn) {
        grbl_processfn();
        grbl_processfn = null;
        grbl_errorfn = null;
    }
}
const grblHandleError = (msg) => {
    if (grbl_errorfn) {
        grbl_errorfn(msg);
        grbl_errorfn = null;
        grbl_processfn = null;
    }
}

const sendRealtimeCmd = (code) => {
    SendPrinterCommand(code, false, null, null, code, 1);
}

const loadApp = () => {console.log("LOAD APP");};

const onVisible = (element, callback) => {
    new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if(entry.intersectionRatio > 0) {
                callback(element);
                observer.disconnect();
            }
        });
    }).observe(element);
    if(!callback) {
        return new Promise(r => callback=r);
    }
}

let tabletLoaded = false;
const initTablet = () => {
    if (!tabletLoaded) {
        toggleDropdown();
        addListeners();
        setBottomHeight();
        tabletLoaded = true;
    }
}
const setupFluidNC = () => {
    sendCommand('$Report/Interval=300')
}

const setupTablet = () => {
    attachApp(id('mainuitabscontent'));
    initDisplayer()
    initInterface();
    requestModes();
    askMachineBbox();
    onVisible(id('tablettab'), initTablet);
}

// Filtering is already done 
const filterFiles = (files) => files;

const refreshFiles = (event) => {
    files_refreshFiles(files_currentPath)
}

const internalUploadFile = () => {
}

const uploadButtonName = 'files_input_file';

const processMessage = () => {}

const getVersion = () => "Devel";

