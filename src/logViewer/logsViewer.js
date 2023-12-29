(async function () {
    /*global timeAgo */

    let appState = {
        baseUrl: ''
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
        const choices = new Choices('.js-all-log-files', {
            removeItemButton: true,
            searchResultLimit: 999999,
            allowHTML: true,
            shouldSort: false,
            fuseOptions: {
                includeScore: true
            }
        });

        choices.setChoices(async () => {
            var groups = {};

            const jobsListingResponse = await fetch(baseUrl + "/on/demandware.servlet/webdav/Sites/Logs/jobs");
            const jobsListing = await jobsListingResponse.text();

            groups["jobs"] = [];
            $(jobsListing).find('a[href*="jobs"]').each(function () {
                const jobName = this.href.split('/').pop();
                const modifiedTime = $(this).closest('tr').find("td[align=right] tt").last().text();
                groups["jobs"].push({
                    label: `Job: ${jobName} - <time class="js-time-ago" data-time="${modifiedTime}" data-step="second"></time>`,
                    value: `jobs/${jobName}`,
                    customProperties: {
                        modifiedTime: new Date(modifiedTime)
                    }
                });
            });


            const logListingResponse = await fetch(baseUrl + "/on/demandware.servlet/webdav/Sites/Logs");
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
                        modifiedTime: new Date(modifiedTime)
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


        choices.passedElement.element.addEventListener('addItem', (event) => {
            console.log('add', event.detail.value);
            const logFileName = event.detail.value;
            readDataInChunks(`${baseUrl}/on/demandware.servlet/webdav/Sites/Logs/${logFileName}`, (data) => {
                $('.js-app-status').append(data);
            });
            choices.hideDropdown();
            timeAgo.update();
        });
        choices.passedElement.element.addEventListener('removeItem', (event) => {
            timeAgo.update();
            console.log('remove', event.detail.value);
            $('.js-app-status').empty();
        });
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
