//SPIFFS dialog
var SPIFFS_currentpath = "/";
var SPIFFS_currentfile = "";
var SPIFFS_upload_ongoing = false;

function SPIFFSdlg(root) {
    var modal = setactiveModal('SPIFFSdlg.html');
    if (modal == null) return;
    if (typeof root !== 'undefined') SPIFFS_currentpath = root;
    id("SPIFFS-select").value = "";
    id("SPIFFS_file_name").innerHTML = translate_text_item("No file chosen");
    displayNone("SPIFFS_uploadbtn");
    displayNone("SPIFFS_prg");
    displayNone("uploadSPIFFSmsg");
    displayNone("SPIFFS_select_files");
    showModal();
    refreshSPIFFS();
}

function closeSPIFFSDialog(msg) {
    if (SPIFFS_upload_ongoing) {
        alertdlg(translate_text_item("Busy..."), translate_text_item("Upload is ongoing, please wait and retry."));
        return;
    }
    closeModal(msg);
}

function SPIFFSnavbar() {
    var content = "<table><tr>";
    var tlist = SPIFFS_currentpath.split("/");
    var path = "/";
    var nb = 1;
    content += "<td class='tooltip'><span class='tooltip-text'>Go to root directory</span><button class='btn btn-primary'  onclick=\"SPIFFS_currentpath='/'; SPIFFSRefreshList();\">/</button></td>";
    while (nb < (tlist.length - 1)) {
        path += tlist[nb] + "/";
        content += "<td><button class='btn btn-link' onclick=\"SPIFFS_currentpath='" + path + "'; SPIFFSRefreshList();\">" + tlist[nb] + "</button></td><td>/</td>";
        nb++;
    }
    content += "</tr></table>";
    return content;
}

function SPIFFSselect_dir(directoryname) {
    SPIFFS_currentpath += directoryname + "/";
    SPIFFSRefreshList();
}

function SPIFFS_Createdir() {
    inputdlg(translate_text_item("Please enter directory name"), translate_text_item("Name:"), processSPIFFS_Createdir);
}

function processSPIFFS_Createdir(answer) {
    if (answer.length > 0) {
        id('SPIFFS_loader').style.visibility = "visible";
        fileCreateDir(FILE_VOLUME_FLASH, SPIFFS_currentpath, answer.trim(), SPIFFSsuccess, SPIFFSfailed);
    }
}

function SPIFFSDownload(url) {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = url;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

}

function processSPIFFSDelete(answer) {
    if (answer == "yes") {
        id('SPIFFS_loader').style.visibility = "visible";
        fileDelete(FILE_VOLUME_FLASH, SPIFFS_currentpath, SPIFFS_currentfile, SPIFFSsuccess, SPIFFSfailed);
    }
    SPIFFS_currentfile = "";
}

function SPIFFSDelete(filename) {
    SPIFFS_currentfile = filename;
    confirmdlg(translate_text_item("Please Confirm"), translate_text_item("Confirm deletion of file: ") + filename, processSPIFFSDelete);
}

function SPIFFSDeleteDir(filename) {
    SPIFFS_currentfile = filename;
    confirmdlg(translate_text_item("Please Confirm"), translate_text_item("Confirm deletion of directory: ") + filename, processSPIFFSDeleteDir);
}

function processSPIFFSDeleteDir(answer) {
    if (answer == "yes") {
        id('SPIFFS_loader').style.visibility = "visible";
        fileDeleteDir(FILE_VOLUME_FLASH, SPIFFS_currentpath, SPIFFS_currentfile, SPIFFSsuccess, SPIFFSfailed);
    }
    SPIFFS_currentfile = "";
}

function SPIFFSRename(filename) {
    old_file_name = filename;
    inputdlg(translate_text_item("New file name"), translate_text_item("Name:"), processSPIFFSRename, old_file_name);
}


function processSPIFFSRename(new_file_name) {
    if (new_file_name == null || new_file_name == "") {
        return;
    }
    id('SPIFFS_loader').style.visibility = "visible";
    fileRename(FILE_VOLUME_FLASH, SPIFFS_currentpath, old_file_name, new_file_name, SPIFFSsuccess, SPIFFSfailed);
}

// Used by SPIFFSnavbar()'s breadcrumb links, SPIFFSselect_dir(), and
// refreshSPIFFS() -- anything that just wants the current directory's
// listing, as opposed to a create/delete/rename mutation.
function SPIFFSRefreshList() {
    id('SPIFFS_loader').style.visibility = "visible";
    fileList(FILE_VOLUME_FLASH, SPIFFS_currentpath, SPIFFSsuccess, SPIFFSfailed);
}

