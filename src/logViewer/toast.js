(function () {
    /*global Toastify */

    window.toast = {
        error(msg) {
            Toastify({
                text: `[${new Date().toLocaleTimeString()}] - ${msg}`,
                close: true,
                duration: -1,
                oldestFirst: true,
                style: {
                    background: "#a30f27",
                }
            }).showToast();
        },

        info(msg) {
            Toastify({
                text: `[${new Date().toLocaleTimeString()}] - ${msg}`,
                close: true,
                duration: -1,
                oldestFirst: true,
                style: {
                    background: "#00bcd4",
                }
            }).showToast();
        }
    }

})();
