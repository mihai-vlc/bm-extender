(function () {
    /*global Toastify */

    window.toast = {
        error(msg) {
            const toast = Toastify({
                text: `[${new Date().toLocaleTimeString()}] - ${msg}`,
                close: true,
                duration: -1,
                oldestFirst: true,
                style: {
                    background: "#a30f27",
                },
                onClick: function () {
                    toast.hideToast();
                }
            });

            toast.showToast();
        },

        info(msg) {
            const toast = Toastify({
                text: `[${new Date().toLocaleTimeString()}] - ${msg}`,
                close: true,
                duration: -1,
                oldestFirst: true,
                style: {
                    background: "#00bcd4",
                },
                onClick: function () {
                    toast.hideToast();
                }
            });

            toast.showToast();
        }
    }

})();
