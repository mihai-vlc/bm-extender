var background = {
    state: {
        sfccTabData: {
            id: "",
            url: "", // reopen tab if we don't have a tab data
        },
    },
    init: function () {
        chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
            switch (message.type) {
                case "loadContentScript": {
                    executeScript(message.scriptPath);
                    break;
                }
                case "saveSFCCTabData": {
                    background.state.sfccTabData.id = sender.tab.id;
                    background.state.sfccTabData.url = message.tabUrl;
                    chrome.storage.sync.set({
                        sfccTabData: background.state.sfccTabData,
                    });
                    break;
                }
                case "getSFCCTabData": {
                    chrome.storage.sync
                        .get({
                            sfccTabData: {
                                id: "",
                                url: "",
                            },
                        })
                        .then((data) => {
                            background.state.sfccTabData = data.sfccTabData;
                            sendResponse(background.state.sfccTabData);
                        });
                    return true;
                }
            }
        });
    },
};

function getCurrentTab(callback) {
    let queryOptions = { active: true, lastFocusedWindow: true };
    chrome.tabs.query(queryOptions, ([tab]) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
        }

        // `tab` will either be a `tabs.Tab` instance or `undefined`.
        callback(tab);
    });
}

function executeScript(scriptPath) {
    getCurrentTab((tab) => {
        if (!tab) {
            return;
        }
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: [scriptPath],
        });
    });
}

background.init();
