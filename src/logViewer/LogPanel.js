(function () {
    let utf8decoder = new TextDecoder();

    class LogPanel {
        static PANEL_TEMPLATE = /*html*/`<div class="log-panel">
            <div class="log-panel-title">
                <div class="log-panel-title-info">
                    <a href="" target="_blank" class="js-log-panel-title"></a>
                    <span class="loader"></span>
                </div>
                <div class="log-panel-actions">
                    <label class="log-panel-watch log-panel-cta" title="update the content when the log file size changes">
                        <input type="checkbox" class="js-log-panel-watch" />
                        Watch Changes
                    </label>
                    <button class="js-log-panel-refresh log-panel-cta" title="refresh panel content">
                        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4"></path><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"></path></g></svg>
                    </button>
                    <button class="js-log-panel-close log-panel-cta" title="close panel">
                        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"><path d="M289.94 256l95-95A24 24 0 0 0 351 127l-95 95l-95-95a24 24 0 0 0-34 34l95 95l-95 95a24 24 0 1 0 34 34l95-95l95 95a24 24 0 0 0 34-34z" fill="currentColor"></path></svg>
                    </button>
                </div>
            </div>
            <div class="js-log-panel-content log-panel-content"></div>
        </div>`


        constructor(logId, logType, baseUrl) {
            /*global LogLexer */
            this.logId = logId;
            this.logType = logType;
            this.baseUrl = baseUrl;
            this.logLexer = new LogLexer();


            this.$panel = $(LogPanel.PANEL_TEMPLATE);
            $('.js-panels-wrapper').append(this.$panel);

            this.$panel.on('click', '.js-log-panel-refresh', this.loadContent.bind(this));
            this.$panel.on('click', '.js-log-panel-close', this.handleClose.bind(this));
            this.$panel.on('click', '.js-log-panel-watch', this.handleWatchChange.bind(this));

        }

        handleClose() {
            this.$panel.trigger('logPanelClosed', {
                id: this.logId
            });
        }

        handleWatchChange(event) {
            /*global RemoteFileWatcher*/
            if (!this.lastLogUrl) {
                window.toast.error("No log file found for this panel.");
                return;
            }

            if (this.fileWatcher && !event.target.checked) {
                this.fileWatcher.stop();
                this.fileWatcher = null;
                window.toast.info(`stopped watching ${this.logId}`);
                this.$panel.removeClass('watching');
                return;
            }

            this.fileWatcher = new RemoteFileWatcher(this.lastLogUrl, this.lastKnownLogSize);
            this.fileWatcher.addListenerNewContent(data => {
                this.processContentChunk({
                    done: true,
                    value: "<hr/>" + data
                });
            });
            this.fileWatcher.start();
            window.toast.info(`started watching ${this.logId}`);
            this.$panel.addClass('watching');
        }

        loadContent() {
            this.$panel.find('.js-log-panel-content').empty();

            if (this.logType == 'job') {
                this.processJobLogs(this.logId);
            } else {
                this.loadLogFile(this.logId);
            }
        }

        loadLogFile(logPath) {
            const logUrl = `${this.baseUrl}/on/demandware.servlet/webdav/Sites/Logs/${logPath}`;
            this.lastLogUrl = logUrl;

            this.$panel
                .find('.js-log-panel-title')
                .attr('href', logUrl)
                .html(logPath.split("/").pop());


            this.readDataInChunks(logUrl, this.processContentChunk.bind(this));
        }

        processContentChunk({ _done, value }) {

            const $content = this.$panel.find('.js-log-panel-content');
            $content.append(value);
            $content.scrollTop($content[0].scrollHeight);

            // if (value) {
            //     this.logLexer.appendChunk(value);
            // }

            // if (done) {
            //     this.logLexer.processCurrentMessage();
            //     console.log("done");
            // }
        }

        async readDataInChunks(url, onChunk) {
            const response = await fetch(url, {
                headers: {
                    Range: "bytes=0-"
                }
            });
            const reader = response.body.getReader();
            for (; ;) {
                const chunk = await reader.read();

                onChunk({
                    value: chunk.value && utf8decoder.decode(chunk.value),
                    done: chunk.done
                });

                if (chunk.done) {
                    break;
                }
            }

            const contentRange = response.headers.get('content-range') || "0-0/0";
            this.lastKnownLogSize = parseInt(contentRange.split("/")[1], 10) || 0;
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
                    this.loadLogFile(`jobs/${log.logFileName}`)
                });
            } catch (e) {
                console.error(e);
                window.toast.error(`Failed to load the data for ${jobId}, ${e}`);
            }
        }

        destroy() {
            if (this.fileWatcher) {
                this.fileWatcher.destroy();
            }


            this.$panel.remove();
        }
    }

    window.LogPanel = LogPanel;

})();
