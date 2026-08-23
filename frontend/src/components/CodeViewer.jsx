import { useEffect, useRef } from "react";

export default function CodeViewer({
    sourceCode,
    currentLine,
    onChange
}) {
    const textareaRef = useRef(null);
    const highlightRef = useRef(null);

    const lines = sourceCode.split("\n");

    function handleScroll() {
        if (!textareaRef.current || !highlightRef.current) {
            return;
        }

        highlightRef.current.scrollTop =
            textareaRef.current.scrollTop;

        highlightRef.current.scrollLeft =
            textareaRef.current.scrollLeft;
    }

    useEffect(() => {
        if (!textareaRef.current || !currentLine) {
            return;
        }

        const lineHeight = 22;

        const targetTop =
            (currentLine - 1) * lineHeight;

        const visibleTop =
            textareaRef.current.scrollTop;

        const visibleBottom =
            visibleTop +
            textareaRef.current.clientHeight;

        if (
            targetTop < visibleTop ||
            targetTop + lineHeight > visibleBottom
        ) {
            textareaRef.current.scrollTop =
                Math.max(
                    0,
                    targetTop -
                        textareaRef.current.clientHeight / 2
                );
        }
    }, [currentLine]);

    return (
        <div className="code-viewer">

            {/* =================================================
                HIGHLIGHT LAYER
               ================================================= */}

            <div
                ref={highlightRef}
                className="code-highlight-layer"
                aria-hidden="true"
            >
                {lines.map((line, index) => {
                    const lineNumber = index + 1;

                    const isActive =
                        Number(currentLine) === lineNumber;

                    return (
                        <div
                            key={lineNumber}
                            className={`code-line ${
                                isActive
                                    ? "code-line-active"
                                    : ""
                            }`}
                        >
                            <span className="line-number">
                                {lineNumber}
                            </span>

                            <span className="line-content">
                                {line || " "}
                            </span>
                        </div>
                    );
                })}
            </div>


            {/* =================================================
                EDITOR
               ================================================= */}

            <textarea
                ref={textareaRef}
                className="code-editor-overlay"
                value={sourceCode}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                onScroll={handleScroll}
                spellCheck={false}
                wrap="off"
            />

        </div>
    );
}