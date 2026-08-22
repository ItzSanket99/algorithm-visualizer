export default function ExecutionState({ event }) {

    if (!event) {
        return (
            <div className="execution-state empty-state">
                <p>
                    Select a call or execution step
                    to inspect its state.
                </p>
            </div>
        );
    }

    const parameters =
        event.parameters || {};

    const variables =
        event.variables || {};

    return (
        <div className="execution-state">

            <div className="state-section">

                <h3>Execution</h3>

                <div className="state-row">
                    <span>Event</span>
                    <strong>
                        {event.eventType}
                    </strong>
                </div>

                <div className="state-row">
                    <span>Method</span>
                    <strong>
                        {event.methodName}
                    </strong>
                </div>

                <div className="state-row">
                    <span>Line</span>
                    <strong>
                        {event.lineNumber}
                    </strong>
                </div>

                <div className="state-row">
                    <span>Call ID</span>
                    <strong>
                        {event.callId}
                    </strong>
                </div>

                <div className="state-row">
                    <span>Depth</span>
                    <strong>
                        {event.callDepth}
                    </strong>
                </div>

            </div>

            <div className="state-section">

                <h3>Parameters</h3>

                {Object.keys(parameters).length === 0 ? (

                    <p className="muted">
                        No parameters
                    </p>

                ) : (

                    Object.entries(parameters).map(
                        ([name, value]) => (

                            <div
                                className="variable-row"
                                key={name}
                            >
                                <span>{name}</span>
                                <strong>
                                    {value}
                                </strong>
                            </div>

                        )
                    )

                )}

            </div>

            <div className="state-section">

                <h3>Variables</h3>

                {Object.keys(variables).length === 0 ? (

                    <p className="muted">
                        No local variables
                    </p>

                ) : (

                    Object.entries(variables).map(
                        ([name, value]) => (

                            <div
                                className="variable-row"
                                key={name}
                            >
                                <span>{name}</span>
                                <strong>
                                    {value}
                                </strong>
                            </div>

                        )
                    )

                )}

            </div>

            <div className="state-section">

                <h3>Return Value</h3>

                <div className="return-value">

                    {event.returnValue ?? "—"}

                </div>

            </div>

        </div>
    );
}