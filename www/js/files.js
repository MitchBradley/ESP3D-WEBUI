var files_currentPath = "/";
var files_filter_sd_list = false;
var files_file_list = [];
var files_status_list = [];
var files_current_file_index = -1;
var files_error_status = "";
var tfiles_filters;
var tft_sd = "SD:"
var tft_usb = "U:"
var printer_sd = "SDCARD:"
var current_source = "/"
var last_source = "/"

function build_file_filter_list(filters_list) {
    build_accept(filters_list);
    update_files_list();
}

function update_files_list() {
    //console.log("Updating list");
    if (files_file_list.length == 0) return;
    for (var i = 0; i < files_file_list.length; i++) {
        var isdirectory = files_file_list[i].isdir;
        var file_name = files_file_list[i].name;
        files_file_list[i].isprintable = files_isgcode(file_name, isdirectory);
    }
    files_build_display_filelist();
}

function build_accept(file_filters_list) {
    var accept_txt = "";
    if (typeof file_filters_list != 'undefined') {
        tfiles_filters = file_filters_list.trim().split(";");
        for (var i = 0; i < tfiles_filters.length; i++) {
            var v = tfiles_filters[i].trim();
            if (v.length > 0) {
                if (accept_txt.length > 0) accept_txt += ", ";
                accept_txt += "." + v;
            }
        }
    }
    if (accept_txt.length == 0) {
        accept_txt = "*, *.*";
        tfiles_filters = "";
    }
    id('files_input_file').accept = accept_txt;
    console.log(accept_txt);
}

function init_files_panel(dorefresh) {
    displayInline('files_refresh_btn');
    displayNone('files_refresh_primary_sd_btn');
    displayNone('files_refresh_secondary_sd_btn');

    files_set_button_as_filter(files_filter_sd_list);
    var refreshlist = true;
    if (typeof dorefresh !== 'undefined') refreshlist = dorefresh;
    if (refreshlist) files_refreshFiles(files_currentPath);
}

function files_set_button_as_filter(isfilter) {
    if (!isfilter) {
        id('files_filter_glyph').innerHTML = get_icon_svg("filter", "1em", "1em");
    } else {
        id('files_filter_glyph').innerHTML = get_icon_svg("list-alt", "1em", "1em");
    }
}

function files_filter_button(item) {
    files_filter_sd_list = !files_filter_sd_list;
    files_set_button_as_filter(files_filter_sd_list);
    files_build_display_filelist();
}

function formatFileSize(size) {
    nSize = Number(size);
    if (isNaN(nSize)) {
        return size;
    }
    if (nSize > 1000000000000) {
        nFix = nSize/1000000000000;
        return nFix.toFixed(2) + " TB";
    }
    if (nSize > 1000000000) {
        nFix = nSize/1000000000;
        return nFix.toFixed(2) + " GB";
    }
    if (nSize > 1000000) {
        nFix = nSize/1000000;
        return nFix.toFixed(2) + " MB";
    }
    if (nSize > 1000) {
        nFix = nSize/1000;
        return nFix.toFixed(2) + " KB";
    }
    return nSize + " B";
}

