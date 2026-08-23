import { useState } from "react";

import { executeCode } from "./services/executionApi";
import CallTree from "./components/CallTree";
import ExecutionState from "./components/ExecutionState";


/*
 * =========================================================
 * BUILD PLAYBACK
 * =========================================================
 *
 * We intentionally create ONE playback state per call.
 *
 * We do NOT use every raw execution event because that
 * produces dozens of unnecessary Previous / Next steps.
 *
 * Order:
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
 *
 * This is a preorder traversal of the call tree.
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
         * Add current call first.
         */
        result.push(node);


        /*
         * Then visit children from left to right.
         *
         * This preserves the actual recursive
         * call structure:
         *
         * fib(n - 1)
         * fib(n - 2)
         */
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
 * FIND EVENT FOR CALL
 * =========================================================
 *
 * The call tree contains the structural information.
 * The execution events contain the detailed state.
 *
 * We use the callId to find the most useful event for
 * that particular call.
 */

function findBestEventForCall(events, callId) {

    if (!events || callId == null) {
        return null;
    }


    /*
     * Prefer METHOD_EXIT because it normally contains
     * the final return value.
     */
    const exitEvent =
        events.find(
            event =>
                event.callId === callId &&
                event.eventType === "METHOD_EXIT"
        );

    if (exitEvent) {
        return exitEvent;
    }


    /*
     * Otherwise use METHOD_ENTER.
     */
    const enterEvent =
        events.find(
            event =>
                event.callId === callId &&
                event.eventType === "METHOD_ENTER"
        );

    if (enterEvent) {
        return enterEvent;
    }


    /*
     * Finally use any event belonging to the call.
     */
    return events.find(
        event =>
            event.callId === callId
    ) || null;
}


/*
 * =========================================================
 * MERGE CALL NODE + EVENT
 * =========================================================
 *
 * The call tree gives us:
 *
 * - methodName
 * - parameters
 * - returnValue
 * - callId
 *
 * The event gives us:
 *
 * - eventType
 * - lineNumber
 * - variables
 * - returnValue
 *
 * We combine both so ExecutionState receives a
 * complete and understandable state.
 */

function createPlaybackState(node, events) {

    const event =
        findBestEventForCall(
            events,
            node.callId
        );


    return {

        /*
         * Call tree information
         */
        callId:
            node.callId,

        methodName:
            node.methodName,

        parameters:
            node.parameters || {},

        returnValue:
            node.returnValue ??
            event?.returnValue ??
            null,


        /*
         * Execution information
         */
        eventType:
            event?.eventType ||
            "METHOD_ENTER",

        lineNumber:
            event?.lineNumber ??
            node.lineNumber ??
            null,

        callDepth:
            event?.callDepth ??
            node.callDepth ??
            0,


        /*
         * Local variables
         */
        variables:
            event?.variables ||
            node.variables ||
            {},

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
             * Build ONE state per call.
             *
             * This starts from main because the root
             * of the call tree is main().
             */
            const calls =
                buildCallPlayback(
                    trace.callTree
                );


            /*
             * Convert each call into a complete
             * ExecutionState object.
             */
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
             * IMPORTANT:
             *
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
     * CLICK NODE
     * =========================================================
     *
     * Clicking a call tree node jumps directly to that
     * call's playback state.
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
     * CURRENT STATE
     * =========================================================
     */

    const currentState =
        playback.length > 0
            ? playback[currentStep]
            : null;


    /*
     * =========================================================
     * CURRENT NODE
     * =========================================================
     *
     * This ID is passed into CallTree so the current
     * playback node receives the blue highlight.
     */

    const selectedCallId =
        currentState?.callId ??
        null;


    /*
     * =========================================================
     * DISPLAY PARAMETER TEXT
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
     * DISPLAY RETURN VALUE
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


                    <textarea
                        className="code-editor"
                        value={sourceCode}
                        onChange={
                            event =>
                                setSourceCode(
                                    event.target.value
                                )
                        }
                        spellCheck={false}
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