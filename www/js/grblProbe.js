let is_probing = false;

const finalize_probing = (status) => {
    if (status) {
       const cmd = "$J=G90 G21 F1000 Z" + (parseFloat(getValue('probetouchplatethickness')) + parseFloat(getValue('proberetract'))); 
       SendPrinterCommand(cmd, true, null, null, 90, 1);
    } else {
        alertdlg(translate_text_item("Error"), translate_text_item(msg));
        beep(70, 261);
    }

    is_probing = false;
    setClickability('probingbtn', true);
    setClickability('probingtext', false);
    setClickability('sd_pause_btn', false);
    setClickability('sd_resume_btn', false);
    setClickability('sd_reset_btn', false);
}

const grbl_set_probe_detected = (state) => {
    const color = state ? "green" : "grey";
    const glyph = state ? "ok-circle" : "record";
    setHTML("touch_status_icon", get_icon_svg(glyph, "1.3em", "1.3em", color));
}

const onprobemaxtravelChange = () => {
    const travel = parseFloat(getValue('probemaxtravel'));
    if (travel > 9999 || travel <= 0 || isNaN(travel) || (travel === null)) {
        alertdlg(translate_text_item("Out of range"), translate_text_item("Value of maximum probe travel must be between 1 mm and 9999 mm !"));
        return false;
    }
    return true;
}

const onprobefeedrateChange = () => {
    const feedratevalue = parseInt(getValue('probefeedrate'));
    if (feedratevalue <= 0 || feedratevalue > 9999 || isNaN(feedratevalue) || (feedratevalue === null)) {
        alertdlg(translate_text_item("Out of range"), translate_text_item("Value of probe feedrate must be between 1 mm/min and 9999 mm/min !"));
        return false
    }
    return true;
}

const onproberetractChange = () => {
    const thickness = parseFloat(getValue('proberetract'));
    if (thickness < 0 || thickness > 999 || isNaN(thickness) || (thickness === null)) {
        alertdlg(translate_text_item("Out of range"), translate_text_item("Value of probe retract must be between 0 mm and 9999 mm !"));
        return false;
    }
    return true;
}

const onprobetouchplatethicknessChange = () => {
    const thickness = parseFloat(getValue('probetouchplatethickness'));
    if (thickness < 0 || thickness > 999 || isNaN(thickness) || (thickness === null)) {
        alertdlg(translate_text_item("Out of range"), translate_text_item("Value of probe touch plate thickness must be between 0 mm and 9999 mm !"));
        return false;
    }
    return true;
}

const show_grbl_probe_status = (probed) => {
    grbl_set_probe_detected(probed);
}

const probeStartFailed = (msg) => {
    finalize_probing('');
    alertdlg(translate_text_item("Error"), translate_text_item(msg));
    beep(70, 261);
}

const StartProbeProcess = () => {
    // G38.6 is FluidNC-specific.  It is like G38.2 except that the units
    // are always G21 units, i.e. mm in the usual case, and distance is
    // always incremental.  This avoids problems with probing when in G20
    // inches mode and undoing a preexisting G91 incremental mode
    let cmd = "G38.6 Z-";
    if (!onprobemaxtravelChange() ||
        !onprobefeedrateChange() ||
        !onproberetractChange() ||
        !onprobetouchplatethicknessChange()) {
        return;
    }
    cmd += parseFloat(getValue('probemaxtravel')) + ' F' + parseInt(getValue('probefeedrate')) + ' P' + getValue('probetouchplatethickness');
    console.log(cmd);
    is_probing = true;
    let restoreReport = false;
    if (reportType == 'none') {
        tryAutoReport(); // will fall back to polled if autoreport fails
        restoreReport = true;
    }
    SendPrinterCommand(cmd, true, null, probeStartFailed, 38.6, 1);
    setClickability('probingbtn', false);
    setClickability('probingtext', true);
    if (restoreReport) {
        reportNone();
    }
}

let spindleSpeedSetTimeout;
let spindleTabSpindleSpeed = 1;

const setSpindleSpeed = (speed) => {
    if(spindleSpeedSetTimeout) clearTimeout(spindleSpeedSetTimeout)
    if(speed >= 1) {
        spindleTabSpindleSpeed = speed
        spindleSpeedSetTimeout = setTimeout(() => SendPrinterCommand('S' + spindleTabSpindleSpeed, false, null, null, 1, 1), 500)
    }
}
