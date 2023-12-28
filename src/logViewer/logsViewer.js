(async function () {
    console.log("Hello darkness my old friend");
    let appState = {
        baseUrl: ''
    };

    try {

        if (!await initAppState()) {
            return;
        }

        // console.log(sfccTabData);
        $('.js-instance-name').text(appState.baseUrl);

        initSelect(appState.baseUrl);

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
            allowHTML: false,
            shouldSort: false,
            fuseOptions: {
                includeScore: true
            }
        });

        choices.setChoices(async () => {
            const logListResponse = await fetch(baseUrl + "/on/demandware.servlet/webdav/Sites/Logs");
            const logsList = await logListResponse.text();

            var groups = {};
            $(logsList).find('a[href$=".log"]').each(function () {
                const logFileName = this.href.split('/').pop();
                const groupMatch = logFileName.match(/(\d{8})\.log$/);
                let groupId = '0';
                if (groupMatch) {
                    groupId = groupMatch[1];
                }

                groups[groupId] = groups[groupId] || [];

                groups[groupId].push({
                    label: logFileName,
                    value: logFileName
                });
            });
            return Object.keys(groups).toReversed().map((groupId) => {
                return {
                    label: groupId,
                    choices: groups[groupId]
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
        });
        choices.passedElement.element.addEventListener('removeItem', (event) => {
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

})();
