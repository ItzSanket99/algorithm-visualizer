import { useMemo, useState } from "react";

import CodeViewer from "./components/CodeViewer";
import CallTree from "./components/CallTree";
import ExecutionState from "./components/ExecutionState";
import QueuePanel, {
    buildQueueStates
} from "./components/QueuePanel";
import StackVisualizer from "./components/StackVisualizer";

import { executeCode } from "./services/executionApi";


/* =========================================================
   DEFAULT CODE
   ========================================================= */

const DEFAULT_CODE = `public class Test {

    public static void main(String[] args) {

        System.out.println(
            fib(4)
        );
    }

    static int fib(int n) {

        if (n <= 1) {
            return n;
        }

        return fib(n - 1) + fib(n - 2);
    }
}`;


/* =========================================================
   ARRAY HELPERS
   ========================================================= */

function isArrayValue(value) {

    if (typeof value !== "string") {
        return false;
    }

    const text = value.trim();

    return (
        text.startsWith("[") &&
        text.endsWith("]")
    );
}


function parseArrayValue(value) {

    if (!isArrayValue(value)) {
        return [];
    }

    const content =
        value
            .trim()
            .slice(1, -1)
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


/*
 * =========================================================
 * ARRAY VARIABLES
 * =========================================================
 */

function getArrayVariables(event) {

    if (!event) {
        return {};
    }

    const variables =
        event.variables || {};

    const parameters =
        event.parameters || {};

    const arrays = {};


    /*
     * LOCAL VARIABLES
     */

    Object.entries(
        variables
    ).forEach(
        ([name, value]) => {

            if (name === "args") {
                return;
            }

            /*
             * Don't duplicate array parameters.
             */

            if (
                Object.prototype
                    .hasOwnProperty
                    .call(
                        parameters,
                        name
                    )
            ) {
                return;
            }

            if (
                isArrayValue(value)
            ) {

                arrays[name] =
                    value;
            }

        }
    );


    /*
     * ARRAY PARAMETERS
     *
     * Important for:
     *
     * selectionSort(int[] arr)
     */

    Object.entries(
        parameters
    ).forEach(
        ([name, value]) => {

            if (name === "args") {
                return;
            }

            if (
                isArrayValue(value)
            ) {

                if (
                    !Object.prototype
                        .hasOwnProperty
                        .call(
                            arrays,
                            name
                        )
                ) {

                    arrays[name] =
                        value;
                }

            }

        }
    );


    return arrays;
}


/* =========================================================
   ARRAY STATE EXTRACTION
   =========================================================
   
   IMPORTANT:
   
   Every LINE_EXECUTED event containing an array
   is retained.

   We DO NOT remove duplicate array snapshots.

   This is required for algorithms like Selection Sort
   where i / j / minIndex change while the array stays
   unchanged.
   ========================================================= */

function buildArrayStates(events) {

    const states = [];

    let previousArrays = {};


    for (
        const event of events
    ) {

        if (
            event.eventType !==
            "LINE_EXECUTED"
        ) {
            continue;
        }


        const arrays =
            getArrayVariables(
                event
            );


        if (
            Object.keys(arrays).length === 0
        ) {
            continue;
        }


        states.push({

            event,

            arrays,

            previousArrays

        });


        previousArrays = {
            ...arrays
        };

    }


    return states;
}


/* =========================================================
   STACK HELPERS
   ========================================================= */

function isStackValue(value) {

    return (
        typeof value === "string" &&
        value
            .trim()
            .startsWith("STACK:[") &&
        value
            .trim()
            .endsWith("]")
    );
}


function parseStackValue(value) {

    if (!isStackValue(value)) {
        return [];
    }


    const text =
        value
            .trim()
            .slice(7, -1)
            .trim();


    if (!text) {
        return [];
    }


    const result = [];

    let current = "";
    let depth = 0;


    for (
        let i = 0;
        i < text.length;
        i++
    ) {

        const char =
            text[i];


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


function getStackVariables(event) {

    if (!event) {
        return {};
    }


    const variables =
        event.variables || {};

    const stacks = {};


    Object.entries(
        variables
    ).forEach(
        ([name, value]) => {

            if (name === "args") {
                return;
            }


            if (
                isStackValue(value)
            ) {

                stacks[name] =
                    value;
            }

        }
    );


    return stacks;
}


/* =========================================================
   STACK OPERATION
   ========================================================= */

function getStackOperation(
    sourceCode,
    lineNumber
) {

    if (
        !sourceCode ||
        !lineNumber
    ) {
        return "EXECUTE";
    }


    const lines =
        sourceCode.split("\n");


    const line =
        (
            lines[
                lineNumber - 1
            ] || ""
        ).trim();


    if (
        /\.push\s*\(/.test(line)
    ) {
        return "PUSH";
    }


    if (
        /\.pop\s*\(/.test(line)
    ) {
        return "POP";
    }


    if (
        /\.peek\s*\(/.test(line)
    ) {
        return "PEEK";
    }


    if (
        /\.(isEmpty|empty)\s*\(/.test(line)
    ) {
        return "IS EMPTY";
    }


    if (
        /\.search\s*\(/.test(line)
    ) {
        return "SEARCH";
    }


    if (
        /new\s+Stack\s*</.test(line) ||
        /new\s+Stack\s*\(/.test(line)
    ) {
        return "CREATE";
    }


    return "EXECUTE";
}


/* =========================================================
   STACK OPERATION VALUE
   ========================================================= */

function getStackOperationValue(
    operation,
    current,
    previous
) {

    if (
        operation === "PUSH" &&
        current.length > previous.length
    ) {

        return current[
            current.length - 1
        ];
    }


    if (
        operation === "POP" &&
        current.length < previous.length
    ) {

        return previous[
            previous.length - 1
        ];
    }


    if (
        operation === "PEEK" &&
        current.length > 0
    ) {

        return current[
            current.length - 1
        ];
    }


    if (
        operation === "IS EMPTY"
    ) {

        return current.length === 0
            ? "true"
            : "false";
    }


    if (
        operation === "CREATE"
    ) {

        return current.length === 0
            ? "empty"
            : `${current.length} elements`;
    }


    return "—";
}


/* =========================================================
   STACK STATE EXTRACTION
   ========================================================= */

function buildStackStates(
    events,
    sourceCode
) {

    const states = [];

    let previousStacks = {};


    for (
        const event of events
    ) {

        if (
            event.eventType !==
            "LINE_EXECUTED"
        ) {
            continue;
        }


        const stacks =
            getStackVariables(
                event
            );


        if (
            Object.keys(stacks).length === 0
        ) {
            continue;
        }


        const name =
            Object.keys(stacks)[0];


        const stack =
            parseStackValue(
                stacks[name]
            );


        const previousValue =
            previousStacks[name] ||
            "STACK:[]";


        const previousStack =
            parseStackValue(
                previousValue
            );


        const operation =
            getStackOperation(
                sourceCode,
                event.lineNumber
            );


        states.push({

            event,

            name,

            stack,

            previousStack,

            operation,

            operationValue:
                getStackOperationValue(
                    operation,
                    stack,
                    previousStack
                )

        });


        previousStacks = {
            ...stacks
        };

    }


    return states;
}


/* =========================================================
   LINKED LIST HELPERS
   =========================================================
   
   Backend representation:
   
   LINKED_LIST:[10 -> 20 -> 30]
   
   or
   
   LINKED_LIST:[10 -> 20 -> 30 -> 40]
   ========================================================= */

function isLinkedListValue(value) {

    return (
        typeof value === "string" &&
        value
            .trim()
            .startsWith("LINKED_LIST:[") &&
        value
            .trim()
            .endsWith("]")
    );
}


/*
 * Convert:
 *
 * LINKED_LIST:[10 -> 20 -> 30]
 *
 * into:
 *
 * ["10", "20", "30"]
 */

function parseLinkedListValue(value) {

    if (!isLinkedListValue(value)) {
        return [];
    }


    const text =
        value
            .trim()
            .slice(
                "LINKED_LIST:[".length,
                -1
            )
            .trim();


    if (!text) {
        return [];
    }


    return text
        .split("->")
        .map(
            item =>
                item.trim()
        )
        .filter(
            item =>
                item.length > 0
        );
}


/*
 * Get Linked List variables from
 * one execution event.
 */

function getLinkedListVariables(event) {

    if (!event) {
        return {};
    }


    const variables =
        event.variables || {};

    const parameters =
        event.parameters || {};

    const lists = {};


    Object.entries(
        variables
    ).forEach(
        ([name, value]) => {

            /*
             * Ignore method parameters
             * and main args.
             */

            if (name === "args") {
                return;
            }


            if (
                Object.prototype
                    .hasOwnProperty
                    .call(
                        parameters,
                        name
                    )
            ) {
                return;
            }


            if (
                isLinkedListValue(value)
            ) {

                lists[name] =
                    value;
            }

        }
    );


    /*
     * Linked List parameters
     */

    Object.entries(
        parameters
    ).forEach(
        ([name, value]) => {

            if (name === "args") {
                return;
            }


            if (
                isLinkedListValue(value)
            ) {

                if (
                    !Object.prototype
                        .hasOwnProperty
                        .call(
                            lists,
                            name
                        )
                ) {

                    lists[name] =
                        value;
                }

            }

        }
    );


    return lists;
}


/* =========================================================
   LINKED LIST STATE EXTRACTION
   ========================================================= */

function buildLinkedListStates(events) {

    const states = [];

    let previousLists = {};


    for (
        const event of events
    ) {

        if (
            event.eventType !==
            "LINE_EXECUTED"
        ) {
            continue;
        }


        const lists =
            getLinkedListVariables(
                event
            );


        if (
            Object.keys(lists).length === 0
        ) {
            continue;
        }


        /*
         * Use every LINE_EXECUTED event.
         *
         * This is important because traversal can
         * change "current" even when "head" stays
         * unchanged.
         */

        states.push({

            event,

            lists,

            previousLists

        });


        previousLists = {
            ...lists
        };

    }


    return states;
}


/* =========================================================
   PARAMETER FORMATTER
   ========================================================= */

function formatParameters(parameters) {

    if (
        !parameters ||
        Object.keys(parameters).length === 0
    ) {
        return "";
    }


    return Object.entries(
        parameters
    )
        .map(
            ([name, value]) =>
                `${name}=${value}`
        )
        .join(", ");
}


/* =========================================================
   ARRAY PANEL
   ========================================================= */

function ArrayPanel({
    state
}) {

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
                        No execution state
                    </p>

                    <p className="
                        mt-2
                        text-xs
                        text-slate-500
                    ">
                        Run your code to see
                        the array visualization.
                    </p>

                </div>

            </div>
        );
    }


    const arrays =
        state.arrays || {};


    return (

        <div className="
            h-full
            overflow-auto
            p-4
        ">

            <div className="
                space-y-5
            ">

                {Object.entries(
                    arrays
                ).map(
                    ([name, value]) => {

                        const values =
                            parseArrayValue(
                                value
                            );


                        const previousValue =
                            state
                                .previousArrays
                                ?.[name];


                        const previousValues =
                            parseArrayValue(
                                previousValue
                            );


                        return (

                            <div
                                key={name}
                                className="
                                    overflow-hidden
                                    rounded-lg
                                    border
                                    border-[#30363d]
                                    bg-[#161b22]
                                "
                            >

                                <div className="
                                    flex
                                    items-center
                                    justify-between
                                    border-b
                                    border-[#30363d]
                                    px-4
                                    py-3
                                ">

                                    <div className="
                                        flex
                                        items-center
                                        gap-2
                                    ">

                                        <span className="
                                            text-sm
                                            font-semibold
                                            text-slate-200
                                        ">
                                            {name}
                                        </span>

                                        <span className="
                                            rounded
                                            border
                                            border-[#30363d]
                                            px-1.5
                                            py-0.5
                                            text-[9px]
                                            font-semibold
                                            text-[#6685ff]
                                        ">
                                            ARRAY
                                        </span>

                                    </div>


                                    <span className="
                                        text-[10px]
                                        text-slate-500
                                    ">
                                        length = {
                                            values.length
                                        }
                                    </span>

                                </div>


                                {values.length === 0 ? (

                                    <div className="
                                        flex
                                        h-24
                                        items-center
                                        justify-center
                                        text-xs
                                        text-slate-500
                                    ">
                                        Empty array
                                    </div>

                                ) : (

                                    <div className="
                                        overflow-x-auto
                                        p-4
                                    ">

                                        <div className="
                                            inline-flex
                                            min-w-full
                                            flex-col
                                        ">

                                            <div className="
                                                flex
                                                min-w-max
                                            ">

                                                {values.map(
                                                    (_, index) => (

                                                        <div
                                                            key={
                                                                `index-${index}`
                                                            }
                                                            className="
                                                                flex
                                                                w-20
                                                                justify-center
                                                                text-[10px]
                                                                text-slate-500
                                                            "
                                                        >
                                                            [{index}]
                                                        </div>

                                                    )
                                                )}

                                            </div>


                                            <div className="
                                                flex
                                                min-w-max
                                            ">

                                                {values.map(
                                                    (
                                                        currentValue,
                                                        index
                                                    ) => {

                                                        const oldValue =
                                                            previousValues[
                                                                index
                                                            ];


                                                        const changed =
                                                            oldValue !==
                                                                undefined &&
                                                            oldValue !==
                                                                currentValue;


                                                        return (

                                                            <div
                                                                key={
                                                                    `value-${index}`
                                                                }
                                                                className={`
                                                                    flex
                                                                    h-16
                                                                    w-20
                                                                    items-center
                                                                    justify-center
                                                                    border
                                                                    border-[#30363d]
                                                                    bg-[#0d1117]
                                                                    font-mono
                                                                    text-sm
                                                                    font-semibold
                                                                    ${
                                                                        changed
                                                                            ? `
                                                                                border-[#526ff5]
                                                                                bg-[#526ff5]/10
                                                                                text-[#6685ff]
                                                                              `
                                                                            : `
                                                                                text-slate-200
                                                                              `
                                                                    }
                                                                `}
                                                            >

                                                                {
                                                                    currentValue
                                                                }

                                                            </div>

                                                        );
                                                    }
                                                )}

                                            </div>


                                            <div className="
                                                flex
                                                min-w-max
                                            ">

                                                {values.map(
                                                    (
                                                        currentValue,
                                                        index
                                                    ) => {

                                                        const oldValue =
                                                            previousValues[
                                                                index
                                                            ];


                                                        const changed =
                                                            oldValue !==
                                                                undefined &&
                                                            oldValue !==
                                                                currentValue;


                                                        return (

                                                            <div
                                                                key={
                                                                    `change-${index}`
                                                                }
                                                                className="
                                                                    flex
                                                                    h-8
                                                                    w-20
                                                                    items-center
                                                                    justify-center
                                                                    text-[9px]
                                                                "
                                                            >

                                                                {changed ? (

                                                                    <span className="
                                                                        text-[#6685ff]
                                                                    ">
                                                                        {
                                                                            oldValue
                                                                        }
                                                                        {" → "}
                                                                        {
                                                                            currentValue
                                                                        }
                                                                    </span>

                                                                ) : (

                                                                    <span className="
                                                                        text-slate-700
                                                                    ">
                                                                        —
                                                                    </span>

                                                                )}

                                                            </div>

                                                        );
                                                    }
                                                )}

                                            </div>

                                        </div>

                                    </div>

                                )}

                            </div>

                        );

                    }
                )}

            </div>

        </div>
    );
}


/* =========================================================
   STACK DATA PANEL
   ========================================================= */

function StackDataPanel({
    state
}) {

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
                        No stack execution state
                    </p>

                </div>

            </div>
        );
    }


    const stack =
        state.stack || [];


    return (

        <div className="
            h-full
            overflow-auto
            p-5
        ">

            <div className="
                flex
                flex-col
                items-center
            ">

                <div className="
                    mb-4
                    flex
                    w-full
                    items-center
                    justify-between
                ">

                    <div className="
                        flex
                        items-center
                        gap-2
                    ">

                        <span className="
                            text-sm
                            font-semibold
                            text-slate-200
                        ">
                            {state.name}
                        </span>

                        <span className="
                            rounded
                            border
                            border-[#30363d]
                            px-2
                            py-0.5
                            text-[9px]
                            font-semibold
                            text-[#6685ff]
                        ">
                            STACK
                        </span>

                    </div>


                    <span className="
                        rounded
                        border
                        border-[#30363d]
                        bg-[#161b22]
                        px-2
                        py-1
                        text-[9px]
                        font-semibold
                        text-slate-500
                    ">
                        {state.operation}
                    </span>

                </div>


                {stack.length === 0 ? (

                    <div className="
                        flex
                        h-28
                        w-64
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-dashed
                        border-[#30363d]
                        bg-[#0d1117]
                        text-xs
                        text-slate-500
                    ">
                        Empty Stack
                    </div>

                ) : (

                    <div className="
                        flex
                        flex-col-reverse
                        items-center
                        gap-1
                    ">

                        {stack.map(
                            (
                                value,
                                index
                            ) => {

                                const previousValue =
                                    state
                                        .previousStack[
                                            index
                                        ];


                                const changed =
                                    previousValue !==
                                        undefined &&
                                    previousValue !==
                                        value;


                                const isTop =
                                    index ===
                                    stack.length - 1;


                                return (

                                    <div
                                        key={
                                            `stack-${index}`
                                        }
                                        className={`
                                            relative
                                            flex
                                            min-h-[46px]
                                            w-64
                                            items-center
                                            justify-center
                                            rounded-md
                                            border
                                            border-[#30363d]
                                            px-4
                                            font-mono
                                            text-sm
                                            font-semibold
                                            ${
                                                changed
                                                    ? `
                                                        bg-[#526ff5]/15
                                                        text-[#6685ff]
                                                        ring-1
                                                        ring-inset
                                                        ring-[#526ff5]
                                                      `
                                                    : `
                                                        bg-[#161b22]
                                                        text-slate-200
                                                      `
                                            }
                                        `}
                                    >

                                        {value}


                                        {isTop && (

                                            <span className="
                                                absolute
                                                -right-16
                                                text-[9px]
                                                font-semibold
                                                text-[#6685ff]
                                            ">
                                                TOP →
                                            </span>

                                        )}

                                    </div>

                                );

                            }
                        )}

                    </div>

                )}


                <div className="
                    mt-4
                    text-[10px]
                    text-slate-500
                ">
                    size = {stack.length}
                </div>


                <div className="
                    mt-1
                    font-mono
                    text-[10px]
                    text-[#6685ff]
                ">
                    Line {
                        state.event?.lineNumber ??
                        "—"
                    }
                </div>

            </div>

        </div>
    );
}


/* =========================================================
   LINKED LIST PANEL
   ========================================================= */

function LinkedListPanel({
    state
}) {

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
                        No linked list state
                    </p>

                    <p className="
                        mt-2
                        text-xs
                        text-slate-500
                    ">
                        Run your code to see
                        the linked list visualization.
                    </p>

                </div>

            </div>
        );
    }


    const lists =
        state.lists || {};


    return (

        <div className="
            h-full
            overflow-auto
            p-5
        ">

            <div className="
                space-y-6
            ">

                {Object.entries(
                    lists
                ).map(
                    ([name, value]) => {

                        const values =
                            parseLinkedListValue(
                                value
                            );


                        const previousValue =
                            state
                                .previousLists
                                ?.[name];


                        const previousValues =
                            parseLinkedListValue(
                                previousValue
                            );


                        return (

                            <div
                                key={name}
                                className="
                                    rounded-lg
                                    border
                                    border-[#30363d]
                                    bg-[#161b22]
                                    p-4
                                "
                            >

                                {/* HEADER */}

                                <div className="
                                    mb-5
                                    flex
                                    items-center
                                    justify-between
                                ">

                                    <div className="
                                        flex
                                        items-center
                                        gap-2
                                    ">

                                        <span className="
                                            text-sm
                                            font-semibold
                                            text-slate-200
                                        ">
                                            {name}
                                        </span>

                                        <span className="
                                            rounded
                                            border
                                            border-[#30363d]
                                            px-2
                                            py-0.5
                                            text-[9px]
                                            font-semibold
                                            text-[#6685ff]
                                        ">
                                            LINKED LIST
                                        </span>

                                    </div>


                                    <span className="
                                        text-[10px]
                                        text-slate-500
                                    ">
                                        nodes = {
                                            values.length
                                        }
                                    </span>

                                </div>


                                {/* LIST */}

                                {values.length === 0 ? (

                                    <div className="
                                        flex
                                        h-24
                                        items-center
                                        justify-center
                                        rounded-lg
                                        border
                                        border-dashed
                                        border-[#30363d]
                                        bg-[#0d1117]
                                        text-xs
                                        text-slate-500
                                    ">
                                        Empty Linked List
                                    </div>

                                ) : (

                                    <div className="
                                        overflow-x-auto
                                        pb-3
                                    ">

                                        <div className="
                                            flex
                                            min-w-max
                                            items-center
                                            px-3
                                            py-6
                                        ">

                                            {/* HEAD */}

                                            <div className="
                                                mr-3
                                                flex
                                                flex-col
                                                items-center
                                            ">

                                                <span className="
                                                    mb-2
                                                    text-[9px]
                                                    font-semibold
                                                    text-[#6685ff]
                                                ">
                                                    {name}
                                                </span>

                                                <div className="
                                                    h-2
                                                    w-2
                                                    rounded-full
                                                    bg-[#6685ff]
                                                " />

                                            </div>


                                            {values.map(
                                                (
                                                    value,
                                                    index
                                                ) => {

                                                    const previousValue =
                                                        previousValues[
                                                            index
                                                        ];


                                                    const changed =
                                                        previousValue !==
                                                            undefined &&
                                                        previousValue !==
                                                            value;


                                                    return (

                                                        <div
                                                            key={
                                                                `node-${index}`
                                                            }
                                                            className="
                                                                flex
                                                                items-center
                                                            "
                                                        >

                                                            {/* NODE */}

                                                            <div className="
                                                                flex
                                                                flex-col
                                                                items-center
                                                            ">

                                                                <div
                                                                    className={`
                                                                        relative
                                                                        flex
                                                                        h-16
                                                                        w-24
                                                                        items-center
                                                                        justify-center
                                                                        rounded-lg
                                                                        border
                                                                        ${
                                                                            changed
                                                                                ? `
                                                                                    border-[#526ff5]
                                                                                    bg-[#526ff5]/15
                                                                                    text-[#6685ff]
                                                                                    shadow-[0_0_12px_rgba(82,111,245,0.18)]
                                                                                  `
                                                                                : `
                                                                                    border-[#30363d]
                                                                                    bg-[#0d1117]
                                                                                    text-slate-200
                                                                                  `
                                                                        }
                                                                    `}
                                                                >

                                                                    <span className="
                                                                        font-mono
                                                                        text-sm
                                                                        font-semibold
                                                                    ">
                                                                        {value}
                                                                    </span>


                                                                    <span className="
                                                                        absolute
                                                                        -top-4
                                                                        text-[8px]
                                                                        text-slate-600
                                                                    ">
                                                                        {index}
                                                                    </span>

                                                                </div>


                                                                {changed && (

                                                                    <span className="
                                                                        mt-2
                                                                        whitespace-nowrap
                                                                        font-mono
                                                                        text-[8px]
                                                                        text-[#6685ff]
                                                                    ">
                                                                        {
                                                                            previousValue
                                                                        }
                                                                        {" → "}
                                                                        {
                                                                            value
                                                                        }
                                                                    </span>

                                                                )}

                                                            </div>


                                                            {/* ARROW */}

                                                            <div className="
                                                                flex
                                                                items-center
                                                                px-2
                                                            ">

                                                                <span className="
                                                                    text-lg
                                                                    text-slate-500
                                                                ">
                                                                    →
                                                                </span>

                                                            </div>

                                                        </div>

                                                    );

                                                }
                                            )}


                                            {/* NULL */}

                                            <div className="
                                                flex
                                                h-16
                                                min-w-16
                                                items-center
                                                justify-center
                                                rounded-lg
                                                border
                                                border-dashed
                                                border-[#30363d]
                                                bg-[#0d1117]
                                                px-3
                                                font-mono
                                                text-xs
                                                text-slate-500
                                            ">
                                                null
                                            </div>

                                        </div>

                                    </div>

                                )}


                                {/* FOOTER */}

                                <div className="
                                    mt-2
                                    flex
                                    items-center
                                    justify-between
                                    border-t
                                    border-[#30363d]
                                    pt-3
                                ">

                                    <span className="
                                        text-[10px]
                                        text-slate-500
                                    ">
                                        State during execution
                                    </span>

                                    <span className="
                                        font-mono
                                        text-[10px]
                                        text-[#6685ff]
                                    ">
                                        Line {
                                            state.event
                                                ?.lineNumber ??
                                            "—"
                                        }
                                    </span>

                                </div>

                            </div>

                        );

                    }
                )}

            </div>

        </div>
    );
}


/* =========================================================
   APP
   ========================================================= */

export default function App() {

    /* =====================================================
       SOURCE
       ===================================================== */

    const [sourceCode, setSourceCode] =
        useState(
            DEFAULT_CODE
        );


    /* =====================================================
       EXECUTION
       ===================================================== */

    const [execution, setExecution] =
        useState(null);


    /* =====================================================
       VISUALIZATION MODE
       ===================================================== */

    const [visualizationMode, setVisualizationMode] =
        useState("auto");


    /* =====================================================
       PLAYBACK INDEXES
       ===================================================== */

    const [currentCallIndex, setCurrentCallIndex] =
        useState(0);

    const [currentArrayIndex, setCurrentArrayIndex] =
        useState(0);

    const [currentQueueIndex, setCurrentQueueIndex] =
        useState(0);

    const [currentStackIndex, setCurrentStackIndex] =
        useState(0);

    const [currentLinkedListIndex, setCurrentLinkedListIndex] =
        useState(0);


    /* =====================================================
       RUN STATE
       ===================================================== */

    const [isRunning, setIsRunning] =
        useState(false);


    /* =====================================================
       ERROR
       ===================================================== */

    const [error, setError] =
        useState(null);


    /* =====================================================
       EVENTS
       ===================================================== */

    const events =
        execution?.events || [];


    /* =====================================================
       RECURSION CALLS
       ===================================================== */

    const callEvents =
        useMemo(
            () =>
                events.filter(
                    event =>
                        event.eventType ===
                        "METHOD_ENTER"
                ),
            [events]
        );


    /* =====================================================
       ARRAY STATES
       ===================================================== */

    const arrayStates =
        useMemo(
            () =>
                buildArrayStates(
                    events
                ),
            [events]
        );


    /* =====================================================
       QUEUE STATES
       ===================================================== */

    const queueStates =
        useMemo(
            () =>
                buildQueueStates(
                    events
                ),
            [events]
        );


    /* =====================================================
       STACK STATES
       ===================================================== */

    const stackStates =
        useMemo(
            () =>
                buildStackStates(
                    events,
                    sourceCode
                ),
            [
                events,
                sourceCode
            ]
        );


    /* =====================================================
       LINKED LIST STATES
       ===================================================== */

    const linkedListStates =
        useMemo(
            () =>
                buildLinkedListStates(
                    events
                ),
            [events]
        );


    /* =====================================================
       AUTO MODE
       =====================================================
       
       Existing priority is preserved:
       
       Array
       Stack
       Queue
       Recursion
       
       Linked List is added after Queue so existing
       behavior is not disturbed.
       ===================================================== */

    const effectiveMode =
        visualizationMode === "auto"
            ? (
                arrayStates.length > 0
                    ? "array"
                    : stackStates.length > 0
                        ? "stack"
                        : queueStates.length > 0
                            ? "queue"
                            : linkedListStates.length > 0
                                ? "linked-list"
                                : "recursion"
            )
            : visualizationMode;


    /* =====================================================
       CURRENT RECURSION CALL
       ===================================================== */

    const currentCall =
        callEvents[
            currentCallIndex
        ] || null;


    /* =====================================================
       RECURSION LINE EVENT
       ===================================================== */

    function getLineEventForCall(call) {

        if (!call) {
            return null;
        }


        const lineEvents =
            events.filter(
                event =>
                    event.eventType ===
                        "LINE_EXECUTED" &&
                    String(
                        event.callId
                    ) ===
                    String(
                        call.callId
                    )
            );


        if (
            lineEvents.length > 0
        ) {

            return (
                lineEvents[
                    lineEvents.length - 1
                ]
            );
        }


        return call;
    }


    const currentRecursionEvent =
        getLineEventForCall(
            currentCall
        );


    const previousCall =
        callEvents[
            currentCallIndex - 1
        ] || null;


    const previousRecursionEvent =
        getLineEventForCall(
            previousCall
        );


    /* =====================================================
       CURRENT ARRAY STATE
       ===================================================== */

    const currentArrayState =
        arrayStates[
            currentArrayIndex
        ] || null;


    const previousArrayState =
        arrayStates[
            currentArrayIndex - 1
        ] || null;


    /* =====================================================
       CURRENT QUEUE STATE
       ===================================================== */

    const currentQueueState =
        queueStates[
            currentQueueIndex
        ] || null;


    const previousQueueState =
        queueStates[
            currentQueueIndex - 1
        ] || null;


    /* =====================================================
       CURRENT STACK STATE
       ===================================================== */

    const currentStackState =
        stackStates[
            currentStackIndex
        ] || null;


    const previousStackState =
        stackStates[
            currentStackIndex - 1
        ] || null;


    /* =====================================================
       CURRENT LINKED LIST STATE
       ===================================================== */

    const currentLinkedListState =
        linkedListStates[
            currentLinkedListIndex
        ] || null;


    const previousLinkedListState =
        linkedListStates[
            currentLinkedListIndex - 1
        ] || null;


    /* =====================================================
       ACTIVE EVENT
       ===================================================== */

    const activeEvent =
        effectiveMode === "array"
            ? currentArrayState?.event
            : effectiveMode === "queue"
                ? currentQueueState?.event
                : effectiveMode === "stack"
                    ? currentStackState?.event
                    : effectiveMode === "linked-list"
                        ? currentLinkedListState?.event
                        : currentRecursionEvent;


    /* =====================================================
       PREVIOUS ACTIVE EVENT
       ===================================================== */

    const previousActiveEvent =
        effectiveMode === "array"
            ? previousArrayState?.event
            : effectiveMode === "queue"
                ? previousQueueState?.event
                : effectiveMode === "stack"
                    ? previousStackState?.event
                    : effectiveMode === "linked-list"
                        ? previousLinkedListState?.event
                        : previousRecursionEvent;


    /* =====================================================
       ACTIVE LINE
       ===================================================== */

    const activeLine =
        activeEvent?.lineNumber ??
        null;


    /* =====================================================
       RUN CODE
       ===================================================== */

    async function handleRunCode() {

        setIsRunning(true);

        setError(null);

        setExecution(null);

        setCurrentCallIndex(0);

        setCurrentArrayIndex(0);

        setCurrentQueueIndex(0);

        setCurrentStackIndex(0);

        setCurrentLinkedListIndex(0);


        try {

            const response =
                await executeCode(
                    sourceCode
                );


            if (
                !response?.success
            ) {

                setError(
                    response?.error ||
                    "Execution failed."
                );

                return;
            }


            setExecution(
                response.execution
            );


        } catch (err) {

            console.error(
                err
            );

            setError(
                err?.response?.data?.error ||
                err?.message ||
                "Unable to connect to backend."
            );

        } finally {

            setIsRunning(false);
        }
    }


    /* =====================================================
       ARRAY PREVIOUS
       ===================================================== */

    function handlePreviousArray() {

        setCurrentArrayIndex(
            index =>
                Math.max(
                    0,
                    index - 1
                )
        );
    }


    /* =====================================================
       ARRAY NEXT
       ===================================================== */

    function handleNextArray() {

        setCurrentArrayIndex(
            index =>
                Math.min(
                    arrayStates.length - 1,
                    index + 1
                )
        );
    }


    /* =====================================================
       QUEUE PREVIOUS
       ===================================================== */

    function handlePreviousQueue() {

        setCurrentQueueIndex(
            index =>
                Math.max(
                    0,
                    index - 1
                )
        );
    }


    /* =====================================================
       QUEUE NEXT
       ===================================================== */

    function handleNextQueue() {

        setCurrentQueueIndex(
            index =>
                Math.min(
                    queueStates.length - 1,
                    index + 1
                )
        );
    }


    /* =====================================================
       STACK PREVIOUS
       ===================================================== */

    function handlePreviousStack() {

        setCurrentStackIndex(
            index =>
                Math.max(
                    0,
                    index - 1
                )
        );
    }


    /* =====================================================
       STACK NEXT
       ===================================================== */

    function handleNextStack() {

        setCurrentStackIndex(
            index =>
                Math.min(
                    stackStates.length - 1,
                    index + 1
                )
        );
    }


    /* =====================================================
       LINKED LIST PREVIOUS
       ===================================================== */

    function handlePreviousLinkedList() {

        setCurrentLinkedListIndex(
            index =>
                Math.max(
                    0,
                    index - 1
                )
        );
    }


    /* =====================================================
       LINKED LIST NEXT
       ===================================================== */

    function handleNextLinkedList() {

        setCurrentLinkedListIndex(
            index =>
                Math.min(
                    linkedListStates.length - 1,
                    index + 1
                )
        );
    }


    /* =====================================================
       CALL TREE SELECTION
       ===================================================== */

    function handleCallSelect(node) {

        if (!node) {
            return;
        }


        const callId =
            node.callId;


        const index =
            callEvents.findIndex(
                event =>
                    String(
                        event.callId
                    ) ===
                    String(
                        callId
                    )
            );


        if (index !== -1) {

            setCurrentCallIndex(
                index
            );
        }
    }


    /* =====================================================
       MODE CHANGE
       ===================================================== */

    function handleVisualizationChange(
        event
    ) {

        const value =
            event.target.value;


        setVisualizationMode(
            value
        );


        if (
            value === "array"
        ) {

            setCurrentArrayIndex(0);
        }


        if (
            value === "queue"
        ) {

            setCurrentQueueIndex(0);
        }


        if (
            value === "stack"
        ) {

            setCurrentStackIndex(0);
        }


        if (
            value === "linked-list"
        ) {

            setCurrentLinkedListIndex(0);
        }


        if (
            value === "recursion"
        ) {

            setCurrentCallIndex(0);
        }

    }


    /* =====================================================
       HEADER LABELS
       ===================================================== */

    const visualizationTitle =
        effectiveMode === "array"
            ? "Array Visualization"
            : effectiveMode === "queue"
                ? "Queue Visualization"
                : effectiveMode === "stack"
                    ? "Call Stack"
                    : effectiveMode === "linked-list"
                        ? "Linked List Visualization"
                        : "Recursion Tree";


    const visualizationDescription =
        effectiveMode === "array"
            ? "Current array state during execution."
            : effectiveMode === "queue"
                ? "Current queue state during execution."
                : effectiveMode === "stack"
                    ? "Current stack state during execution."
                    : effectiveMode === "linked-list"
                        ? "Current linked list state during execution."
                        : "Recursive calls during execution.";


    const visualizationBadge =
        effectiveMode === "array"
            ? "ARRAY"
            : effectiveMode === "queue"
                ? "QUEUE"
                : effectiveMode === "stack"
                    ? "STACK"
                    : effectiveMode === "linked-list"
                        ? "LINKED LIST"
                        : "RECURSION";


    /* =====================================================
       RENDER
       ===================================================== */

    return (

        <div className="
            min-h-screen
            bg-[#0d1117]
            px-5
            py-6
            text-[#e6edf3]
        ">


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="
                mb-5
                flex
                items-center
                justify-between
            ">

                <div>

                    <h1 className="
                        text-2xl
                        font-bold
                    ">
                        AlgoTrace
                    </h1>

                    <p className="
                        mt-1
                        text-xs
                        text-slate-500
                    ">
                        Visualize code execution
                    </p>

                </div>


                <button
                    type="button"
                    onClick={
                        handleRunCode
                    }
                    disabled={
                        isRunning
                    }
                    className="
                        rounded-lg
                        bg-[#526ff5]
                        px-5
                        py-2.5
                        text-sm
                        font-semibold
                        text-white
                        shadow-lg
                        shadow-[#526ff5]/20
                        transition
                        hover:bg-[#607cff]
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                >

                    {
                        isRunning
                            ? "Running..."
                            : "Run Code"
                    }

                </button>

            </header>


            {/* =================================================
                VISUALIZATION SELECTOR
            ================================================= */}

            <div className="
                mb-4
                flex
                items-center
                gap-3
            ">

                <label className="
                    text-xs
                    font-semibold
                    text-slate-400
                ">
                    Visualization
                </label>


                <div className="
                    relative
                ">

                    <select
                        value={
                            visualizationMode
                        }
                        onChange={
                            handleVisualizationChange
                        }
                        className="
                            min-w-[210px]
                            appearance-none
                            rounded-lg
                            border
                            border-[#30363d]
                            bg-[#161b22]
                            px-4
                            py-2.5
                            pr-10
                            text-xs
                            font-semibold
                            text-slate-200
                            outline-none
                            transition
                            focus:border-[#526ff5]
                            focus:ring-1
                            focus:ring-[#526ff5]
                        "
                    >

                        <option value="auto">
                            Auto
                        </option>

                        <option value="array">
                            Array
                        </option>

                        <option value="recursion">
                            Recursion
                        </option>

                        <option value="stack">
                            Stack
                        </option>

                        <option value="queue">
                            Queue
                        </option>

                        <option value="linked-list">
                            Linked List
                        </option>

                        <option
                            value="tree"
                            disabled
                        >
                            Tree — Coming Soon
                        </option>

                        <option
                            value="graph"
                            disabled
                        >
                            Graph — Coming Soon
                        </option>

                    </select>


                    <div className="
                        pointer-events-none
                        absolute
                        right-3
                        top-1/2
                        -translate-y-1/2
                        text-slate-500
                    ">
                        ▼
                    </div>

                </div>


                {execution && (

                    <span className="
                        rounded-md
                        border
                        border-[#30363d]
                        bg-[#161b22]
                        px-3
                        py-2
                        text-[10px]
                        font-medium
                        text-slate-500
                    ">

                        {visualizationTitle}

                    </span>

                )}

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="
                    mb-4
                    rounded-lg
                    border
                    border-red-500/30
                    bg-red-500/10
                    px-4
                    py-3
                    text-xs
                    leading-5
                    text-red-300
                ">
                    {error}
                </div>

            )}


            {/* =================================================
                MAIN TWO-PANEL AREA
            ================================================= */}

            <div className="
                grid
                grid-cols-1
                gap-3
                xl:grid-cols-2
            ">


                {/* =================================================
                    SOURCE CODE
                ================================================= */}

                <section className="
                    overflow-hidden
                    rounded-lg
                    border
                    border-[#30363d]
                    bg-[#0d1117]
                ">

                    <div className="
                        border-b
                        border-[#30363d]
                        bg-[#161b22]
                        px-3
                        py-2.5
                        text-xs
                        font-semibold
                    ">
                        Source Code
                    </div>


                    <div className="
                        h-[490px]
                        overflow-auto
                    ">

                        <CodeViewer
                            code={
                                sourceCode
                            }

                            setCode={
                                setSourceCode
                            }

                            activeLine={
                                activeLine
                            }
                        />

                    </div>

                </section>


                {/* =================================================
                    VISUALIZATION
                ================================================= */}

                <section className="
                    overflow-hidden
                    rounded-lg
                    border
                    border-[#30363d]
                    bg-[#0d1117]
                ">

                    {/* HEADER */}

                    <div className="
                        flex
                        items-center
                        justify-between
                        border-b
                        border-[#30363d]
                        bg-[#161b22]
                        px-3
                        py-2.5
                    ">

                        <div>

                            <h2 className="
                                text-xs
                                font-semibold
                            ">
                                {visualizationTitle}
                            </h2>


                            <p className="
                                mt-0.5
                                text-[10px]
                                text-slate-500
                            ">
                                {visualizationDescription}
                            </p>

                        </div>


                        <span className="
                            rounded
                            border
                            border-[#30363d]
                            px-2
                            py-1
                            text-[9px]
                            font-semibold
                            text-slate-500
                        ">
                            {visualizationBadge}
                        </span>

                    </div>


                    {/* =================================================
                        ARRAY
                    ================================================= */}

                    {effectiveMode === "array" && (

                        <div className="
                            h-[450px]
                        ">

                            {execution ? (

                                arrayStates.length > 0 ? (

                                    <ArrayPanel
                                        state={
                                            currentArrayState
                                        }
                                    />

                                ) : (

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
                                                No array detected
                                            </p>

                                            <p className="
                                                mt-2
                                                text-xs
                                                text-slate-500
                                            ">
                                                This execution does
                                                not contain an
                                                algorithm array.
                                            </p>

                                        </div>

                                    </div>

                                )

                            ) : (

                                <div className="
                                    flex
                                    h-full
                                    items-center
                                    justify-center
                                    text-xs
                                    text-slate-500
                                ">
                                    Run your code to see
                                    the array visualization.
                                </div>

                            )}

                        </div>

                    )}


                    {/* =================================================
                        QUEUE
                    ================================================= */}

                    {effectiveMode === "queue" && (

                        <div className="
                            h-[450px]
                        ">

                            {execution ? (

                                queueStates.length > 0 ? (

                                    <QueuePanel
                                        state={
                                            currentQueueState
                                        }
                                    />

                                ) : (

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
                                                No queue detected
                                            </p>

                                            <p className="
                                                mt-2
                                                text-xs
                                                text-slate-500
                                            ">
                                                This execution does
                                                not contain a
                                                supported queue.
                                            </p>

                                        </div>

                                    </div>

                                )

                            ) : (

                                <div className="
                                    flex
                                    h-full
                                    items-center
                                    justify-center
                                    text-xs
                                    text-slate-500
                                ">
                                    Run your code to see
                                    the queue visualization.
                                </div>

                            )}

                        </div>

                    )}


                    {/* =================================================
                        STACK
                    ================================================= */}

                    {effectiveMode === "stack" && (

                        <div className="
                            h-[450px]
                            overflow-auto
                        ">

                            {execution ? (

                                stackStates.length > 0 ? (

                                    <StackDataPanel
                                        state={
                                            currentStackState
                                        }
                                    />

                                ) : (

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
                                                No Stack detected
                                            </p>

                                            <p className="
                                                mt-2
                                                text-xs
                                                text-slate-500
                                            ">
                                                Use java.util.Stack
                                                in your program.
                                            </p>

                                        </div>

                                    </div>

                                )

                            ) : (

                                <div className="
                                    flex
                                    h-full
                                    items-center
                                    justify-center
                                    text-xs
                                    text-slate-500
                                ">
                                    Run your code to see
                                    the stack visualization.
                                </div>

                            )}

                        </div>

                    )}


                    {/* =================================================
                        LINKED LIST
                    ================================================= */}

                    {effectiveMode === "linked-list" && (

                        <div className="
                            h-[450px]
                            overflow-auto
                        ">

                            {execution ? (

                                linkedListStates.length > 0 ? (

                                    <LinkedListPanel
                                        state={
                                            currentLinkedListState
                                        }
                                    />

                                ) : (

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
                                                No Linked List detected
                                            </p>

                                            <p className="
                                                mt-2
                                                text-xs
                                                text-slate-500
                                            ">
                                                Use a supported linked
                                                list implementation
                                                in your program.
                                            </p>

                                        </div>

                                    </div>

                                )

                            ) : (

                                <div className="
                                    flex
                                    h-full
                                    items-center
                                    justify-center
                                    text-xs
                                    text-slate-500
                                ">
                                    Run your code to see
                                    the linked list visualization.
                                </div>

                            )}

                        </div>

                    )}


                    {/* =================================================
                        RECURSION
                    ================================================= */}

                    {effectiveMode === "recursion" && (

                        <div className="
                            h-[450px]
                            overflow-auto
                        ">

                            {execution ? (

                                execution.callTree ? (

                                    <CallTree
                                        root={
                                            execution.callTree
                                        }

                                        onSelect={
                                            handleCallSelect
                                        }

                                        activeCallId={
                                            currentCall
                                                ?.callId
                                        }
                                    />

                                ) : (

                                    <div className="
                                        flex
                                        h-full
                                        items-center
                                        justify-center
                                        text-xs
                                        text-slate-500
                                    ">
                                        No execution tree available.
                                    </div>

                                )

                            ) : (

                                <div className="
                                    flex
                                    h-full
                                    items-center
                                    justify-center
                                    text-xs
                                    text-slate-500
                                ">
                                    Run your code to see
                                    the recursion tree.
                                </div>

                            )}

                        </div>

                    )}

                </section>

            </div>


            {/* =================================================
                ARRAY PLAYBACK
            ================================================= */}

            {effectiveMode === "array" &&
                arrayStates.length > 0 && (

                <div className="
                    mt-3
                    flex
                    items-center
                    justify-between
                    rounded-lg
                    border
                    border-[#30363d]
                    bg-[#161b22]
                    px-4
                    py-3
                ">

                    <button
                        type="button"
                        onClick={
                            handlePreviousArray
                        }
                        disabled={
                            currentArrayIndex === 0
                        }
                        className="
                            rounded-md
                            border
                            border-[#30363d]
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-slate-300
                            transition
                            hover:bg-[#1c2530]
                            disabled:cursor-not-allowed
                            disabled:opacity-30
                        "
                    >
                        ← Previous State
                    </button>


                    <div className="
                        text-center
                    ">

                        <p className="
                            text-xs
                            font-semibold
                        ">
                            Data State{" "}
                            {currentArrayIndex + 1}
                            {" "}
                            of{" "}
                            {arrayStates.length}
                        </p>


                        <p className="
                            mt-1
                            font-mono
                            text-[10px]
                            text-[#6685ff]
                        ">
                            Line{" "}
                            {
                                currentArrayState
                                    ?.event
                                    ?.lineNumber ??
                                "—"
                            }
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={
                            handleNextArray
                        }
                        disabled={
                            currentArrayIndex >=
                            arrayStates.length - 1
                        }
                        className="
                            rounded-md
                            border
                            border-[#30363d]
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-slate-300
                            transition
                            hover:bg-[#1c2530]
                            disabled:cursor-not-allowed
                            disabled:opacity-30
                        "
                    >
                        Next State →
                    </button>

                </div>

            )}


            {/* =================================================
                QUEUE PLAYBACK
            ================================================= */}

            {effectiveMode === "queue" &&
                queueStates.length > 0 && (

                <div className="
                    mt-3
                    flex
                    items-center
                    justify-between
                    rounded-lg
                    border
                    border-[#30363d]
                    bg-[#161b22]
                    px-4
                    py-3
                ">

                    <button
                        type="button"
                        onClick={
                            handlePreviousQueue
                        }
                        disabled={
                            currentQueueIndex === 0
                        }
                        className="
                            rounded-md
                            border
                            border-[#30363d]
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-slate-300
                            transition
                            hover:bg-[#1c2530]
                            disabled:cursor-not-allowed
                            disabled:opacity-30
                        "
                    >
                        ← Previous State
                    </button>


                    <div className="
                        text-center
                    ">

                        <p className="
                            text-xs
                            font-semibold
                        ">
                            Queue State{" "}
                            {currentQueueIndex + 1}
                            {" "}
                            of{" "}
                            {queueStates.length}
                        </p>


                        <p className="
                            mt-1
                            font-mono
                            text-[10px]
                            text-[#6685ff]
                        ">
                            Line{" "}
                            {
                                currentQueueState
                                    ?.event
                                    ?.lineNumber ??
                                "—"
                            }
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={
                            handleNextQueue
                        }
                        disabled={
                            currentQueueIndex >=
                            queueStates.length - 1
                        }
                        className="
                            rounded-md
                            border
                            border-[#30363d]
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-slate-300
                            transition
                            hover:bg-[#1c2530]
                            disabled:cursor-not-allowed
                            disabled:opacity-30
                        "
                    >
                        Next State →
                    </button>

                </div>

            )}


            {/* =================================================
                STACK PLAYBACK
            ================================================= */}

            {effectiveMode === "stack" &&
                stackStates.length > 0 && (

                <div className="
                    mt-3
                    flex
                    items-center
                    justify-between
                    rounded-lg
                    border
                    border-[#30363d]
                    bg-[#161b22]
                    px-4
                    py-3
                ">

                    <button
                        type="button"
                        onClick={
                            handlePreviousStack
                        }
                        disabled={
                            currentStackIndex === 0
                        }
                        className="
                            rounded-md
                            border
                            border-[#30363d]
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-slate-300
                            transition
                            hover:bg-[#1c2530]
                            disabled:cursor-not-allowed
                            disabled:opacity-30
                        "
                    >
                        ← Previous State
                    </button>


                    <div className="
                        text-center
                    ">

                        <p className="
                            text-xs
                            font-semibold
                        ">
                            Stack State{" "}
                            {currentStackIndex + 1}
                            {" "}
                            of{" "}
                            {stackStates.length}
                        </p>


                        <p className="
                            mt-1
                            font-mono
                            text-[10px]
                            text-[#6685ff]
                        ">
                            Line{" "}
                            {
                                currentStackState
                                    ?.event
                                    ?.lineNumber ??
                                "—"
                            }
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={
                            handleNextStack
                        }
                        disabled={
                            currentStackIndex >=
                            stackStates.length - 1
                        }
                        className="
                            rounded-md
                            border
                            border-[#30363d]
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-slate-300
                            transition
                            hover:bg-[#1c2530]
                            disabled:cursor-not-allowed
                            disabled:opacity-30
                        "
                    >
                        Next State →
                    </button>

                </div>

            )}


            {/* =================================================
                LINKED LIST PLAYBACK
            ================================================= */}

            {effectiveMode === "linked-list" &&
                linkedListStates.length > 0 && (

                <div className="
                    mt-3
                    flex
                    items-center
                    justify-between
                    rounded-lg
                    border
                    border-[#30363d]
                    bg-[#161b22]
                    px-4
                    py-3
                ">

                    <button
                        type="button"
                        onClick={
                            handlePreviousLinkedList
                        }
                        disabled={
                            currentLinkedListIndex === 0
                        }
                        className="
                            rounded-md
                            border
                            border-[#30363d]
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-slate-300
                            transition
                            hover:bg-[#1c2530]
                            disabled:cursor-not-allowed
                            disabled:opacity-30
                        "
                    >
                        ← Previous State
                    </button>


                    <div className="
                        min-w-0
                        text-center
                    ">

                        <p className="
                            text-xs
                            font-semibold
                        ">
                            Linked List State{" "}
                            {currentLinkedListIndex + 1}
                            {" "}
                            of{" "}
                            {linkedListStates.length}
                        </p>


                        <p className="
                            mt-1
                            font-mono
                            text-[10px]
                            text-[#6685ff]
                        ">
                            Line{" "}
                            {
                                currentLinkedListState
                                    ?.event
                                    ?.lineNumber ??
                                "—"
                            }
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={
                            handleNextLinkedList
                        }
                        disabled={
                            currentLinkedListIndex >=
                            linkedListStates.length - 1
                        }
                        className="
                            rounded-md
                            border
                            border-[#30363d]
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-slate-300
                            transition
                            hover:bg-[#1c2530]
                            disabled:cursor-not-allowed
                            disabled:opacity-30
                        "
                    >
                        Next State →
                    </button>

                </div>

            )}


            {/* =================================================
                RECURSION PLAYBACK
            ================================================= */}

            {effectiveMode === "recursion" &&
                callEvents.length > 0 && (

                <div className="
                    mt-3
                    flex
                    items-center
                    justify-between
                    rounded-lg
                    border
                    border-[#30363d]
                    bg-[#161b22]
                    px-4
                    py-3
                ">

                    <button
                        type="button"
                        onClick={
                            () =>
                                setCurrentCallIndex(
                                    index =>
                                        Math.max(
                                            0,
                                            index - 1
                                        )
                                )
                        }
                        disabled={
                            currentCallIndex === 0
                        }
                        className="
                            rounded-md
                            border
                            border-[#30363d]
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-slate-300
                            transition
                            hover:bg-[#1c2530]
                            disabled:cursor-not-allowed
                            disabled:opacity-30
                        "
                    >
                        ← Previous
                    </button>


                    <div className="
                        min-w-0
                        flex-1
                        px-5
                        text-center
                    ">

                        <p className="
                            text-xs
                            font-semibold
                        ">

                            Call{" "}
                            {currentCallIndex + 1}
                            {" "}
                            of{" "}
                            {callEvents.length}

                        </p>


                        {currentCall && (

                            <p className="
                                mt-1
                                truncate
                                font-mono
                                text-[10px]
                                text-[#6685ff]
                            ">

                                {
                                    currentCall
                                        .methodName
                                }

                                {"("}

                                {
                                    formatParameters(
                                        currentCall
                                            .parameters
                                    )
                                }

                                {")"}

                            </p>

                        )}

                    </div>


                    <button
                        type="button"
                        onClick={
                            () =>
                                setCurrentCallIndex(
                                    index =>
                                        Math.min(
                                            callEvents.length - 1,
                                            index + 1
                                        )
                                )
                        }
                        disabled={
                            currentCallIndex >=
                            callEvents.length - 1
                        }
                        className="
                            rounded-md
                            border
                            border-[#30363d]
                            px-4
                            py-2
                            text-xs
                            font-semibold
                            text-slate-300
                            transition
                            hover:bg-[#1c2530]
                            disabled:cursor-not-allowed
                            disabled:opacity-30
                        "
                    >
                        Next →
                    </button>

                </div>

            )}


            {/* =================================================
                EXECUTION STATE
            ================================================= */}

            {execution && (

                <div className="
                    mt-3
                ">

                    <ExecutionState
                        event={
                            activeEvent
                        }

                        previousEvent={
                            previousActiveEvent
                        }
                    />

                </div>

            )}

        </div>
    );
}