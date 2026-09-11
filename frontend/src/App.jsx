import { useMemo, useState } from "react";

import CodeViewer from "./components/CodeViewer";
import CallTree from "./components/CallTree";
import ExecutionState from "./components/ExecutionState";

import { executeCode } from "./services/executionApi";
import StackVisualizer from "./components/StackVisualizer";


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

/*
 * Checks whether a runtime value is represented
 * as an array.
 *
 * Examples:
 *
 * [10, 20, 30]
 * [10, 99, 30, 40]
 * []
 */
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


/*
 * Convert:
 *
 * "[10, 99, 30, 40]"
 *
 * into:
 *
 * ["10", "99", "30", "40"]
 */
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

    for (let i = 0; i < content.length; i++) {

        const char = content[i];

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
 * Get all real algorithm arrays from an event.
 *
 * IMPORTANT:
 *
 * We deliberately exclude:
 *
 * args
 *
 * and every method parameter.
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
     * =====================================================
     * 1. LOCAL VARIABLES
     * =====================================================
     *
     * If a normal local variable contains an array,
     * include it.
     *
     * Example:
     *
     * int[] arr = {10, 20, 30};
     */

    Object.entries(
        variables
    ).forEach(
        ([name, value]) => {

            /*
             * String[] args is never an
             * algorithm array.
             */

            if (name === "args") {
                return;
            }


            /*
             * Include actual array values.
             */

            if (
                isArrayValue(value)
            ) {

                arrays[name] = value;
            }

        }
    );


    /*
     * =====================================================
     * 2. ARRAY PARAMETERS
     * =====================================================
     *
     * IMPORTANT:
     *
     * An algorithm array can be passed
     * into another method.
     *
     * Example:
     *
     * selectionSort(int[] arr)
     *
     * Here arr is technically a parameter,
     * but it is still the SAME algorithm array.
     *
     * Therefore we MUST include array parameters.
     */

    Object.entries(
        parameters
    ).forEach(
        ([name, value]) => {

            /*
             * Only ignore Java's main args.
             */

            if (name === "args") {
                return;
            }


            /*
             * Include parameter only if
             * it is actually an array.
             */

            if (
                isArrayValue(value)
            ) {

                /*
                 * Prefer the value already
                 * captured from local variables.
                 *
                 * Otherwise use the parameter.
                 */

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
   ========================================================= */
function buildArrayStates(events) {

    const states = [];

    let previousArrays = {};


    for (const event of events) {

        /*
         * Only actual source-line execution
         * events can become array states.
         */

        if (
            event.eventType !==
            "LINE_EXECUTED"
        ) {
            continue;
        }


        /*
         * Find every array available
         * at this execution point.
         *
         * This includes:
         *
         * - local arrays
         * - array parameters
         */

        const arrays =
            getArrayVariables(
                event
            );


        /*
         * No array at this point.
         */

        if (
            Object.keys(arrays).length === 0
        ) {
            continue;
        }


        /*
         * IMPORTANT:
         *
         * Do NOT compare snapshots here.
         *
         * Every LINE_EXECUTED event containing
         * an array is an execution state.
         *
         * Even if:
         *
         * [64,25,12,22,11]
         *
         * has not changed yet, variables such as
         *
         * i
         * j
         * minIndex
         *
         * may have changed.
         *
         * Therefore it is still a meaningful
         * execution step.
         */

        states.push({

            event,

            arrays,

            previousArrays

        });


        /*
         * Save current state for
         * visual change highlighting.
         */

        previousArrays = {
            ...arrays
        };
    }


    return states;
}


/* =========================================================
   STACK HELPERS
   ========================================================= */

/*
 * A Stack value is represented by the execution engine as:
 *
 * STACK:[10, 20, 30]
 *
 * This marker deliberately differs from normal arrays so
 * Stack objects are not accidentally treated as arrays.
 */
function isStackValue(value) {

    return (
        typeof value === "string" &&
        value.trim().startsWith("STACK:[") &&
        value.trim().endsWith("]")
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

            if (
                name === "args"
            ) {
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


        /*
         * Visualize the first Stack variable
         * available at this execution point.
         */

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
                                ?.[
                                    name
                                ];


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

                                {/* ARRAY HEADER */}

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


                                {/* ARRAY */}

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

                                            {/* INDEX ROW */}

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


                                            {/* VALUE ROW */}

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


                                            {/* CHANGE INFORMATION */}

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
   APP
   ========================================================= */

export default function App() {

    /*
     * -------------------------------------------------------
     * SOURCE
     * -------------------------------------------------------
     */

    const [sourceCode, setSourceCode] =
        useState(
            DEFAULT_CODE
        );


    /*
     * -------------------------------------------------------
     * EXECUTION
     * -------------------------------------------------------
     */

    const [execution, setExecution] =
        useState(null);


    /*
     * -------------------------------------------------------
     * VISUALIZATION SELECTION
     *
     * This is now a dropdown.
     * -------------------------------------------------------
     */

    const [visualizationMode, setVisualizationMode] =
        useState("auto");


    /*
     * -------------------------------------------------------
     * RECURSION PLAYBACK
     * -------------------------------------------------------
     */

    const [currentCallIndex, setCurrentCallIndex] =
        useState(0);


    /*
     * -------------------------------------------------------
     * ARRAY PLAYBACK
     * -------------------------------------------------------
     */

    const [currentArrayIndex, setCurrentArrayIndex] =
        useState(0);


    /*
     * -------------------------------------------------------
     * STACK PLAYBACK
     * -------------------------------------------------------
     */

    const [currentStackIndex, setCurrentStackIndex] =
        useState(0);


    /*
     * -------------------------------------------------------
     * RUN STATE
     * -------------------------------------------------------
     */

    const [isRunning, setIsRunning] =
        useState(false);


    /*
     * -------------------------------------------------------
     * ERROR
     * -------------------------------------------------------
     */

    const [error, setError] =
        useState(null);


    /*
     * =======================================================
     * EXECUTION EVENTS
     * =======================================================
     */

    const events =
        execution?.events || [];


    /*
     * =======================================================
     * RECURSION CALLS
     * =======================================================
     */

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


    /*
     * =======================================================
     * ARRAY STATES
     * =======================================================
     */

    const arrayStates =
        useMemo(
            () =>
                buildArrayStates(
                    events
                ),
            [events]
        );


    /*
     * =======================================================
     * STACK STATES
     * =======================================================
     */

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


    /*
     * =======================================================
     * AUTO DETECTION
     * =======================================================
     *
     * If an actual algorithm array exists,
     * Auto uses Array.
     *
     * Otherwise it uses Recursion.
     *
     * args is already excluded.
     * =======================================================
     */

    const effectiveMode =
        visualizationMode === "auto"
            ? (
                arrayStates.length > 0
                    ? "array"
                    : stackStates.length > 0
                        ? "stack"
                        : "recursion"
            )
            : visualizationMode;


    /*
     * =======================================================
     * CURRENT RECURSION CALL
     * =======================================================
     */

    const currentCall =
        callEvents[
            currentCallIndex
        ] || null;


    /*
     * =======================================================
     * GET LINE EVENT FOR CALL
     * =======================================================
     */

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


    /*
     * =======================================================
     * CURRENT RECURSION EVENT
     * =======================================================
     */

    const currentRecursionEvent =
        getLineEventForCall(
            currentCall
        );


    /*
     * =======================================================
     * PREVIOUS RECURSION EVENT
     * =======================================================
     */

    const previousCall =
        callEvents[
            currentCallIndex - 1
        ] || null;


    const previousRecursionEvent =
        getLineEventForCall(
            previousCall
        );


    /*
     * =======================================================
     * CURRENT STACK EVENT INDEX
     * =======================================================
     *
     * The StackVisualizer reconstructs the call stack by
     * replaying execution events up to the selected method
     * entry.
     *
     * We intentionally use the selected recursion call here
     * instead of changing the execution engine.
     */

    const currentStackEventIndex =
        currentCall
            ? events.findIndex(
                event =>
                    event.eventType ===
                        "METHOD_ENTER" &&
                    String(
                        event.callId
                    ) ===
                        String(
                            currentCall.callId
                        )
            )
            : -1;


    /*
     * =======================================================
     * CURRENT ARRAY STATE
     * =======================================================
     */

    const currentArrayState =
        arrayStates[
            currentArrayIndex
        ] || null;


    /*
     * =======================================================
     * PREVIOUS ARRAY STATE
     * =======================================================
     */

    const previousArrayState =
        arrayStates[
            currentArrayIndex - 1
        ] || null;


    /*
     * =======================================================
     * CURRENT STACK STATE
     * =======================================================
     */

    const currentStackState =
        stackStates[
            currentStackIndex
        ] || null;


    /*
     * =======================================================
     * PREVIOUS STACK STATE
     * =======================================================
     */

    const previousStackState =
        stackStates[
            currentStackIndex - 1
        ] || null;


    /*
     * =======================================================
     * ACTIVE EVENT
     * =======================================================
     */

    const activeEvent =
        effectiveMode === "array"
            ? currentArrayState?.event
            : effectiveMode === "stack"
                ? currentStackState?.event
                : currentRecursionEvent;


    /*
     * =======================================================
     * PREVIOUS ACTIVE EVENT
     * =======================================================
     */

    const previousActiveEvent =
        effectiveMode === "array"
            ? previousArrayState?.event
            : effectiveMode === "stack"
                ? previousStackState?.event
                : previousRecursionEvent;


    /*
     * =======================================================
     * ACTIVE LINE
     * =======================================================
     */

    const activeLine =
        activeEvent?.lineNumber ??
        null;


    /*
     * =======================================================
     * RUN CODE
     * =======================================================
     */

    async function handleRunCode() {

        setIsRunning(true);

        setError(null);

        setExecution(null);

        setCurrentCallIndex(0);

        setCurrentArrayIndex(0);

        setCurrentStackIndex(0);


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


    /*
     * =======================================================
     * RECURSION PREVIOUS
     * =======================================================
     */

    function handlePreviousCall() {

        setCurrentCallIndex(
            index =>
                Math.max(
                    0,
                    index - 1
                )
        );
    }


    /*
     * =======================================================
     * RECURSION NEXT
     * =======================================================
     */

    function handleNextCall() {

        setCurrentCallIndex(
            index =>
                Math.min(
                    callEvents.length - 1,
                    index + 1
                )
        );
    }


    /*
     * =======================================================
     * ARRAY PREVIOUS
     * =======================================================
     */

    function handlePreviousArray() {

        setCurrentArrayIndex(
            index =>
                Math.max(
                    0,
                    index - 1
                )
        );
    }


    /*
     * =======================================================
     * ARRAY NEXT
     * =======================================================
     */

    function handleNextArray() {

        setCurrentArrayIndex(
            index =>
                Math.min(
                    arrayStates.length - 1,
                    index + 1
                )
        );
    }


    /*
     * =======================================================
     * STACK PREVIOUS
     * =======================================================
     */

    function handlePreviousStack() {

        setCurrentStackIndex(
            index =>
                Math.max(
                    0,
                    index - 1
                )
        );
    }


    /*
     * =======================================================
     * STACK NEXT
     * =======================================================
     */

    function handleNextStack() {

        setCurrentStackIndex(
            index =>
                Math.min(
                    stackStates.length - 1,
                    index + 1
                )
        );
    }


    /*
     * =======================================================
     * CALL TREE SELECTION
     * =======================================================
     */

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


    /*
     * =======================================================
     * MODE CHANGE
     * =======================================================
     */

    function handleVisualizationChange(
        event
    ) {

        const value =
            event.target.value;


        setVisualizationMode(
            value
        );


        /*
         * Reset playback
         * when switching view.
         */

        if (
            value === "array"
        ) {

            setCurrentArrayIndex(0);
        }


        if (
            value === "recursion"
        ) {

            setCurrentCallIndex(0);
        }


        if (
            value === "stack"
        ) {

            setCurrentStackIndex(0);
        }

    }


    /*
     * =======================================================
     * RENDER
     * =======================================================
     */

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
                            min-w-[190px]
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

                        <option
                            value="stack"
                            
                        >
                            Stack
                        </option>

                        <option
                            value="queue"
                            disabled
                        >
                            Queue — Coming Soon
                        </option>

                        <option
                            value="linked-list"
                            disabled
                        >
                            Linked List — Coming Soon
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

                        {
                            effectiveMode === "array"
                                ? "Array Visualization"
                                : effectiveMode === "stack"
                                    ? "Call Stack"
                                    : "Recursion Tree"
                        }

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

                                {
                                    effectiveMode === "array"
                                        ? "Array Visualization"
                                        : effectiveMode === "stack"
                                            ? "Call Stack"
                                            : "Recursion Tree"
                                }

                            </h2>


                            <p className="
                                mt-0.5
                                text-[10px]
                                text-slate-500
                            ">

                                {
                                    effectiveMode === "array"
                                        ? "Current array state during execution."
                                        : effectiveMode === "stack"
                                            ? "Push, pop, peek and stack state during execution."
                                            : "Recursive calls during execution."
                                }

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

                            {
                                effectiveMode === "array"
                                    ? "ARRAY"
                                    : effectiveMode === "stack"
                                        ? "STACK"
                                        : "RECURSION"
                            }

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
                        STACK
                    ================================================= */}

                    {effectiveMode === "stack" && (

                        <div className="
                            h-[450px]
                            overflow-auto
                        ">

                            {execution ? (

                                stackStates.length > 0 ? (

                                    <StackVisualizer
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
                                        text-xs
                                        text-slate-500
                                    ">
                                        No java.util.Stack was
                                        detected in this execution.
                                    </div>

                                )

                            ) : (

                                <div className="
                                    flex
                                    h-full
                                    items-center
                                    justify-center
                                    text-center
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
                        min-w-0
                        flex-1
                        px-5
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
                            {
                                currentStackState?.operation
                            }
                            {" · Line "}
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
                            handlePreviousCall
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
                            handleNextCall
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