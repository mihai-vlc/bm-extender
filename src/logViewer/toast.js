(function () {
    /*global Toastify */

    window.toast = {
        error(msg) {
            Toastify({
                text: msg,
                close: true,
                duration: -1,
                oldestFirst: true,
                style: {
                    background: "#a30f27",
                }
            }).showToast();
        }
    }

})();
