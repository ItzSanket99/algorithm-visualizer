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

    const [execution, setExecution] =
        useState(null);

    const [selectedEvent, setSelectedEvent] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState(null);

    async function handleRun() {

        setLoading(true);
        setError(null);
        setExecution(null);
        setSelectedEvent(null);

        try {

            const result =
                await executeCode(sourceCode);

            if (!result.success) {

                setError(
                    result.error ||
                    "Execution failed."
                );

                return;
            }

            setExecution(
                result.execution
            );

        } catch (error) {

            setError(
                error.response?.data?.error ||
                error.message ||
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

        const event =
            findFirstEventForCall(
                execution.events,
                node.callId
            );

        setSelectedEvent(event || null);
    }

    return (
        <div className="app">

            {/* =========================
                HEADER
               ========================= */}

            <header className="app-header">

    <div className="app-brand">

        <h1>
            AlgoTrace
        </h1>

        <p>
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



            {/* =========================
                MAIN WORKSPACE
               ========================= */}

            <main className="workspace">

                {/* =========================
                    SOURCE CODE
                   ========================= */}

                <section className="panel code-panel">

                    <div className="panel-header">

                        <h2>
                            Source Code
                        </h2>

                    </div>

                    <textarea
                        className="code-editor"
                        value={sourceCode}
                        onChange={(event) =>
                            setSourceCode(
                                event.target.value
                            )
                        }
                        spellCheck={false}
                    />

                </section>


                {/* =========================
                    CALL TREE
                   ========================= */}

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


            {/* =========================
                ERROR
               ========================= */}

            {error && (

                <div className="error-message">

                    {error}

                </div>

            )}


            {/* =========================
                EXECUTION STATE
               ========================= */}

            {execution && (

                <section className="panel state-panel">

                    <div className="panel-header">

                        <h2>
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