function files_build_file_line(index) {
    var content = "";
    var entry = files_file_list[index];
    var is_clickable = files_is_clickable(index);
    if ((files_filter_sd_list && entry.isprintable) || (!files_filter_sd_list)) {
        content += "<li class='list-group-item list-group-hover' >";
        content += "<div class='row'>";
        content += "<div class='col-md-5 col-sm-5 no_overflow' ";
        if (is_clickable) {
            content += "style='cursor:pointer;' onclick='files_click_file(" + index + ")'";
        }
        content += "><table><tr><td><span  style='color:DeepSkyBlue;'>";
        if (entry.isdir == true) content += get_icon_svg("folder-open");
        else content += get_icon_svg("file");
        content += "</span ></td><td>";
        content += entry.name;

        content += "</td></tr></table></div>";
        var sizecol = "col-md-2 col-sm-2 filesize";
        var timecol = "col-md-2 col-sm-2";
        var iconcol = "col-md-3 col-sm-3";
        if (!entry.isdir && entry.datetime == "") {
            sizecol = "col-md-3 col-sm-3 filesize";
            timecol = "hide_it";
            iconcol = "col-md-4 col-sm-4";
        }
        content += "<div class='" + sizecol + "'";
        if (is_clickable) {
            content += "style='cursor:pointer;' onclick='files_click_file(" + index + ")' ";
        }
        var size= formatFileSize(entry.size);
        if (entry.isdir)size="";
        content += ">" +  size + "</div>";
        content += "<div class='" + timecol + "'";
        if (is_clickable) {
            content += "style='cursor:pointer;' onclick='files_click_file(" + index + ")' ";
        }
        content += ">" + entry.datetime + "</div>";
        content += "<div class='" + iconcol + "'>";
        content += "<div class='pull-right'>";
        if (entry.isprintable) {
            content += "<button class='btn btn-xs btn-default'  onclick='files_print(" + index + ")' style='padding-top: 4px;'>";
            content += get_icon_svg("play", "1em", "1em");
            content += "</button>";
        }
        content += "&nbsp;";
        if (!entry.isdir) {
            content += "<button class='btn btn-xs btn-default' onclick='files_download(" + index + ")'  style='padding-top: 4px;'>" + get_icon_svg("download", "1em", "1em") + "</button>";
        }
        if (files_showdeletebutton(index)) {
            content += "<button class='btn btn-xs btn-danger' onclick='files_delete(" + index + ")'  style='padding-top: 4px;'>" + get_icon_svg("trash", "1em", "1em") + "</button>";
        }
        content += "<button class='btn btn-xs btn-default' onclick='files_rename(" + index + ")'  style='padding-top: 4px;'>" + get_icon_svg("wrench", "1em", "1em") + "</button>";
        content += "</div>";
        content += "</div>";
        content += "</div>";
        content += "</li>";
    }
    return content;
}

function files_print(index) {
    var file = files_file_list[index];
    var path = files_currentPath + file.name
    tabletSelectGCodeFile(file.name);
    tabletLoadGCodeFile(path, file.size);
    files_print_filename(path);
}

function files_print_filename(path) {
    var cmd = "";
    get_status();
    if (reportType == 'none') {
        tryAutoReport(); // will fall back to polled if autoreport fails
    }
    cmd = "$SD/Run=" + path;
    SendPrinterCommand(cmd);
}

function files_Createdir() {
    inputdlg(translate_text_item("Please enter directory name"), translate_text_item("Name:"), process_files_Createdir);
}

function process_files_Createdir(answer) {
    if (answer.length > 0) files_create_dir(answer.trim());
}

function files_create_dir(name) {
    var cmdpath = files_currentPath;
    var url = "/upload?path=" + encodeURIComponent(cmdpath) + "&action=createdir&filename=" + encodeURIComponent(name);
    displayBlock('files_nav_loader');
    SendGetHttp(url, files_list_success, files_list_failed);
}

function files_delete(index) {
    files_current_file_index = index;
    var msg = translate_text_item("Confirm deletion of directory: ");
    if (!files_file_list[index].isdir) msg = translate_text_item("Confirm deletion of file: ");
    confirmdlg(translate_text_item("Please Confirm"), msg + files_file_list[index].name, process_files_Delete);
}

function process_files_Delete(answer) {
    if (answer == "yes" && files_current_file_index != -1) files_delete_file(files_current_file_index);
    files_current_file_index = -1;
}

function files_delete_file(index) {
    files_error_status = "Delete " + files_file_list[index].name;
    var cmdpath = files_currentPath;
    var url = "/upload?path=" + encodeURIComponent(cmdpath) + "&action=";
    if (files_file_list[index].isdir) {
        url += "deletedir&filename=";
    } else {
        url += "delete&filename=";
    }
    url += encodeURIComponent(files_file_list[index].sdname);
    displayBlock('files_nav_loader');
    SendGetHttp(url, files_list_success, files_list_failed);
}

