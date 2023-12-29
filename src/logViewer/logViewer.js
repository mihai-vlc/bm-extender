(async function () {
    /*global timeAgo */

    let appState = {
        baseUrl: '',
        logsSelector: null,
        logPanels: []
    };

    try {

        if (!await initAppState()) {
            return;
        }

        let logsFolderPath = $('.js-instance-name').attr('data-path');

        $('.js-instance-name')
            .attr('href', appState.baseUrl + logsFolderPath)
            .text(appState.baseUrl);

        initLogsSelector(appState.baseUrl);

        $('.js-update-logs').on('click', updateLogs);

        timeAgo.init();

    } catch (e) {
        console.error(e);
        window.toast.error(e);
    }

    async function initAppState() {
        let sfccTabData = await chrome.runtime.sendMessage({
            type: "getSFCCTabData",
        });

        if (!sfccTabData || !sfccTabData.id) {
            window.toast.error("No active SFCC tabs found");
            return false;
        }

        appState.baseUrl = sfccTabData.url;
        return true;
    }

    function initLogsSelector(baseUrl) {
        /* global LogPanel, LogsSelector */
        appState.logsSelector = new LogsSelector(baseUrl);

        appState.logsSelector.loadSelectOptions();

        appState.logsSelector.onAdd((event) => {
            const item = event.detail;
            const logId = item.value;
            const logType = item.customProperties.type;
            const logPanel = new LogPanel(logId, logType, baseUrl);

            logPanel.loadContent();

            appState.logPanels.push(logPanel);

            appState.logsSelector.hideDropdown();
            timeAgo.update();
        });

        appState.logsSelector.onRemove((event) => {
            appState.logPanels.forEach(panel => {
                if (panel.logId == event.detail.value) {
                    panel.destroy();
                }
            });

            timeAgo.update();
        });
    }

    async function updateLogs() {
        if (appState.logPanels.length == 0) {
            window.toast.error("No active log panels found !");
            return;
        }

        appState.logPanels.forEach((panel) => {
            panel.loadContent();
        });

        appState.logsSelector.loadSelectOptions();
    }



})();
