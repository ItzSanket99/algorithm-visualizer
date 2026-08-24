import { useEffect, useMemo, useRef } from "react";

export default function CodeViewer({
    code,
    setCode,
    activeLine
}) {

    const textareaRef = useRef(null);
    const lineNumberRef = useRef(null);


    /*
     * =========================================================
     * LINES
     * =========================================================
     */

    const lines = useMemo(() => {
        return code.split("\n");
    }, [code]);


    /*
     * =========================================================
     * KEEP HIGHLIGHTED LINE VISIBLE
     * =========================================================
     */

    useEffect(() => {

        if (!activeLine) {
            return;
        }

        const textarea =
            textareaRef.current;

        if (!textarea) {
            return;
        }

        const lineHeight = 22;

        const targetScroll =
            Math.max(
                0,
                (activeLine - 1) * lineHeight -
                textarea.clientHeight / 2
            );

        textarea.scrollTop = targetScroll;

        if (lineNumberRef.current) {

            lineNumberRef.current.scrollTop =
                textarea.scrollTop;

        }

    }, [activeLine]);


    /*
     * =========================================================
     * SYNCHRONIZE GUTTER SCROLL
     * =========================================================
     */

    const handleScroll = () => {

        if (!textareaRef.current) {
            return;
        }

        if (!lineNumberRef.current) {
            return;
        }

        lineNumberRef.current.scrollTop =
            textareaRef.current.scrollTop;
    };


    /*
     * =========================================================
     * HANDLE CODE EDIT
     * =========================================================
     */

    const handleChange = (event) => {

        setCode(event.target.value);
    };


    /*
     * =========================================================
     * KEYBOARD HANDLING
     * =========================================================
     */

    const handleKeyDown = (event) => {

        /*
         * TAB should insert spaces instead
         * of moving focus away.
         */

        if (event.key === "Tab") {

            event.preventDefault();

            const textarea =
                textareaRef.current;

            if (!textarea) {
                return;
            }

            const start =
                textarea.selectionStart;

            const end =
                textarea.selectionEnd;

            const newCode =
                code.substring(0, start) +
                "    " +
                code.substring(end);

            setCode(newCode);


            requestAnimationFrame(() => {

                textarea.selectionStart =
                    start + 4;

                textarea.selectionEnd =
                    start + 4;

            });
        }
    };


    return (

        <div className="
            flex
            h-full
            min-h-0
            w-full
            overflow-hidden
            bg-[#0d1117]
            font-mono
        ">

            {/* =================================================
                LINE NUMBERS
               ================================================= */}

            <div
                ref={lineNumberRef}
                className="
                    w-12
                    shrink-0
                    overflow-hidden
                    border-r
                    border-[#21262d]
                    bg-[#0d1117]
                    py-2
                    text-right
                    text-[12px]
                    leading-[22px]
                    text-[#484f58]
                    select-none
                "
            >

                {lines.map((_, index) => {

                    const lineNumber =
                        index + 1;

                    const isActive =
                        lineNumber === activeLine;

                    return (

                        <div
                            key={lineNumber}
                            className={`
                                h-[22px]
                                px-3
                                ${
                                    isActive
                                        ? `
                                            bg-blue-500/20
                                            text-blue-300
                                          `
                                        : ""
                                }
                            `}
                        >
                            {lineNumber}
                        </div>

                    );

                })}

            </div>


            {/* =================================================
                CODE AREA
               ================================================= */}

            <div className="
                relative
                min-w-0
                flex-1
                overflow-hidden
            ">

                {/* CURRENT LINE HIGHLIGHTS */}

                <div
                    className="
                        pointer-events-none
                        absolute
                        inset-0
                        overflow-hidden
                    "
                >

                    {activeLine && (

                        <div
                            className="
                                absolute
                                left-0
                                right-0
                                h-[22px]
                                border-l-2
                                border-blue-500
                                bg-blue-500/15
                            "
                            style={{
                                top:
                                    (activeLine - 1) *
                                    22 + 8
                            }}
                        />

                    )}

                </div>


                {/* =================================================
                    EDITOR
                   ================================================= */}

                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onScroll={handleScroll}
                    spellCheck={false}
                    wrap="off"
                    className="
                        relative
                        z-10
                        block
                        h-full
                        w-full
                        resize-none
                        overflow-auto
                        bg-transparent
                        px-4
                        py-2
                        font-mono
                        text-[12px]
                        leading-[22px]
                        text-[#c9d1d9]
                        outline-none
                        caret-blue-400
                    "
                    style={{
                        tabSize: 4
                    }}
                />

            </div>

        </div>

    );
}