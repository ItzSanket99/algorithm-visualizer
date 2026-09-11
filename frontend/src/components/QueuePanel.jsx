import React from "react";

/*
 * =========================================================
 * QUEUE HELPERS
 * =========================================================
 */

/*
 * Checks whether a runtime value is represented as a queue.
 *
 * Example:
 *
 * QUEUE:[10, 20, 30]
 */
function isQueueValue(value) {
    if (typeof value !== "string") {
        return false;
    }

    const text = value.trim();

    return (
        text.startsWith("QUEUE:[") &&
        text.endsWith("]")
    );
}


/*
 * Convert:
 *
 * QUEUE:[10, 20, 30]
 *
 * into:
 *
 * ["10", "20", "30"]
 */
function parseQueueValue(value) {
    if (!isQueueValue(value)) {
        return [];
    }

    const content =
        value
            .trim()
            .slice(7, -1)
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
            result.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    if (current.trim()) {
        result.push(current.trim());
    }

    return result;
}


/*
 * =========================================================
 * FIND QUEUE VARIABLES
 * =========================================================
 */

function getQueueVariables(event) {
    if (!event) {
        return {};
    }

    const variables =
        event.variables || {};

    const parameters =
        event.parameters || {};

    const queues = {};

    Object.entries(variables).forEach(
        ([name, value]) => {

            /*
             * Don't treat method parameters as
             * data structure variables.
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

            /*
             * main(String[] args)
             */
            if (name === "args") {
                return;
            }

            if (isQueueValue(value)) {
                queues[name] = value;
            }
        }
    );

    return queues;
}


/*
 * =========================================================
 * BUILD QUEUE STATES
 * =========================================================
 */

export function buildQueueStates(events) {
    const states = [];

    let previousSnapshot = null;

    for (const event of events) {

        if (
            event.eventType !==
            "LINE_EXECUTED"
        ) {
            continue;
        }

        const queues =
            getQueueVariables(event);

        if (
            Object.keys(queues).length === 0
        ) {
            continue;
        }

        const snapshot =
            JSON.stringify(queues);

        /*
         * Don't add duplicate states.
         */
        if (
            snapshot ===
            previousSnapshot
        ) {
            continue;
        }

        const previous =
            states.length > 0
                ? states[
                    states.length - 1
                  ]
                : null;

        states.push({
            event,
            queues,
            previousQueues:
                previous
                    ? previous.queues
                    : {}
        });

        previousSnapshot =
            snapshot;
    }

    return states;
}


/*
 * =========================================================
 * QUEUE PANEL
 * =========================================================
 */

