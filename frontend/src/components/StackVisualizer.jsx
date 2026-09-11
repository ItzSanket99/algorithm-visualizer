import React from "react";


/* =========================================================
   STACK VALUE PARSER
   ========================================================= */

function parseStackValue(value) {

    if (typeof value !== "string") {
        return [];
    }

    const text =
        value.trim();

    if (
        !text.startsWith("STACK:[") ||
        !text.endsWith("]")
    ) {
        return [];
    }

    const content =
        text
            .slice(7, -1)
            .trim();

    if (!content) {
        return [];
    }

    const result = [];

    let current = "";
    let depth = 0;


    for (
        let i = 0;
        i < content.length;
        i++
    ) {

        const char =
            content[i];


        if (char === "[") {

            depth++;

            current += char;

            continue;
        }


        if (char === "]") {

            depth--;

            current += char;

            continue;
        }


        if (
            char === "," &&
            depth === 0
        ) {

            result.push(
                current.trim()
            );

            current = "";

            continue;
        }


        current += char;
    }


    if (current.trim()) {

        result.push(
            current.trim()
        );
    }


    return result;
}


/* =========================================================
   STACK CELL
   ========================================================= */

function StackCell({
    value,
    isTop,
    changed
}) {

    return (

        <div
            className={`
                relative
                flex
                h-14
                w-52
                items-center
                justify-center
                border-x
                border-b
                font-mono
                text-sm
                font-semibold
                transition-all
                duration-200

                ${
                    changed
                        ? `
                            border-[#6685ff]
                            bg-[#526ff5]/15
                            text-[#aebdff]
                          `
                        : `
                            border-[#30363d]
                            bg-[#161b22]
                            text-slate-200
                          `
                }
            `}
        >

            {isTop && (

                <div className="
                    absolute
                    -right-16
                    flex
                    items-center
                    gap-1
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-[#6685ff]
                ">

                    <span>
                        TOP
                    </span>

                    <span>
                        →
                    </span>

                </div>

            )}


            {value}

        </div>
    );
}


/* =========================================================
   EMPTY STACK
   ========================================================= */

function EmptyStack() {

    return (

        <div className="
            flex
            flex-col
            items-center
        ">

            <div className="
                flex
                h-16
                w-52
                items-center
                justify-center
                rounded-t-md
                border
                border-dashed
                border-[#30363d]
                bg-[#0d1117]
                text-xs
                text-slate-600
            ">

                Stack is empty

            </div>


            <div className="
                h-1
                w-52
                bg-[#30363d]
            " />


            <div className="
                mt-2
                text-[9px]
                font-bold
                uppercase
                tracking-[0.2em]
                text-slate-600
            ">

                BASE

            </div>

        </div>
    );
}


/* =========================================================
   OPERATION BADGE
   ========================================================= */

function OperationBadge({
    operation
}) {

    const operationClass =
        operation === "PUSH"
            ? "text-[#6685ff]"
            : operation === "POP"
                ? "text-amber-400"
                : operation === "PEEK"
                    ? "text-emerald-400"
                    : "text-slate-300";


    return (

        <span
            className={`
                text-xs
                font-bold
                ${operationClass}
            `}
        >

            {operation}

        </span>
    );
}


/* =========================================================
   MAIN STACK VISUALIZER
   ========================================================= */

export default function StackVisualizer({
    state = null
}) {

    /*
     * No state
     */

    if (!state) {

        return (

            <div className="
                flex
                h-full
                items-center
                justify-center
                text-center
            ">

                <div>

                    <p className="
                        text-sm
                        font-semibold
                        text-slate-300
                    ">
                        No stack state
                    </p>

                    <p className="
                        mt-2
                        text-xs
                        text-slate-500
                    ">
                        Run code containing
                        java.util.Stack to
                        visualize it.
                    </p>

                </div>

            </div>
        );
    }


    /*
     * Current stack
     */

    const stack =
        Array.isArray(state.stack)
            ? state.stack
            : [];


    /*
     * Previous stack
     */

    const previousStack =
        Array.isArray(state.previousStack)
            ? state.previousStack
            : [];


    /*
     * Current operation
     */

    const operation =
        state.operation ||
        "EXECUTE";


    /*
     * Operation value
     */

    const operationValue =
        state.operationValue !== undefined &&
        state.operationValue !== null
            ? String(
                state.operationValue
            )
            : "—";


    /*
     * Determine changed cell.
     *
     * PUSH:
     * newly added top element.
     *
     * POP:
     * removed element is no longer
     * visible, so no current cell
     * is highlighted.
     *
     * Other operations:
     * compare current and previous.
     */

    function isChanged(index) {

        if (
            operation === "PUSH"
        ) {

            return (
                index ===
                stack.length - 1
            );
        }


        if (
            operation === "POP"
        ) {

            return false;
        }


        return (
            previousStack[index] !==
            stack[index]
        );
    }


    /*
     * =====================================================
     * RENDER
     * =====================================================
     */

    return (

        <div className="
            h-full
            w-full
            bg-[#0d1117]
        ">

            <div className="
                flex
                h-full
                min-h-0
                flex-col
            ">


                {/* =================================================
                    STACK VISUALIZATION
                ================================================= */}

                <div className="
                    flex
                    min-h-0
                    flex-1
                ">


                    {/* =================================================
                        STACK AREA
                    ================================================= */}

                    <div className="
                        flex
                        min-w-0
                        flex-1
                        items-center
                        justify-center
                        overflow-auto
                        px-8
                        py-6
                    ">

                        <div className="
                            flex
                            flex-col
                            items-center
                        ">


                            {/* TOP LABEL */}

                            {stack.length > 0 && (

                                <div className="
                                    mb-3
                                    text-[9px]
                                    font-bold
                                    uppercase
                                    tracking-[0.2em]
                                    text-[#6685ff]
                                ">

                                    TOP

                                </div>

                            )}


                            {/* =================================================
                                EMPTY
                            ================================================= */}

                            {stack.length === 0 ? (

                                <EmptyStack />

                            ) : (

                                <>

                                    {/* =================================================
                                        STACK CELLS

                                        Reverse because:

                                        index 0 = BASE
                                        last index = TOP
                                    ================================================= */}

                                    <div className="
                                        flex
                                        flex-col
                                        items-center
                                    ">

                                        {stack
                                            .slice()
                                            .reverse()
                                            .map(
                                                (
                                                    value,
                                                    reverseIndex
                                                ) => {

                                                    const actualIndex =
                                                        stack.length -
                                                        1 -
                                                        reverseIndex;


                                                    return (

                                                        <StackCell
                                                            key={
                                                                `${actualIndex}-${String(value)}`
                                                            }

                                                            value={
                                                                String(
                                                                    value
                                                                )
                                                            }

                                                            isTop={
                                                                actualIndex ===
                                                                stack.length - 1
                                                            }

                                                            changed={
                                                                isChanged(
                                                                    actualIndex
                                                                )
                                                            }
                                                        />

                                                    );
                                                }
                                            )}

                                    </div>


                                    {/* BASE */}

                                    <div className="
                                        h-1
                                        w-52
                                        rounded-b
                                        bg-[#30363d]
                                    " />


                                    <div className="
                                        mt-2
                                        text-[9px]
                                        font-bold
                                        uppercase
                                        tracking-[0.2em]
                                        text-slate-600
                                    ">

                                        BASE

                                    </div>

                                </>

                            )}

                        </div>

                    </div>


                    {/* =================================================
                        OPERATION PANEL
                    ================================================= */}

                    <div className="
                        flex
                        w-44
                        shrink-0
                        flex-col
                        justify-center
                        border-l
                        border-[#30363d]
                        bg-[#161b22]
                        px-4
                    ">


                        {/* STACK NAME */}

                        <div>

                            <p className="
                                text-[9px]
                                font-bold
                                uppercase
                                tracking-wider
                                text-slate-600
                            ">
                                Stack
                            </p>


                            <p className="
                                mt-1
                                truncate
                                font-mono
                                text-xs
                                font-semibold
                                text-slate-300
                            ">
                                {state.name || "stack"}
                            </p>

                        </div>


                        <div className="
                            my-5
                            h-px
                            bg-[#30363d]
                        " />


                        {/* OPERATION */}

                        <div>

                            <p className="
                                text-[9px]
                                font-bold
                                uppercase
                                tracking-wider
                                text-slate-600
                            ">
                                Operation
                            </p>


                            <div className="mt-1">

                                <OperationBadge
                                    operation={
                                        operation
                                    }
                                />

                            </div>

                        </div>


                        {/* VALUE */}

                        <div className="
                            mt-5
                        ">

                            <p className="
                                text-[9px]
                                font-bold
                                uppercase
                                tracking-wider
                                text-slate-600
                            ">
                                Value
                            </p>


                            <p className="
                                mt-1
                                break-all
                                font-mono
                                text-xs
                                text-slate-300
                            ">

                                {operationValue}

                            </p>

                        </div>


                        {/* SIZE */}

                        <div className="
                            mt-5
                        ">

                            <p className="
                                text-[9px]
                                font-bold
                                uppercase
                                tracking-wider
                                text-slate-600
                            ">
                                Size
                            </p>


                            <p className="
                                mt-1
                                font-mono
                                text-xs
                                text-slate-300
                            ">

                                {stack.length}

                            </p>

                        </div>


                        {/* LINE */}

                        <div className="
                            mt-5
                        ">

                            <p className="
                                text-[9px]
                                font-bold
                                uppercase
                                tracking-wider
                                text-slate-600
                            ">
                                Line
                            </p>


                            <p className="
                                mt-1
                                font-mono
                                text-xs
                                text-slate-300
                            ">

                                {
                                    state
                                        .event
                                        ?.lineNumber ??
                                    "—"
                                }

                            </p>

                        </div>


                        {/* LIFO */}

                        <div className="
                            mt-6
                            rounded-md
                            border
                            border-[#30363d]
                            bg-[#0d1117]
                            px-3
                            py-2
                        ">

                            <p className="
                                text-[9px]
                                leading-4
                                text-slate-500
                            ">

                                LIFO

                                <span className="
                                    ml-1
                                    text-slate-600
                                ">
                                    Last In, First Out
                                </span>

                            </p>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}