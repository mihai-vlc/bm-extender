(function () {
    let utf8decoder = new TextDecoder();

    class LogPanel {
        static PANEL_TEMPLATE = /*html*/`<div class="log-panel">
            <div class="log-panel-title">
                <span class="js-log-panel-title"></span>
                <div class="log-panel-buttons">
                    <button class="js-log-panel-refresh" title="refresh panel content">
                        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4"></path><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"></path></g></svg>
                    </button>
                    <button class="js-log-panel-close" title="close panel">
                        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"><path d="M289.94 256l95-95A24 24 0 0 0 351 127l-95 95l-95-95a24 24 0 0 0-34 34l95 95l-95 95a24 24 0 1 0 34 34l95-95l95 95a24 24 0 0 0 34-34z" fill="currentColor"></path></svg>
                    </button>
                </div>
            </div>
            <div class="js-log-panel-content log-panel-content"></div>
        </div>`


        constructor(logId, logType, baseUrl) {
            this.logId = logId;
            this.logType = logType;
            this.baseUrl = baseUrl;


            this.$panel = $(LogPanel.PANEL_TEMPLATE);
            $('.js-panels-wrapper').append(this.$panel);

            this.$panel.on('click', '.js-log-panel-refresh', this.loadContent.bind(this));
            this.$panel.on('click', '.js-log-panel-close', this.handleClose.bind(this));
        }

        handleClose() {
            this.$panel.trigger('logPanelClosed', {
                id: this.logId
            });
        }

        loadContent() {
            this.$panel.find('.js-log-panel-content').empty();

            if (this.logType == 'job') {
                this.processJobLogs(this.logId);
            } else {
                this.$panel.find('.js-log-panel-title').html(this.logId);
                this.readDataInChunks(`${this.baseUrl}/on/demandware.servlet/webdav/Sites/Logs/${this.logId}`, (data) => {
                    const $content = this.$panel.find('.js-log-panel-content');
                    $content.append(data);
                    $content.scrollTop($content[0].scrollHeight);
                });

            }
        }


        async readDataInChunks(url, onChunk) {
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

        async processJobLogs(jobId) {

            try {
                const response = await fetch(`${this.baseUrl}/on/demandware.servlet/webdav/Sites/Logs/jobs/${jobId}`);
                const data = await response.text();
                const $logLinks = $(data).find('a[href$=".log"]');

                if ($logLinks.length == 0) {
                    window.toast.error(`No logs were found for ${jobId}`);
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
                    this.$panel.find('.js-log-panel-title').html(`${this.logId} - ${log.logFileName}`);
                    this.readDataInChunks(`${this.baseUrl}/on/demandware.servlet/webdav/Sites/Logs/jobs/${log.logFileName}`, (data) => {
                        this.$panel.find('.js-log-panel-content').append(data);
                    });
                })
            } catch (e) {
                console.error(e);
                window.toast.error(`Failed to load the data for ${jobId}, ${e}`);
            }
        }

        destroy() {
            this.$panel.remove();
        }
    }

    window.LogPanel = LogPanel;

})();
