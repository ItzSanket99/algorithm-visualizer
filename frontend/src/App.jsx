import { useState } from "react";

import { executeCode } from "./services/executionApi";
import CallTree from "./components/CallTree";
import ExecutionState from "./components/ExecutionState";

function findFirstEventForCall(events, callId) {
    return events.find(
        (event) =>
            event.callId === callId &&
            event.eventType === "LINE_EXECUTED"
    );
}

function App() {

    const [sourceCode, setSourceCode] = useState(
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

    const [execution, setExecution] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function handleRun() {

        setLoading(true);
        setError(null);
        setExecution(null);
        setSelectedEvent(null);

        try {

            const result = await executeCode(sourceCode);

            if (!result.success) {

                setError(
                    result.error ||
                    "Execution failed."
                );

                return;
            }

            setExecution(result.execution);

        } catch (error) {

            setError(
                error?.response?.data?.error ||
                error?.message ||
                "Unable to connect to backend."
            );

        } finally {

            setLoading(false);

        }
    }

    function handleCallSelect(node) {

        if (!execution) {
            return;
        }

        const event = findFirstEventForCall(
            execution.events,
            node.callId
        );

        setSelectedEvent(event || null);
    }

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-[#0d1117] px-8 py-6 text-[#e6edf3]">

            {/* =========================================
                HEADER
               ========================================= */}

            <header className="mb-6 flex w-full items-center justify-between">

                <div>
                    <h1 className="m-0 text-[30px] font-bold tracking-[-0.5px] text-[#f0f6fc]">
                        AlgoTrace
                    </h1>

                    <p className="mt-1 text-[14px] text-[#8b949e]">
                        Visualize your code execution
                    </p>
                </div>

                <button
                    className="
                        shrink-0
                        rounded-lg
                        border
                        border-[#5c7cff]
                        bg-[#4f6fff]
                        px-[22px]
                        py-[10px]
                        text-[14px]
                        font-semibold
                        text-white
                        transition
                        hover:bg-[#4161e8]
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                    "
                    onClick={handleRun}
                    disabled={loading}
                >
                    {loading ? "Running..." : "Run Code"}
                </button>

            </header>


            {/* =========================================
                MAIN WORKSPACE
               ========================================= */}

            <main
                className="
                    grid
                    w-full
                    max-w-full
                    grid-cols-1
                    gap-5
                    xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]
                "
            >

                {/* =========================================
                    SOURCE CODE
                   ========================================= */}

                <section
                    className="
                        flex
                        h-[550px]
                        min-w-0
                        flex-col
                        overflow-hidden
                        rounded-[10px]
                        border
                        border-[#30363d]
                        bg-[#161b22]
                        xl:h-[620px]
                    "
                >

                    <div
                        className="
                            flex
                            min-h-[48px]
                            items-center
                            border-b
                            border-[#30363d]
                            bg-[#161b22]
                            px-[18px]
                        "
                    >
                        <h2 className="m-0 text-[14px] font-semibold text-[#e6edf3]">
                            Source Code
                        </h2>
                    </div>

                    <textarea
                        className="
                            flex-1
                            w-full
                            min-w-0
                            resize-none
                            border-none
                            bg-[#0d1117]
                            p-5
                            font-mono
                            text-[14px]
                            leading-[1.7]
                            text-[#c9d1d9]
                            outline-none
                        "
                        value={sourceCode}
                        onChange={(event) =>
                            setSourceCode(event.target.value)
                        }
                        spellCheck={false}
                    />

                </section>


                {/* =========================================
                    CALL TREE
                   ========================================= */}

                <section
                    className="
                        flex
                        h-[550px]
                        min-w-0
                        flex-col
                        overflow-hidden
                        rounded-[10px]
                        border
                        border-[#30363d]
                        bg-[#161b22]
                        xl:h-[620px]
                    "
                >

                    <div
                        className="
                            flex
                            min-h-[48px]
                            items-center
                            border-b
                            border-[#30363d]
                            bg-[#161b22]
                            px-[18px]
                        "
                    >
                        <h2 className="m-0 text-[14px] font-semibold text-[#e6edf3]">
                            Call Tree
                        </h2>
                    </div>

                    <div
                        className="
                            min-h-0
                            w-full
                            flex-1
                            overflow-x-auto
                            overflow-y-auto
                            bg-[#0d1117]
                        "
                    >

                        {execution ? (

                            <CallTree
                                root={execution.callTree}
                                onSelect={handleCallSelect}
                            />

                        ) : (

                            <div className="flex h-full items-center justify-center text-center text-[#6e7681]">
                                <p className="m-0 text-[13px]">
                                    Run your code to see the execution tree.
                                </p>
                            </div>

                        )}

                    </div>

                </section>

            </main>


            {/* =========================================
                ERROR
               ========================================= */}

            {error && (

                <div
                    className="
                        mt-4
                        w-full
                        rounded-lg
                        border
                        border-[#8e3b46]
                        bg-[#2d1519]
                        px-4
                        py-3
                        text-[14px]
                        text-[#ff7b72]
                    "
                >
                    {error}
                </div>

            )}


            {/* =========================================
                EXECUTION STATE
               ========================================= */}

            {execution && (

                <section
                    className="
                        mt-5
                        flex
                        w-full
                        min-w-0
                        flex-col
                        overflow-hidden
                        rounded-[10px]
                        border
                        border-[#30363d]
                        bg-[#161b22]
                    "
                >

                    <div
                        className="
                            flex
                            min-h-[48px]
                            items-center
                            border-b
                            border-[#30363d]
                            bg-[#161b22]
                            px-[18px]
                        "
                    >
                        <h2 className="m-0 text-[14px] font-semibold text-[#e6edf3]">
                            Execution State
                        </h2>
                    </div>

                    <ExecutionState
                        event={selectedEvent}
                    />

                </section>

            )}

        </div>
    );
}

export default App;