function files_proccess_and_update(answer) {
    displayBlock('files_navigation_buttons');
    if (answer.startsWith("{") && answer.endsWith("}")) {
        try {
            response = JSON.parse(answer);
            if (typeof response.status != 'undefined') {
                Monitor_output_Update(response.status + "\n");
                files_error_status = response.status;
                //console.log(files_error_status);
            }
        } catch (e) {
            console.error("Parsing error:", e);
            response = "Error";
        }

    } else {
        if (answer[answer.length - 1] != '\n') Monitor_output_Update(answer + "\n");
        else Monitor_output_Update(answer);
        answer = answer.replace("\nok", "");
        answer = answer.replace(/\n/gi, "");
        answer = answer.replace(/\r/gi, "");
        answer = answer.trim();
        console.log(answer)
        if (answer.length > 0) files_error_status = answer;
        else if (files_error_status.length == 0) files_error_status = "Done";
    }
    //console.log("error status:" + files_error_status);
    files_refreshFiles(files_currentPath);
}

function files_is_clickable(index) {
    return true;
}

function files_enter_dir(name) {
    files_refreshFiles(files_currentPath + name + "/", true);
}
function process_files_Createdir(answer) {
    if (answer.length > 0) files_create_dir(answer.trim());
}

var old_file_name;
function files_rename(index) {
    var entry = files_file_list[index];
    old_file_name = entry.sdname;
    inputdlg(translate_text_item("New file name"), translate_text_item("Name:"), process_files_rename, old_file_name);
}
function process_files_rename(new_file_name) {
    if (new_file_name == null || new_file_name == "") {
        return;
    }
    files_error_status = "Rename " + old_file_name;

    var cmdpath = files_currentPath;
    var url = "/upload?path=" + encodeURIComponent(cmdpath) + "&action=rename";
    url += "&filename=" + encodeURIComponent(old_file_name);
    url += "&newname=" + encodeURIComponent(new_file_name);
    displayBlock('files_nav_loader');
    SendGetHttp(url, files_list_success, files_list_failed);
}
function files_download(index) {
    var entry = files_file_list[index];
    //console.log("file on direct SD");
    var url = "SD/" + files_currentPath + entry.sdname;
    window.location.href = encodeURIComponent(url.replace("//", "/"));
}
function files_click_file(index) {
    var entry = files_file_list[index];
    if (entry.isdir) {
        files_enter_dir(entry.name);
        return;
    }
    // Don't download on click; use the button
}

function files_isgcode(filename, isdir) {
    if (isdir == true) return false;
    // This can happen if files_showprintbutton is called before the
    // files panel has been created
    if (typeof tfiles_filters == 'undefined') {
        return false;
    }
    if (tfiles_filters.length == 0) {
        return true;
    }
    for (var i = 0; i < tfiles_filters.length; i++) {
        var v = "." + tfiles_filters[i].trim();
        if (filename.endsWith(v)) return true;
    }
    return false;
}

function files_showdeletebutton(index) {
    return true;
}

function cleanpath(path){
    var p = path;
    p.trim();
    if (p[0]!='/')p="/"+p;
    if (p!="/"){
        if (p.endsWith("/")){
            p = p .substr(0, p.length - 1);
        }
    }
    return p;
}

function files_refreshFiles(path, usecache) {
    //console.log("refresh requested " + path);
    var cmdpath = path;
    files_currentPath = path;
    if (current_source != last_source){
        files_currentPath = "/";
        path="/";
        last_source = current_source;
    }
    if ((current_source==tft_sd) || (current_source==tft_usb)){
     displayNone('print_upload_btn');
    } else {
     displayBlock('print_upload_btn');
    }
    if (typeof usecache === 'undefined') usecache = false;
    id('files_currentPath').innerHTML = files_currentPath;
    files_file_list = [];
    files_status_list = [];
    clearTabletFileSelector("Refreshing file list");
    displayBlock('files_list_loader');
    displayBlock('files_nav_loader');
    var url = "/upload?path=" + encodeURI(cmdpath);
    SendGetHttp(url, files_list_success, files_list_failed);
}

