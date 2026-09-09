// Shared file-management transport for FluidNC's two file-serving
// endpoints. WebUIServer.cpp's /upload (SD) and /files (LocalFS) routes
// both funnel into one handleFileOps(request, volume) -- SD vs LocalFS is
// already just a Volume argument to one handler server-side, with the same
// delete/deletedir/createdir/rename action set either way. This mirrors
// that on the client: one transport, parameterized by volume, instead of
// files.js and SPIFFSdlg.js each building their own "/upload?..."/
// "/files?..." URLs.

var FILE_VOLUME_SD = "sd";
var FILE_VOLUME_FLASH = "flash";

function fileVolumeEndpoint(volume) {
    return volume === FILE_VOLUME_SD ? "/upload" : "/files";
}

// path is POSIX-absolute-style ("/", "/sub/"). Lists the directory --
// handleFileOps() always appends the listing to its response regardless of
// what action (if any) was requested, so no action param is needed here.
function fileList(volume, path, successfn, errorfn) {
    var url = fileVolumeEndpoint(volume) + "?path=" + encodeURIComponent(path);
    SendGetHttp(url, successfn, errorfn);
}

function fileOp(volume, action, path, filename, newname, successfn, errorfn) {
    var url = fileVolumeEndpoint(volume) + "?action=" + action +
        "&path=" + encodeURIComponent(path) + "&filename=" + encodeURIComponent(filename);
    if (typeof newname !== 'undefined') url += "&newname=" + encodeURIComponent(newname);
    SendGetHttp(url, successfn, errorfn);
}

function fileCreateDir(volume, path, name, successfn, errorfn) {
    fileOp(volume, "createdir", path, name, undefined, successfn, errorfn);
}

function fileDelete(volume, path, name, successfn, errorfn) {
    fileOp(volume, "delete", path, name, undefined, successfn, errorfn);
}

function fileDeleteDir(volume, path, name, successfn, errorfn) {
    fileOp(volume, "deletedir", path, name, undefined, successfn, errorfn);
}

function fileRename(volume, path, name, newname, successfn, errorfn) {
    fileOp(volume, "rename", path, name, newname, successfn, errorfn);
}

// files: a FileList (from an <input type=file>). path is the destination
// directory. Mirrors the "<path><name>S" size-marker + "myfile[]" shape
// handleFileOps()'s upload handlers expect, for either volume.
function fileUpload(volume, path, files, progressfn, successfn, errorfn) {
    var formData = new FormData();
    formData.append('path', path);
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        formData.append(path + file.name + "S", file.size);
        formData.append('myfile[]', file, path + file.name);
    }
    SendFileHttp(fileVolumeEndpoint(volume), formData, progressfn, successfn, errorfn);
}

// Raw-content URL for downloading a file directly (not through /upload or
// /files). SD-mounted files are served under "SD/", flash (LocalFS) files
// at the plain path -- see FluidPath::canonPath(), which parses a leading
// "/SD/" (or "/localfs/") path component out of the string itself and
// falls back to LocalFS when there isn't one.
function fileDownloadUrl(volume, path, name) {
    var prefix = volume === FILE_VOLUME_SD ? "SD/" : "";
    return encodeURIComponent((prefix + path + name).replace("//", "/"));
}

// Fetches a file's raw content directly (not through /upload or /files).
// path should be the file's fully-qualified name, e.g. "/sd/foo.gcode" or
// "/littlefs/foo.gcode" -- FluidPath::canonPath() on the server resolves
// the volume from that leading path component itself, so no client-side
// volume-to-prefix guessing is needed (or done) here; volume is unused,
// kept only so existing callers don't all need updating. A bare,
// unqualified path (no recognized volume component) resolves against
// LocalFS server-side, same as an unqualified path passed directly to
// canonPath() anywhere else in FluidNC.
function fileRead(volume, path, successfn, errorfn) {
    SendGetHttp(path, successfn, errorfn);
}
