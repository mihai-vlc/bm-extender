(async function () {
    /*global timeAgo */

    var pageUrl = new URL(window.location.href);
    var initialLogFile = pageUrl.searchParams.get("logPath");

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

        $('.js-update-logs').on('click', updateAllLogs);

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
        appState.logsSelector = new LogsSelector(baseUrl, initialLogFile);

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

            appState.logPanels = appState.logPanels.filter(panel => {
                if (panel.logId == event.detail.value) {
                    panel.destroy();
                    return false;
                }
                return true;
            });

            timeAgo.update();
        });
    }

    async function updateAllLogs() {
        appState.logsSelector.loadSelectOptions();

        if (appState.logPanels.length == 0) {
            return;
        }

        appState.logPanels.forEach((panel) => {
            panel.loadContent();
        });
    }



})();