function files_format_size(size) {
    var lsize = parseInt(size);
    var value = 0.0;
    var tsize = "";
    if (lsize < 1024) {
        tsize = lsize + " B";
    } else if (lsize < (1024 * 1024)) {
        value = (lsize / 1024.0);
        tsize = value.toFixed(2) + " KB";
    } else if (lsize < (1024 * 1024 * 1024)) {
        value = ((lsize / 1024.0) / 1024.0);
        tsize = value.toFixed(2) + " MB";
    } else {
        value = (((lsize / 1024.0) / 1024.0) / 1024.0);
        tsize = value.toFixed(2) + " GB";
    }
    return tsize;
}

function files_is_filename(file_name) {
    var answer = true;
    var s_name = String(file_name);
    var rg1 = /^[^\\/:\*\?"<>\|]+$/; // forbidden characters \ / : * ? " < > |
    var rg2 = /^\./; // cannot start with dot (.)
    var rg3 = /^(nul|prn|con|lpt[0-9]|com[0-9])(\.|$)/i; // forbidden file names
    //a 
    answer = rg1.test(file_name) && !rg2.test(file_name) && !rg3.test(file_name)
    if ((s_name.length == 0) || (s_name.indexOf(":") != -1) || (s_name.indexOf("..") != -1)) answer = false;

    return answer;
}

function files_list_success(response_text) {
    displayBlock('files_navigation_buttons');
    var error = false;
    var response;
    try {
        response = JSON.parse(response_text);
    } catch (e) {
        console.error("Parsing error:", e);
        error = true;
    }
    if (error || typeof response.status == 'undefined') {
        files_list_failed(406, translate_text_item("Wrong data", true));
        return;
    }
    files_file_list = [];
    if (typeof response.files != 'undefined') {
        for (var i = 0; i < response.files.length; i++) {
            var file_name = "";
            var isdirectory = false;
            var fsize = "";
            if (response.files[i].size == "-1")
                isdirectory = true;
            else
                fsize = response.files[i].size;
            file_name = response.files[i].name;
            var isprint = files_isgcode(file_name, isdirectory);
            var file_entry = {
                name: file_name,
                sdname: file_name,
                size: fsize,
                isdir: isdirectory,
                datetime: response.files[i].datetime || "",
                isprintable: isprint
            };
            files_file_list.push(file_entry);
        }
    }
    files_file_list.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    })
    var vtotal = "-1";
    var vused = "-1";
    var voccupation = "-1";
    if (typeof response.total != 'undefined') vtotal = response.total;
    if (typeof response.used != 'undefined') vused = response.used;
    if (typeof response.occupation != 'undefined') voccupation = response.occupation;
    files_status_list = [];
    files_status_list.push({
        status: translate_text_item(response.status),
        path: response.path,
        used: vused,
        total: vtotal,
        occupation: voccupation
    });
    files_build_display_filelist();
}

function files_list_failed(error_code, response) {
    displayBlock('files_navigation_buttons');
    if (esp_error_code !=0){
         alertdlg (translate_text_item("Error") + " (" + esp_error_code + ")", esp_error_message);
         esp_error_code = 0;
    } else {
        alertdlg (translate_text_item("Error"), translate_text_item("No connection"));
    }
    files_build_display_filelist(false);
}

function files_directSD_upload_failed(error_code, response) {
    if (esp_error_code !=0){
         alertdlg (translate_text_item("Error") + " (" + esp_error_code + ")", esp_error_message);
         esp_error_code = 0;
    } else {
        alertdlg (translate_text_item("Error"), translate_text_item("Upload failed"));
    }
    displayNone('files_uploading_msg');
    displayBlock('files_navigation_buttons');
}

function need_up_level() {
    return files_currentPath != "/";
}

function files_go_levelup() {
    var tlist = files_currentPath.split("/");
    var path = "/";
    var nb = 1;
    while (nb < (tlist.length - 2)) {
        path += tlist[nb] + "/";
        nb++;
    }
    files_refreshFiles(path, true);
}

