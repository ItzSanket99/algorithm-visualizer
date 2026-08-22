import { useState } from "react";
import { executeCode } from "./services/executionApi";
import CallTree from "./components/CallTree";

function App() {

    const [sourceCode, setSourceCode] = useState(
        `public class Test {

    public static void main(String[] args) {

        System.out.println(
            factorial(3)
        );
    }

    static int factorial(int n) {

        if (n == 0) {
            return 1;
        }

        return n * factorial(n - 1);
    }
}`
    );

    const [execution, setExecution] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState(null);

    async function handleRun() {

        setLoading(true);
        setError(null);

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

                setExecution(null);

                return;
            }

            setExecution(
                result.execution
            );

        } catch (error) {

            setExecution(null);

            setError(
                error.response?.data?.error ||
                error.message ||
                "Unable to connect to backend."
            );

        } finally {

            setLoading(false);
        }
    }

    return (
        <div className="app">

            <header className="app-header">

                <div>

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

            <main className="workspace">

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

            {error && (

                <div className="error-message">

                    {error}

                </div>

            )}

        </div>
    );
}

export default App;