function SPIFFSsuccess(response) {
    //console.log(response);
    var jsonresponse = JSON.parse(response);
    id('SPIFFS_loader').style.visibility = "hidden";
    displayBlock('refreshSPIFFSbtn');
    displayBlock("SPIFFS_select_files");
    SPIFFSdispatchfilestatus(jsonresponse);
}

function SPIFFSfailed(errorcode, response) {
    id('SPIFFS_loader').style.visibility = "hidden";
    displayBlock('refreshSPIFFSbtn');
    displayBlock('refreshSPIFFSbtn');
    alertdlg(translate_text_item("Error"), "Error " + errorcode + " : " + response);
    console.log("Error " + errorcode + " : " + response);
}

function SPIFFSbutton(filename, method, btn_class, icon) {
       return "<td width='0%'  style='vertical-align:middle'><button class=\"btn " + btn_class + " btn-xs\" style='padding: 5px 5px 0px 5px;' onclick=\"" + method + "('" + filename + "')\">" + get_icon_svg(icon) + "</button></td>";
}

function SPIFFSdispatchfilestatus(jsonresponse) {
    var content = "";
    content = translate_text_item("Total:") + " " + jsonresponse.total;
    content += "&nbsp;&nbsp;|&nbsp;&nbsp;" + translate_text_item("Used:") + " " + jsonresponse.used;
    content += "&nbsp;";
    content += "<meter min='0' max='100' high='90' value='" + jsonresponse.occupation + "'></meter>&nbsp;" + jsonresponse.occupation + "%";
    if (jsonresponse.status != "Ok") content += "<br>" + translate_text_item(jsonresponse.status);
    id('SPIFFS_status').innerHTML = content;
    content = "";
    if (SPIFFS_currentpath != "/") {
        var pos = SPIFFS_currentpath.lastIndexOf("/", SPIFFS_currentpath.length - 2)
        var previouspath = SPIFFS_currentpath.slice(0, pos + 1);
        content += "<tr style='cursor:pointer;' onclick=\"SPIFFS_currentpath='" + previouspath + "'; SPIFFSRefreshList();\"><td >" + get_icon_svg("level-up") + "</td><td colspan='4'> Up..</td></tr>";
    }
    jsonresponse.files.sort(function(a, b) {
        return compareStrings(a.name, b.name);
    });

    for (var i = 0; i < jsonresponse.files.length; i++) {
        //first display files
        if (String(jsonresponse.files[i].size) != "-1") {
            content += "<tr>";
            let filesize = jsonresponse.files[i].size;
            let pathname = jsonresponse.path;
            let filename = jsonresponse.files[i].name;
            content += "<td  style='vertical-align:middle; color:#5BC0DE'>" + get_icon_svg("file") + "</td>";
            // content += "<td  width='100%'  style='vertical-align:middle'><a href=\"" + pathname + filename + "\" target=_blank download><button  class=\"btn btn-link no_overflow\">" + filename + "</button></a></td>"
            content += "<td  width='100%'  style='vertical-align:middle'>" + filename + "</td>"
            content += "<td nowrap  style='vertical-align:middle; text-align:right'>" + filesize + "</td>";
            content += SPIFFSbutton(fileDownloadUrl(FILE_VOLUME_FLASH, pathname, filename), "SPIFFSDownload", "btn-default", "download");
            content += SPIFFSbutton(filename, "SPIFFSDelete", "btn-danger", "trash");
            content += SPIFFSbutton(filename, "SPIFFSRename", "btn-default", "wrench");
            content += "</tr>";
        }
    }

    //then display directories
    for (var i = 0; i < jsonresponse.files.length; i++) {
        if (String(jsonresponse.files[i].size) == "-1") {
            let filename = jsonresponse.files[i].name;
            content += "<tr>";
            content += "<td style='vertical-align:middle ; color:#5BC0DE'>" + get_icon_svg("folder-close") + "</td>";
            content += "<td width='100%'  style='vertical-align:middle'><button class=\"btn btn-link\" onclick=\"SPIFFSselect_dir('" + filename + "');\">" + filename + "</button></td>";
            content += "<td nowrap  style='vertical-align:middle'></td>"; // No size field
            content += "<tr></tr>";  // Spacer for nonexistent download button
            content += SPIFFSbutton(filename, "SPIFFSDeleteDir", "btn-danger", "trash");
            content += SPIFFSbutton(filename, "SPIFFSRename", "btn-default", "wrench");
            content += "</tr>";
        }

    }

    id('SPIFFS_file_list').innerHTML = content;
    id('SPIFFS_path').innerHTML = SPIFFSnavbar();
}