function files_build_display_filelist(displaylist) {
    if (typeof displaylist == 'undefined') displaylist = true;

    populateTabletFileSelector(files_file_list, files_currentPath, 'No files');

    displayNone('files_uploading_msg');
    displayNone('files_list_loader');
    displayNone('files_nav_loader');
    if (!displaylist) {
        displayNone('files_status_sd_status');
        displayNone('files_space_sd_status');
        id('files_fileList').innerHTML = "";
        displayNone('files_fileList');
        return;
    }
    var content = "";
    if (need_up_level()) {
        content += "<li class='list-group-item list-group-hover' style='cursor:pointer' onclick='files_go_levelup()''>";
        content += "<span >" + get_icon_svg("level-up") + "</span>&nbsp;&nbsp;<span translate>Up...</span>";
        content += "</li>";
    }
    for (var index = 0; index < files_file_list.length; index++) {
        if (files_file_list[index].isdir == false) content += files_build_file_line(index);
    }
    for (index = 0; index < files_file_list.length; index++) {
        if (files_file_list[index].isdir) content += files_build_file_line(index);
    }
    displayBlock('files_fileList');
    id('files_fileList').innerHTML = content;
    if ((files_status_list.length == 0) && (files_error_status != "")) {
        files_status_list.push({
            status: files_error_status,
            path: files_currentPath,
            used: "-1",
            total: "-1",
            occupation: "-1"
        });
    }
    if (files_status_list.length > 0) {
        if (files_status_list[0].total != "-1") {
            id('files_sd_status_total').innerHTML = files_status_list[0].total;
            id('files_sd_status_used').innerHTML = files_status_list[0].used;
            id('files_sd_status_occupation').value = files_status_list[0].occupation;
            id('files_sd_status_percent').innerHTML = files_status_list[0].occupation;
            displayTable('files_space_sd_status');
        } else {
            displayNone('files_space_sd_status');
        }
        if ((files_error_status != "") && ((files_status_list[0].status.toLowerCase() == "ok") || (files_status_list[0].status.length == 0))) {
            files_status_list[0].status = files_error_status;
        }
        files_error_status = "";
        if (files_status_list[0].status.toLowerCase() != "ok") {
            id('files_sd_status_msg').innerHTML = translate_text_item(files_status_list[0].status, true);
            displayTable('files_status_sd_status');
        } else {
            displayNone('files_status_sd_status');
        }
    } else displayNone('files_space_sd_status');
}

function files_abort() {
    SendPrinterCommand("abort");
}

function files_select_upload() {
    id('files_input_file').click();
}

function files_check_if_upload() {
    var canupload = true;
    var files = id("files_input_file").files;
    var url = "/command?plain=" + encodeURIComponent("[ESP400]");
    SendGetHttp(url, process_check_sd_presence);
}

function process_check_sd_presence(answer) {
    //console.log(answer);
    if (answer.indexOf("o SD card") > -1) {
        alertdlg(translate_text_item("Upload failed"), translate_text_item("No SD card detected"));
        files_error_status = "No SD card"
        files_build_display_filelist(false);
        id('files_sd_status_msg').innerHTML = translate_text_item(files_error_status, true);
        displayTable('files_status_sd_status');
    } else files_start_upload();
}

function files_start_upload() {
    if (http_communication_locked) {
        alertdlg(translate_text_item("Busy..."), translate_text_item("Communications are currently locked, please wait and retry."));
        console.log("communication locked");
        return;
    }
    var url = "/upload";
    var path = files_currentPath;
    var files = id("files_input_file").files;

    if (files.value == "" || typeof files[0].name === 'undefined') {
        console.log("nothing to upload");
        return;
    }
    var formData = new FormData();

    formData.append('path', path);
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var arg = path + file.name + "S";
        //append file size first to check updload is complete
        formData.append(arg, file.size);
        formData.append('myfile[]', file, path + file.name);
    }
    files_error_status = "Upload " + file.name;
    id('files_currentUpload_msg').innerHTML = file.name;
    displayBlock('files_uploading_msg');
    displayNone('files_navigation_buttons');
    SendFileHttp(url, formData, FilesUploadProgressDisplay, files_list_success, files_directSD_upload_failed);
    id("files_input_file").value = "";
}


function FilesUploadProgressDisplay(oEvent) {
    if (oEvent.lengthComputable) {
        var percentComplete = (oEvent.loaded / oEvent.total) * 100;
        id('files_prg').value = percentComplete;
        id('files_percent_upload').innerHTML = percentComplete.toFixed(0);
    } else {
        // Impossible because size is unknown
    }
}
