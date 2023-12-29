(async function () {
    /*global timeAgo */

    let appState = {
        baseUrl: '',
        activeLogs: null
    };

    try {

        if (!await initAppState()) {
            return;
        }

        // console.log(sfccTabData);
        let path = $('.js-instance-name').attr('data-path');
        $('.js-instance-name')
            .attr('href', appState.baseUrl + path)
            .text(appState.baseUrl);

        initSelect(appState.baseUrl);

        $('.js-update-logs').on('click', updateLogs);

        timeAgo.init();

    } catch (e) {
        $('.js-app-status').html(e);
    }

    async function initAppState() {
        let sfccTabData = await chrome.runtime.sendMessage({
            type: "getSFCCTabData",
        });

        if (!sfccTabData || !sfccTabData.id) {
            $('.js-app-status').html("No active SFCC tabs found");
            return false;
        }

        appState.baseUrl = sfccTabData.url;
        return true;
    }

    function initSelect(baseUrl) {
        /* global Choices */
        const activeLogs = new Choices('.js-all-log-files', {
            removeItemButton: true,
            searchResultLimit: 999999,
            allowHTML: true,
            shouldSort: false,
            fuseOptions: {
                includeScore: true
            }
        });

        appState.activeLogs = activeLogs;


        loadSelectOptions(activeLogs);

        activeLogs.passedElement.element.addEventListener('addItem', (event) => {
            const item = event.detail;
            const logFileName = item.value;

            if (item.customProperties.type == 'job') {
                processJobLogs(item.value);
            } else {
                readDataInChunks(`${baseUrl}/on/demandware.servlet/webdav/Sites/Logs/${logFileName}`, (data) => {
                    $('.js-app-status').append(data);
                });
            }

            activeLogs.hideDropdown();
            timeAgo.update();
        });
        activeLogs.passedElement.element.addEventListener('removeItem', (event) => {
            timeAgo.update();
            console.log('remove', event.detail.value);
            $('.js-app-status').empty();
        });
    }

    function loadSelectOptions(activeLogs) {
        activeLogs.setChoices(async () => {
            var groups = {};

            const jobsListingResponse = await fetch(appState.baseUrl + "/on/demandware.servlet/webdav/Sites/Logs/jobs");
            const jobsListing = await jobsListingResponse.text();

            groups["jobs"] = [];
            $(jobsListing).find('a[href*="jobs"]').each(function () {
                const jobName = this.href.split('/').pop();
                const modifiedTime = $(this).closest('tr').find("td[align=right] tt").last().text();
                groups["jobs"].push({
                    label: `Job: ${jobName} - <time class="js-time-ago" data-time="${modifiedTime}" data-step="second"></time>`,
                    value: `${jobName}`,
                    customProperties: {
                        modifiedTime: new Date(modifiedTime),
                        type: 'job'
                    }
                });
            });


            const logListingResponse = await fetch(appState.baseUrl + "/on/demandware.servlet/webdav/Sites/Logs");
            const logsListing = await logListingResponse.text();

            $(logsListing).find('a[href$=".log"]').each(function () {
                const logFileName = this.href.split('/').pop();
                const modifiedTime = $(this).closest('tr').find("td[align=right] tt").last().text();
                const groupMatch = logFileName.match(/(\d{4})(\d{2})(\d{2})\.log$/);
                let groupId = 'other';
                if (groupMatch) {
                    groupId = `${groupMatch[1]} ${groupMatch[2]}  ${groupMatch[3]}`;
                }

                groups[groupId] = groups[groupId] || [];

                groups[groupId].push({
                    label: `${logFileName} - <time class="js-time-ago" data-time="${modifiedTime}" data-step="second"></time>`,
                    value: logFileName,
                    customProperties: {
                        modifiedTime: new Date(modifiedTime),
                        type: 'logFile'
                    }
                });
            });

            return Object.keys(groups).toSorted(sortDateGroupsFirst).map((groupId) => {
                return {
                    label: groupId,
                    choices: groups[groupId].toSorted(sortLogDate)
                };
            });
        });
    }

    async function updateLogs() {
        if (!appState.activeLogs) {
            $('.js-app-status').html("No logs found");
            return;
        }

        $('.js-app-status').empty();

        appState.activeLogs.getValue().forEach((item) => {
            const logFileName = item.value;

            if (item.customProperties.type == 'job') {
                processJobLogs(item.value);
            } else {
                readDataInChunks(`${appState.baseUrl}/on/demandware.servlet/webdav/Sites/Logs/${logFileName}`, (data) => {
                    $('.js-app-status').append(data);
                });
            }
        });

        loadSelectOptions(appState.activeLogs);
    }

    async function processJobLogs(jobId) {
        try {
            const response = await fetch(`${appState.baseUrl}/on/demandware.servlet/webdav/Sites/Logs/jobs/${jobId}`);
            const data = await response.text();
            const $logLinks = $(data).find('a[href$=".log"]');

            if ($logLinks.length == 0) {
                $('.js-app-status').html(`No logs were found for ${jobId}`);
                return;
            }

            const recentLogs = $logLinks
                .map((_, el) => {
                    const logFileName = el.href.split('/').pop();
                    const modifiedTime = $(el).closest('tr').find("td[align=right] tt").last().text();

                    return {
                        logFileName: `${jobId}/${logFileName}`,
                        modifiedTime: new Date(modifiedTime),
                    };
                })
                .get()
                .toSorted((a, b) => b.modifiedTime - a.modifiedTime)
                .slice(0, 1);

            recentLogs.forEach(log => {
                readDataInChunks(`${appState.baseUrl}/on/demandware.servlet/webdav/Sites/Logs/jobs/${log.logFileName}`, (data) => {
                    $('.js-app-status').append(data);
                });
            })
        } catch (e) {
            console.error(e);
            $('.js-app-status').html(`Failed to load the data for ${jobId}, ${e}`);
        }


    }

    let utf8decoder = new TextDecoder();
    async function readDataInChunks(url, onChunk) {
        const response = await fetch(url);
        const reader = response.body.getReader();
        for (; ;) {
            const { done, value } = await reader.read();
            if (value) {
                onChunk(utf8decoder.decode(value));
            }

            if (done) {
                break;
            }
        }
    }

    function sortDateGroupsFirst(a, b) {
        const aHasLetters = a.match(/[a-z]/);
        const bHasLetters = b.match(/[a-z]/);

        if (aHasLetters && bHasLetters) {
            return a.localeCompare(b);
        }

        if (aHasLetters) {
            return 1;
        }

        if (bHasLetters) {
            return -1;
        }

        return b.localeCompare(a);
    }

    function sortLogDate(a, b) {
        return b.customProperties.modifiedTime - a.customProperties.modifiedTime;
    }

})();
