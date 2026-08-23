export default function ExecutionState({ event }) {

    if (!event) {
        return (
            <div
                className="
                    flex
                    min-h-[110px]
                    items-center
                    justify-center
                    px-5
                    py-6
                    text-center
                    text-[13px]
                    text-[#6e7681]
                "
            >
                <p>
                    Select a call or execution step to inspect its state.
                </p>
            </div>
        );
    }

    const parameters =
        event.parameters || {};

    const variables =
        event.variables || {};


    return (
        <div
            className="
                grid
                grid-cols-1
                gap-3
                p-4
                sm:grid-cols-2
                lg:grid-cols-4
            "
        >

            {/* =================================================
                EXECUTION
               ================================================= */}

            <div
                className="
                    rounded-lg
                    border
                    border-[#252d38]
                    bg-[#0d1117]
                    p-4
                "
            >

                <h3
                    className="
                        mb-4
                        text-[11px]
                        font-semibold
                        uppercase
                        tracking-wide
                        text-[#8b949e]
                    "
                >
                    Execution
                </h3>


                <div
                    className="
                        flex
                        flex-col
                        gap-3
                    "
                >

                    <StateRow
                        label="Event"
                        value={event.eventType}
                    />

                    <StateRow
                        label="Method"
                        value={event.methodName}
                    />

                    <StateRow
                        label="Line"
                        value={event.lineNumber}
                    />

                    <StateRow
                        label="Call ID"
                        value={event.callId}
                    />

                    <StateRow
                        label="Depth"
                        value={event.callDepth}
                    />

                </div>

            </div>


            {/* =================================================
                PARAMETERS
               ================================================= */}

            <div
                className="
                    rounded-lg
                    border
                    border-[#252d38]
                    bg-[#0d1117]
                    p-4
                "
            >

                <h3
                    className="
                        mb-4
                        text-[11px]
                        font-semibold
                        uppercase
                        tracking-wide
                        text-[#8b949e]
                    "
                >
                    Parameters
                </h3>


                {Object.keys(parameters).length === 0 ? (

                    <p
                        className="
                            text-[12px]
                            text-[#6e7681]
                        "
                    >
                        No parameters
                    </p>

                ) : (

                    <div
                        className="
                            flex
                            flex-col
                            gap-3
                        "
                    >

                        {Object.entries(parameters).map(
                            ([name, value]) => (

                                <VariableRow
                                    key={name}
                                    name={name}
                                    value={value}
                                />

                            )
                        )}

                    </div>

                )}

            </div>


            {/* =================================================
                VARIABLES
               ================================================= */}

            <div
                className="
                    rounded-lg
                    border
                    border-[#252d38]
                    bg-[#0d1117]
                    p-4
                "
            >

                <h3
                    className="
                        mb-4
                        text-[11px]
                        font-semibold
                        uppercase
                        tracking-wide
                        text-[#8b949e]
                    "
                >
                    Variables
                </h3>


                {Object.keys(variables).length === 0 ? (

                    <p
                        className="
                            text-[12px]
                            text-[#6e7681]
                        "
                    >
                        No local variables
                    </p>

                ) : (

                    <div
                        className="
                            flex
                            flex-col
                            gap-3
                        "
                    >

                        {Object.entries(variables).map(
                            ([name, value]) => (

                                <VariableRow
                                    key={name}
                                    name={name}
                                    value={value}
                                />

                            )
                        )}

                    </div>

                )}

            </div>


            {/* =================================================
                RETURN VALUE
               ================================================= */}

            <div
                className="
                    rounded-lg
                    border
                    border-[#252d38]
                    bg-[#0d1117]
                    p-4
                "
            >

                <h3
                    className="
                        mb-4
                        text-[11px]
                        font-semibold
                        uppercase
                        tracking-wide
                        text-[#8b949e]
                    "
                >
                    Return Value
                </h3>


                <div
                    className="
                        break-all
                        font-mono
                        text-[13px]
                        font-semibold
                        text-[#56d364]
                    "
                >
                    {event.returnValue ?? "—"}
                </div>

            </div>

        </div>
    );
}


/* =========================================================
   STATE ROW
   ========================================================= */

function StateRow({
    label,
    value
}) {

    return (
        <div
            className="
                flex
                items-center
                justify-between
                gap-3
                text-[12px]
            "
        >

            <span
                className="
                    text-[#8b949e]
                "
            >
                {label}
            </span>

            <strong
                className="
                    max-w-[65%]
                    truncate
                    text-right
                    font-semibold
                    text-[#f0f6fc]
                "
                title={String(value ?? "")}
            >
                {value}
            </strong>

        </div>
    );
}


/* =========================================================
   VARIABLE ROW
   ========================================================= */

function VariableRow({
    name,
    value
}) {

    return (
        <div
            className="
                flex
                items-start
                justify-between
                gap-3
                text-[12px]
            "
        >

            <span
                className="
                    shrink-0
                    text-[#8b949e]
                "
            >
                {name}
            </span>

            <strong
                className="
                    max-w-[70%]
                    break-all
                    text-right
                    font-mono
                    font-semibold
                    text-[#f0f6fc]
                "
                title={String(value ?? "")}
            >
                {value}
            </strong>

        </div>
    );
}