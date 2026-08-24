function isArrayValue(value) {

    if (typeof value !== "string") {
        return false;
    }

    const text =
        value.trim();

    return (
        text.startsWith("[") &&
        text.endsWith("]")
    );
}


function parseArray(value) {

    if (!isArrayValue(value)) {
        return [];
    }

    const text =
        value
            .trim()
            .slice(1, -1)
            .trim();

    if (!text) {
        return [];
    }

    return text
        .split(",")
        .map(
            item =>
                item.trim()
        );
}


export default function ExecutionState({
    event,
    previousEvent
}) {

    if (!event) {

        return (
            <div className="
                flex
                min-h-[180px]
                items-center
                justify-center
                rounded-lg
                border
                border-[#30363d]
                bg-[#0d1117]
                text-xs
                text-[#6e7681]
            ">
                Select a call or execution step
                to inspect its state.
            </div>
        );
    }


    const parameters =
        event.parameters || {};

    const variables =
        event.variables || {};

    const previousVariables =
        previousEvent?.variables || {};


    /*
     * =========================================================
     * VARIABLE CHANGES
     * =========================================================
     */

    const allNames =
        new Set([
            ...Object.keys(
                previousVariables
            ),
            ...Object.keys(
                variables
            )
        ]);


    const changes = [];


    allNames.forEach(
        name => {

            const previousValue =
                previousVariables[
                    name
                ];

            const currentValue =
                variables[
                    name
                ];


            const previousText =
                previousValue === undefined
                    ? undefined
                    : String(
                        previousValue
                    );


            const currentText =
                currentValue === undefined
                    ? undefined
                    : String(
                        currentValue
                    );


            if (
                previousText !==
                currentText
            ) {

                changes.push({

                    name,

                    previousValue:
                        previousText ??
                        "—",

                    currentValue:
                        currentText ??
                        "—"

                });

            }

        }
    );


    return (

        <section className="
            overflow-hidden
            rounded-lg
            border
            border-[#30363d]
            bg-[#161b22]
        ">

            {/* HEADER */}

            <div className="
                border-b
                border-[#30363d]
                bg-[#161b22]
                px-3
                py-2.5
                text-xs
                font-semibold
            ">
                Execution State
            </div>


            {/* CONTENT */}

            <div className="
                grid
                grid-cols-1
                gap-3
                p-3
                lg:grid-cols-2
                xl:grid-cols-4
            ">


                {/* =================================================
                    EXECUTION
                   ================================================= */}

                <div className="
                    min-h-[190px]
                    rounded-md
                    border
                    border-[#30363d]
                    bg-[#0d1117]
                    p-3
                ">

                    <h3 className="
                        mb-4
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-wider
                        text-[#6e7681]
                    ">
                        Execution
                    </h3>


                    <div className="
                        space-y-3
                    ">

                        <StateRow
                            label="Event"
                            value={
                                event.eventType
                            }
                        />

                        <StateRow
                            label="Method"
                            value={
                                event.methodName
                            }
                        />

                        <StateRow
                            label="Line"
                            value={
                                event.lineNumber ??
                                "—"
                            }
                        />

                        <StateRow
                            label="Call ID"
                            value={
                                event.callId
                            }
                        />

                        <StateRow
                            label="Depth"
                            value={
                                event.callDepth
                            }
                        />

                    </div>

                </div>


                {/* =================================================
                    PARAMETERS
                   ================================================= */}

                <div className="
                    min-h-[190px]
                    rounded-md
                    border
                    border-[#30363d]
                    bg-[#0d1117]
                    p-3
                ">

                    <h3 className="
                        mb-4
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-wider
                        text-[#6e7681]
                    ">
                        Parameters
                    </h3>


                    {Object.keys(
                        parameters
                    ).length === 0 ? (

                        <p className="
                            text-xs
                            text-[#6e7681]
                        ">
                            No parameters
                        </p>

                    ) : (

                        <div className="
                            space-y-2
                        ">

                            {Object.entries(
                                parameters
                            ).map(
                                ([name, value]) => (

                                    <div
                                        key={name}
                                        className="
                                            flex
                                            items-center
                                            justify-between
                                            gap-3
                                            rounded
                                            bg-[#11161d]
                                            px-3
                                            py-2
                                        "
                                    >

                                        <span className="
                                            font-mono
                                            text-xs
                                            text-[#8b949e]
                                        ">
                                            {name}
                                        </span>


                                        <span className="
                                            max-w-[220px]
                                            truncate
                                            font-mono
                                            text-xs
                                            font-semibold
                                            text-[#e6edf3]
                                        ">
                                            {value}
                                        </span>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </div>


                {/* =================================================
                    VARIABLES
                   ================================================= */}

                <div className="
                    min-h-[190px]
                    rounded-md
                    border
                    border-[#30363d]
                    bg-[#0d1117]
                    p-3
                ">

                    <h3 className="
                        mb-4
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-wider
                        text-[#6e7681]
                    ">
                        Variables
                    </h3>


                    {Object.keys(
                        variables
                    ).length === 0 ? (

                        <p className="
                            text-xs
                            text-[#6e7681]
                        ">
                            No local variables
                        </p>

                    ) : (

                        <div className="
                            max-h-[300px]
                            space-y-2
                            overflow-y-auto
                        ">

                            {Object.entries(
                                variables
                            ).map(
                                ([name, value]) => {

                                    const change =
                                        changes.find(
                                            item =>
                                                item.name ===
                                                name
                                        );


                                    const array =
                                        isArrayValue(
                                            value
                                        );


                                    return (

                                        <div
                                            key={name}
                                            className={`
                                                overflow-hidden
                                                rounded
                                                border
                                                ${
                                                    change
                                                        ? `
                                                            border-[#6685ff]/60
                                                            bg-[#1d2a50]/50
                                                          `
                                                        : `
                                                            border-transparent
                                                            bg-[#11161d]
                                                          `
                                                }
                                            `}
                                        >

                                            <div className="
                                                flex
                                                items-center
                                                justify-between
                                                gap-3
                                                px-3
                                                py-2
                                            ">

                                                <span className="
                                                    font-mono
                                                    text-xs
                                                    text-[#c9d1d9]
                                                ">
                                                    {name}
                                                </span>


                                                <div className="
                                                    flex
                                                    items-center
                                                    gap-2
                                                ">

                                                    {array && (

                                                        <span className="
                                                            rounded
                                                            border
                                                            border-[#30363d]
                                                            px-1.5
                                                            py-0.5
                                                            text-[8px]
                                                            text-[#8b949e]
                                                        ">
                                                            ARRAY
                                                        </span>

                                                    )}


                                                    <span className="
                                                        max-w-[180px]
                                                        truncate
                                                        font-mono
                                                        text-xs
                                                        font-semibold
                                                        text-[#e6edf3]
                                                    ">
                                                        {value}
                                                    </span>

                                                </div>

                                            </div>


                                            {change && (

                                                <div className="
                                                    flex
                                                    items-center
                                                    gap-2
                                                    border-t
                                                    border-[#30363d]
                                                    bg-[#11161d]
                                                    px-3
                                                    py-1.5
                                                    font-mono
                                                    text-[10px]
                                                ">

                                                    <span className="
                                                        text-[#8b949e]
                                                    ">
                                                        {change.previousValue}
                                                    </span>


                                                    <span className="
                                                        text-[#6e7681]
                                                    ">
                                                        →
                                                    </span>


                                                    <span className="
                                                        text-[#4ade80]
                                                    ">
                                                        {change.currentValue}
                                                    </span>

                                                </div>

                                            )}

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>


                {/* =================================================
                    RETURN VALUE
                   ================================================= */}

                <div className="
                    min-h-[190px]
                    rounded-md
                    border
                    border-[#30363d]
                    bg-[#0d1117]
                    p-3
                ">

                    <h3 className="
                        mb-4
                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-wider
                        text-[#6e7681]
                    ">
                        Return Value
                    </h3>


                    <div className="
                        font-mono
                        text-sm
                        font-semibold
                        text-[#4ade80]
                        break-all
                    ">
                        {event.returnValue ??
                            "—"}
                    </div>

                </div>

            </div>

        </section>
    );
}


/*
 * =========================================================
 * STATE ROW
 * =========================================================
 */

function StateRow({
    label,
    value
}) {

    return (

        <div className="
            flex
            items-center
            justify-between
            gap-3
        ">

            <span className="
                text-xs
                text-[#8b949e]
            ">
                {label}
            </span>


            <span className="
                max-w-[200px]
                truncate
                font-mono
                text-xs
                font-semibold
                text-[#e6edf3]
            ">
                {value}
            </span>

        </div>
    );
}