function refreshSPIFFS() {
    id('SPIFFS-select').value = "";
    id('uploadSPIFFSmsg').innerHTML = "";
    id("SPIFFS_file_name").innerHTML = translate_text_item("No file chosen");
    displayNone('SPIFFS_uploadbtn');
    displayNone('refreshSPIFFSbtn');
    displayNone("SPIFFS_select_files");
    SPIFFSRefreshList();
}

function checkSPIFFSfiles() {
    var files = id('SPIFFS-select').files;
    displayNone('uploadSPIFFSmsg');
    // No need to display the upload button because we will click it automatically
    // displayFiles('SPIFFS_uploadbtn');
    if (files.length > 0) {
        if (files.length == 1) {
            id("SPIFFS_file_name").innerHTML = files[0].name;
        } else {
            var tmp = translate_text_item("$n files");
            id("SPIFFS_file_name").innerHTML = tmp.replace("$n", files.length);
        }
        id('SPIFFS_uploadbtn').click();
    } else {
        id("SPIFFS_file_name").innerHTML = translate_text_item("No file chosen");
    }
}

function SPIFFSUploadProgressDisplay(oEvent) {
    if (oEvent.lengthComputable) {
        var percentComplete = (oEvent.loaded / oEvent.total) * 100;
        id('SPIFFS_prg').value = percentComplete;
        id('uploadSPIFFSmsg').innerHTML = translate_text_item("Uploading ") + SPIFFS_currentfile + " " + percentComplete.toFixed(0) + "%";
    } else {
        // Impossible because size is unknown
    }
}

function SPIFFS_UploadFile() {
    if (http_communication_locked) {
        alertdlg(translate_text_item("Busy..."), translate_text_item("Communications are currently locked, please wait and retry."));
        return;
    }
    var files = id('SPIFFS-select').files
    displayNone('SPIFFS-select_form');
    displayNone('SPIFFS_uploadbtn');
    SPIFFS_upload_ongoing = true;
    displayBlock('uploadSPIFFSmsg');
    displayBlock('SPIFFS_prg');
    if (files.length == 1) SPIFFS_currentfile = files[0].name;
    else SPIFFS_currentfile = "";
    id('uploadSPIFFSmsg').innerHTML = translate_text_item("Uploading ") + SPIFFS_currentfile;
    fileUpload(FILE_VOLUME_FLASH, SPIFFS_currentpath, files, SPIFFSUploadProgressDisplay, SPIFFSUploadsuccess, SPIFFSUploadfailed);
}

function SPIFFSUploadsuccess(response) {
    id('SPIFFS-select').value = "";
    id("SPIFFS_file_name").innerHTML = translate_text_item("No file chosen");
    displayBlock('SPIFFS-select_form');
    displayNone('SPIFFS_prg');
    displayNone('SPIFFS_uploadbtn');
    id('uploadSPIFFSmsg').innerHTML = "";
    displayBlock('refreshSPIFFSbtn');
    SPIFFS_upload_ongoing = false;
    response = response.replace("\"status\":\"Ok\"", "\"status\":\"Upload done\"");
    var jsonresponse = JSON.parse(response);
    SPIFFSdispatchfilestatus(jsonresponse);
}

function SPIFFSUploadfailed(errorcode, response) {
    displayBlock('SPIFFS-select_form');
    displayNone('SPIFFS_prg');
    displayBlock('SPIFFS_uploadbtn');
    id('uploadSPIFFSmsg').innerHTML = "";
    displayNone("uploadSPIFFSmsg");
    displayBlock('refreshSPIFFSbtn');
    console.log("Error " + errorcode + " : " + response);
    if (esp_error_code !=0){
         alertdlg (translate_text_item("Error") + " (" + esp_error_code + ")", esp_error_message);
         id('SPIFFS_status').innerHTML = translate_text_item("Error : ") + esp_error_message;
         esp_error_code = 0;
    } else {
        alertdlg (translate_text_item("Error"), "Error " + errorcode + " : " + response);
        id('SPIFFS_status').innerHTML = translate_text_item("Upload failed : ") + errorcode;
    }
    SPIFFS_upload_ongoing = false;
    refreshSPIFFS();
}
