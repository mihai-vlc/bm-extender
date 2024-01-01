(function () {
    class DragBar {
        constructor(element, target) {
            this.element = element;
            this.target = target;

            this.handleMousedown = this.handleMousedown.bind(this);
            this.handleMousemove = this.handleMousemove.bind(this);
            this.handleMouseup = this.handleMouseup.bind(this);

            this.element.addEventListener("mousedown", this.handleMousedown);

            window.addEventListener("mousemove", this.handleMousemove);
            window.addEventListener("mouseup", this.handleMouseup);
        }

        handleMousedown(event) {
            if (event.buttons == 1) {
                event.preventDefault();
                this.startPosition = event.pageY;
                this.isDragging = true;
                this.element.classList.add("active");
            }
        }

        handleMouseup() {
            this.isDragging = false;
            this.element.classList.remove("active");
        }

        handleMousemove(event) {
            if (event.buttons == 1 && this.isDragging) {
                event.preventDefault();

                const dragBarStart =
                    this.element.getBoundingClientRect().top + document.documentElement.scrollTop;
                const dragBarCenter = dragBarStart + this.element.offsetHeight / 2;

                const direction = event.movementY < 0 ? "up" : "down";
                const delta = this.startPosition - event.pageY;
                this.startPosition = event.pageY;

                if (direction == "down" && event.pageY < dragBarCenter) {
                    return;
                }

                if (direction == "up" && event.pageY > dragBarCenter) {
                    return;
                }

                this.target.style.height = `${this.target.offsetHeight - delta}px`;
            }
        }

        destroy() {
            window.removeEventListener("mousemove", this.handleMousemove);
            window.removeEventListener("mouseup", this.handleMouseup);
        }
    }

    window.DragBar = DragBar;
})();
