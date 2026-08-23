import { useState } from "react";

import { executeCode } from "./services/executionApi";
import CallTree from "./components/CallTree";
import ExecutionState from "./components/ExecutionState";
import CodeViewer from "./components/CodeViewer";


/*
 * =========================================================
 * BUILD PLAYBACK
 * =========================================================
 *
 * We intentionally create ONE playback state per call.
 *
 * This keeps playback useful for students instead of
 * forcing them through every raw execution event.
 *
 * Example:
 *
 * main
 *   ↓
 * fib(4)
 *   ↓
 * fib(3)
 *   ↓
 * fib(2)
 *   ↓
 * fib(1)
 *   ↓
 * fib(0)
 *   ↓
 * ...
 */

function buildCallPlayback(root) {

    if (!root) {
        return [];
    }

    const result = [];


    function visit(node) {

        if (!node) {
            return;
        }

        /*
         * Preorder traversal:
         *
         * current node first
         * then children from left to right
         */
        result.push(node);

        const children =
            node.children || [];

        children.forEach(child => {
            visit(child);
        });
    }


    visit(root);

    return result;
}


/*
 * =========================================================
 * FIND EXIT EVENT
 * =========================================================
 *
 * Used mainly for:
 *
 * - return value
 * - final state of the call
 */

function findExitEvent(events, callId) {

    if (!events || callId == null) {
        return null;
    }

    return (
        events.find(
            event =>
                event.callId === callId &&
                event.eventType === "METHOD_EXIT"
        ) || null
    );
}


/*
 * =========================================================
 * FIND LINE EVENT
 * =========================================================
 *
 * A METHOD_EXIT event may not point to the most useful
 * source line.
 *
 * Therefore we find the LAST LINE_EXECUTED event belonging
 * to this call.
 *
 * This gives the source-code viewer a meaningful line
 * to highlight for the call-level playback state.
 */

function findLastLineEvent(events, callId) {

    if (!events || callId == null) {
        return null;
    }

    const lineEvents =
        events.filter(
            event =>
                event.callId === callId &&
                event.eventType === "LINE_EXECUTED"
        );

    if (lineEvents.length === 0) {
        return null;
    }

    return lineEvents[lineEvents.length - 1];
}


/*
 * =========================================================
 * FIND ENTER EVENT
 * =========================================================
 */

function findEnterEvent(events, callId) {

    if (!events || callId == null) {
        return null;
    }

    return (
        events.find(
            event =>
                event.callId === callId &&
                event.eventType === "METHOD_ENTER"
        ) || null
    );
}


/*
 * =========================================================
 * MERGE CALL NODE + EVENTS
 * =========================================================
 *
 * The call tree provides:
 *
 * - methodName
 * - parameters
 * - returnValue
 * - callId
 *
 * Execution events provide:
 *
 * - lineNumber
 * - variables
 * - returnValue
 * - eventType
 * - callDepth
 *
 * We combine them into one clean playback state.
 */

function createPlaybackState(node, events) {

    const exitEvent =
        findExitEvent(
            events,
            node.callId
        );

    const lineEvent =
        findLastLineEvent(
            events,
            node.callId
        );

    const enterEvent =
        findEnterEvent(
            events,
            node.callId
        );


    /*
     * Prefer the line event for source highlighting.
     *
     * If there isn't one, fall back to the enter event
     * and finally the call-tree node.
     */
    const displayEvent =
        lineEvent ||
        enterEvent ||
        exitEvent;


    return {

        /*
         * =================================================
         * CALL INFORMATION
         * =================================================
         */

        callId:
            node.callId,

        methodName:
            node.methodName,

        parameters:
            node.parameters ||
            enterEvent?.parameters ||
            {},


        /*
         * =================================================
         * RETURN VALUE
         * =================================================
         *
         * Return value should come from METHOD_EXIT first.
         */

        returnValue:
            exitEvent?.returnValue ??
            node.returnValue ??
            null,


        /*
         * =================================================
         * SOURCE LINE
         * =================================================
         *
         * IMPORTANT:
         *
         * This is what CodeViewer uses to highlight
         * the current source-code row.
         */

        lineNumber:
            displayEvent?.lineNumber ??
            node.lineNumber ??
            null,


        /*
         * =================================================
         * EVENT INFORMATION
         * =================================================
         */

        eventType:
            displayEvent?.eventType ||
            "METHOD_ENTER",

        callDepth:
            displayEvent?.callDepth ??
            node.callDepth ??
            0,


        /*
         * =================================================
         * VARIABLES
         * =================================================
         *
         * Prefer the last LINE_EXECUTED state because
         * it usually represents the most useful local
         * state for this call.
         */

        variables:
            lineEvent?.variables ||
            exitEvent?.variables ||
            enterEvent?.variables ||
            node.variables ||
            {}
    };
}


/*
 * =========================================================
 * APP
 * =========================================================
 */

