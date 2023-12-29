(function () {
    let utf8decoder = new TextDecoder();

    class LogPanel {
        static PANEL_TEMPLATE = /*html*/`<div class="log-panel">
            <div class="js-log-panel-title log-panel-title">PANEL HERE</div>
            <div class="js-log-panel-content log-panel-content">Content here</div>
        </div>`


        constructor(logId, logType, baseUrl) {
            this.logId = logId;
            this.logType = logType;
            this.baseUrl = baseUrl;


            this.$panel = $(LogPanel.PANEL_TEMPLATE);
            $('.js-panels-wrapper').append(this.$panel);
        }

        loadContent() {
            if (this.logType == 'job') {
                this.processJobLogs(this.logId);
            } else {
                this.$panel.find('.js-log-panel-title').html(this.logId);
                this.readDataInChunks(`${this.baseUrl}/on/demandware.servlet/webdav/Sites/Logs/${this.logId}`, (data) => {
                    this.$panel.find('.js-log-panel-content').append(data);
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