export default function QueuePanel({
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
                        No queue state
                    </p>

                    <p className="
                        mt-2
                        text-xs
                        text-slate-500
                    ">
                        Run your code to see
                        the queue visualization.
                    </p>

                </div>

            </div>
        );
    }


    const queues =
        state.queues || {};


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
                    queues
                ).map(
                    ([name, value]) => {

                        const values =
                            parseQueueValue(
                                value
                            );

                        const previousValue =
                            state
                                .previousQueues
                                ?.[name];

                        const previousValues =
                            parseQueueValue(
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

                                {/* HEADER */}

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
                                            QUEUE
                                        </span>

                                    </div>


                                    <span className="
                                        text-[10px]
                                        text-slate-500
                                    ">
                                        size = {
                                            values.length
                                        }
                                    </span>

                                </div>


                                {/* EMPTY QUEUE */}

                                {values.length === 0 ? (

                                    <div className="
                                        flex
                                        h-48
                                        flex-col
                                        items-center
                                        justify-center
                                    ">

                                        <div className="
                                            mb-3
                                            rounded-lg
                                            border
                                            border-dashed
                                            border-[#30363d]
                                            px-10
                                            py-5
                                            text-center
                                        ">

                                            <p className="
                                                text-xs
                                                font-semibold
                                                text-slate-400
                                            ">
                                                Queue is empty
                                            </p>

                                            <p className="
                                                mt-1
                                                text-[10px]
                                                text-slate-600
                                            ">
                                                No elements available
                                            </p>

                                        </div>

                                    </div>

                                ) : (

                                    <div className="
                                        overflow-x-auto
                                        p-5
                                    ">

                                        <div className="
                                            min-w-max
                                        ">

                                            {/* FRONT / REAR */}

                                            <div className="
                                                mb-3
                                                flex
                                                items-center
                                            ">

                                                <div className="
                                                    flex
                                                    w-24
                                                    flex-col
                                                    items-center
                                                    justify-center
                                                ">

                                                    <span className="
                                                        text-[9px]
                                                        font-bold
                                                        uppercase
                                                        tracking-wider
                                                        text-[#6685ff]
                                                    ">
                                                        FRONT
                                                    </span>

                                                    <span className="
                                                        mt-1
                                                        text-[#6685ff]
                                                    ">
                                                        ↓
                                                    </span>

                                                </div>


                                                <div className="
                                                    flex
                                                    flex-1
                                                ">

                                                    {values.map(
                                                        (_, index) => (
                                                            <div
                                                                key={
                                                                    `top-${index}`
                                                                }
                                                                className="
                                                                    flex
                                                                    w-24
                                                                    justify-center
                                                                "
                                                            >

                                                                {index ===
                                                                    values.length - 1 && (
                                                                    <div className="
                                                                        flex
                                                                        flex-col
                                                                        items-center
                                                                    ">

                                                                        <span className="
                                                                            text-[9px]
                                                                            font-bold
                                                                            uppercase
                                                                            tracking-wider
                                                                            text-slate-500
                                                                        ">
                                                                            REAR
                                                                        </span>

                                                                        <span className="
                                                                            mt-1
                                                                            text-slate-500
                                                                        ">
                                                                            ↓
                                                                        </span>

                                                                    </div>
                                                                )}

                                                            </div>
                                                        )
                                                    )}

                                                </div>

                                            </div>


                                            {/* QUEUE BOXES */}

                                            <div className="
                                                flex
                                                items-center
                                            ">

                                                <div className="
                                                    w-24
                                                " />

                                                <div className="
                                                    flex
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

                                                            const isNew =
                                                                oldValue ===
                                                                    undefined &&
                                                                values.length >
                                                                    previousValues.length;


                                                            return (
                                                                <div
                                                                    key={
                                                                        `queue-${index}`
                                                                    }
                                                                    className={`
                                                                        relative
                                                                        flex
                                                                        h-20
                                                                        w-24
                                                                        items-center
                                                                        justify-center
                                                                        border
                                                                        border-[#30363d]
                                                                        bg-[#0d1117]
                                                                        font-mono
                                                                        text-sm
                                                                        font-semibold
                                                                        transition
                                                                        ${
                                                                            changed ||
                                                                            isNew
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

                                                                    {currentValue}


                                                                    {/* INDEX */}

                                                                    <span className="
                                                                        absolute
                                                                        bottom-1
                                                                        left-0
                                                                        right-0
                                                                        text-center
                                                                        text-[8px]
                                                                        font-normal
                                                                        text-slate-600
                                                                    ">
                                                                        index {
                                                                            index
                                                                        }
                                                                    </span>

                                                                </div>
                                                            );
                                                        }
                                                    )}

                                                </div>

                                            </div>


                                            {/* ARROWS */}

                                            <div className="
                                                flex
                                                items-center
                                            ">

                                                <div className="
                                                    w-24
                                                " />

                                                <div className="
                                                    flex
                                                ">

                                                    {values.map(
                                                        (_, index) => (

                                                            <div
                                                                key={
                                                                    `arrow-${index}`
                                                                }
                                                                className="
                                                                    flex
                                                                    h-8
                                                                    w-24
                                                                    items-center
                                                                    justify-center
                                                                "
                                                            >

                                                                {index <
                                                                    values.length - 1 && (
                                                                    <span className="
                                                                        text-slate-600
                                                                    ">
                                                                        →
                                                                    </span>
                                                                )}

                                                            </div>

                                                        )
                                                    )}

                                                </div>

                                            </div>


                                            {/* CHANGE INFO */}

                                            <div className="
                                                mt-2
                                                flex
                                                items-center
                                            ">

                                                <div className="
                                                    w-24
                                                " />

                                                <div className="
                                                    flex
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

                                                            const added =
                                                                oldValue ===
                                                                    undefined &&
                                                                previousValues.length <
                                                                    values.length;


                                                            return (
                                                                <div
                                                                    key={
                                                                        `change-${index}`
                                                                    }
                                                                    className="
                                                                        flex
                                                                        h-8
                                                                        w-24
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

                                                                    ) : added ? (

                                                                        <span className="
                                                                            text-[#6685ff]
                                                                        ">
                                                                            + added
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