function App() {

    const [sourceCode, setSourceCode] =
        useState(
            `public class Test {

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

}`
        );


    const [execution, setExecution] =
        useState(null);


    const [playback, setPlayback] =
        useState([]);


    const [currentStep, setCurrentStep] =
        useState(0);


    const [loading, setLoading] =
        useState(false);


    const [error, setError] =
        useState(null);


    /*
     * =========================================================
     * RUN CODE
     * =========================================================
     */

    async function handleRun() {

        setLoading(true);

        setError(null);

        setExecution(null);

        setPlayback([]);

        setCurrentStep(0);


        try {

            const result =
                await executeCode(
                    sourceCode
                );


            if (!result.success) {

                setError(
                    result.error ||
                    "Execution failed."
                );

                return;
            }


            const trace =
                result.execution;


            setExecution(trace);


            /*
             * Build one playback state per call.
             */
            const calls =
                buildCallPlayback(
                    trace.callTree
                );


            const states =
                calls.map(
                    node =>
                        createPlaybackState(
                            node,
                            trace.events || []
                        )
                );


            setPlayback(states);

            /*
             * Start from MAIN.
             */
            setCurrentStep(0);

        } catch (err) {

            setError(
                err?.response?.data?.error ||
                err?.message ||
                "Unable to connect to backend."
            );

        } finally {

            setLoading(false);

        }
    }


    /*
     * =========================================================
     * PREVIOUS
     * =========================================================
     */

    function handlePrevious() {

        setCurrentStep(
            previous =>
                Math.max(
                    0,
                    previous - 1
                )
        );
    }


    /*
     * =========================================================
     * NEXT
     * =========================================================
     */

    function handleNext() {

        setCurrentStep(
            previous =>
                Math.min(
                    playback.length - 1,
                    previous + 1
                )
        );
    }


    /*
     * =========================================================
     * CLICK CALL TREE NODE
     * =========================================================
     *
     * Clicking a node jumps to that call's playback state.
     */

    function handleCallSelect(node) {

        if (
            !node ||
            playback.length === 0
        ) {
            return;
        }


        const index =
            playback.findIndex(
                state =>
                    state.callId ===
                    node.callId
            );


        if (index !== -1) {

            setCurrentStep(index);

        }
    }


    /*
     * =========================================================
     * CURRENT PLAYBACK STATE
     * =========================================================
     */

    const currentState =
        playback.length > 0
            ? playback[currentStep]
            : null;


    /*
     * =========================================================
     * SELECTED CALL
     * =========================================================
     *
     * This controls the blue highlight in CallTree.
     */

    const selectedCallId =
        currentState?.callId ??
        null;


    /*
     * =========================================================
     * FORMAT PARAMETERS
     * =========================================================
     */

    function formatParameters(parameters) {

        if (
            !parameters ||
            Object.keys(parameters).length === 0
        ) {
            return "";
        }


        return Object.entries(parameters)
            .map(
                ([key, value]) =>
                    `${key}=${value}`
            )
            .join(", ");
    }


    /*
     * =========================================================
     * FORMAT RETURN VALUE
     * =========================================================
     */

    function formatReturnValue(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "—";
        }


        return String(value);
    }


    /*
     * =========================================================
     * RENDER
     * =========================================================
     */

    return (

        <div className="app">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="app-header">

                <div>

                    <h1 className="app-title">
                        AlgoTrace
                    </h1>

                    <p className="app-subtitle">
                        Visualize your code execution
                    </p>

                </div>


                <button
                    className="run-button"
                    onClick={handleRun}
                    disabled={loading}
                >

                    {loading
                        ? "Running..."
                        : "Run Code"}

                </button>

            </header>


            {/* =================================================
                WORKSPACE
            ================================================= */}

            <main className="workspace">

                {/* =================================================
                    SOURCE CODE
                ================================================= */}

                <section className="panel code-panel">

                    <div className="panel-header">

                        <h2>
                            Source Code
                        </h2>

                    </div>


                    <CodeViewer
                        sourceCode={sourceCode}

                        /*
                         * IMPORTANT:
                         *
                         * Previously this was:
                         *
                         * selectedEvent?.lineNumber
                         *
                         * but selectedEvent was never updated.
                         *
                         * Now the line comes directly from
                         * the current playback state.
                         */

                        currentLine={
                            currentState?.lineNumber ??
                            null
                        }

                        onChange={
                            setSourceCode
                        }
                    />

                </section>


                {/* =================================================
                    CALL TREE
                ================================================= */}

                <section className="panel tree-panel">

                    <div className="panel-header">

                        <h2>
                            Call Tree
                        </h2>

                    </div>


                    <div className="tree-container">

                        {execution ? (

                            <CallTree
                                root={
                                    execution.callTree
                                }

                                onSelect={
                                    handleCallSelect
                                }

                                selectedCallId={
                                    selectedCallId
                                }
                            />

                        ) : (

                            <div className="empty-state">

                                <p>
                                    Run your code to see
                                    the execution tree.
                                </p>

                            </div>

                        )}

                    </div>

                </section>

            </main>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="error-message">
                    {error}
                </div>

            )}


            {/* =================================================
                PLAYBACK
            ================================================= */}

            {playback.length > 0 && (

                <div className="playback-panel">

                    {/* PREVIOUS */}

                    <button
                        className="playback-button"
                        onClick={
                            handlePrevious
                        }
                        disabled={
                            currentStep === 0
                        }
                    >

                        ← Previous

                    </button>


                    {/* CURRENT CALL */}

                    <div className="playback-info">

                        <div className="playback-step">

                            Call{" "}
                            {currentStep + 1}
                            {" "}
                            of{" "}
                            {playback.length}

                        </div>


                        {currentState && (

                            <div className="playback-method">

                                {currentState.methodName}

                                {"("}

                                {formatParameters(
                                    currentState.parameters
                                )}

                                {")"}

                                {" → "}

                                {formatReturnValue(
                                    currentState.returnValue
                                )}

                            </div>

                        )}

                    </div>


                    {/* NEXT */}

                    <button
                        className="playback-button"
                        onClick={
                            handleNext
                        }
                        disabled={
                            currentStep >=
                            playback.length - 1
                        }
                    >

                        Next →

                    </button>

                </div>

            )}


            {/* =================================================
                EXECUTION STATE
            ================================================= */}

            {execution && (

                <section className="panel state-panel">

                    <div className="panel-header">

                        <h2>
                            Execution State
                        </h2>

                    </div>


                    <ExecutionState
                        event={
                            currentState
                        }
                    />

                </section>

            )}

        </div>
    );
}


export default App;