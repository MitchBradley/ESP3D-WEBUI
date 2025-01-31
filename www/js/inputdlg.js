//input dialog
function inputdlg(titledlg, textdlg, closefunc, preset) {
    var modal = setactiveModal('inputdlg.html', closefunc);
    if (modal == null) return;
    var title = modal.element.getElementsByClassName("modal-title")[0];
    var body = modal.element.getElementsByClassName("modal-text")[0];
    title.innerHTML = titledlg;
    body.innerHTML = textdlg;
    if (typeof preset !== 'undefined') id('inputldg_text').value = preset;
    else id('inputldg_text').value = "";
    showModal();
}


function closeInputModal(response) {
    var answer = "";
    if (response == "ok") {
        var input = id('inputldg_text').value;
        answer = input.trim();
    }
    closeModal(answer);
}