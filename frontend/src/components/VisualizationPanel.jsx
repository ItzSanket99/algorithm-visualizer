import ArrayVisualizer from "./ArrayVisualizer";
import CallTree from "./CallTree";

export default function VisualizationPanel({
    execution,
    currentState,
    selectedCallId,
    onSelect,
}) {
    if (!execution) {
        return (
            <section className="
                flex
                h-[490px]
                items-center
                justify-center
                rounded-lg
                border
                border-[#30363d]
                bg-[#0d1117]
            ">
                <p className="text-sm text-[#8b949e]">
                    Run your code to see the visualization.
                </p>
            </section>
        );
    }


    /*
     * =========================================================
     * EXECUTION EVENTS
     * =========================================================
     */

    const events =
        Array.isArray(execution.events)
            ? execution.events
            : [];


    /*
     * Backend tree.
     *
     * It is allowed to be null because CallTree.jsx
     * can reconstruct the tree from events.
     */

    const callTree =
        execution.callTree || null;


    /*
     * =========================================================
     * FIND REAL ARRAYS
     * =========================================================
     */

    const arrays = [];

    for (const event of events) {

        const variables =
            event.variables || {};

        for (
            const [name, value]
            of Object.entries(variables)
        ) {

            /*
             * String[] args is NOT an algorithm array.
             */

            if (name === "args") {
                continue;
            }

            if (
                typeof value !== "string"
            ) {
                continue;
            }

            const text =
                value.trim();

            if (
                text.startsWith("[") &&
                text.endsWith("]")
            ) {
                arrays.push({
                    name,
                    value,
                    event,
                });
            }
        }
    }


    /*
     * =========================================================
     * DETECT RECURSION
     * =========================================================
     */

    const methodCounts = {};

    for (const event of events) {

        if (
            event.eventType !==
            "METHOD_ENTER"
        ) {
            continue;
        }

        const method =
            event.methodName;

        if (!method) {
            continue;
        }

        methodCounts[method] =
            (methodCounts[method] || 0) + 1;
    }


    const hasRecursion =
        Object.entries(
            methodCounts
        ).some(
            ([method, count]) =>
                method !== "main" &&
                count > 1
        );


    /*
     * =========================================================
     * CHOOSE VISUALIZATION
     * =========================================================
     */

    const showRecursion =
        hasRecursion;

    const showArray =
        !showRecursion &&
        arrays.length > 0;


    /*
     * =========================================================
     * TITLE
     * =========================================================
     */

    let title = "Call Tree";

    let description =
        "Method calls during execution.";

    let badge = "TREE";


    if (showRecursion) {

        title = "Recursion Tree";

        description =
            "Recursive calls during execution.";

        badge = "RECURSION";

    } else if (showArray) {

        title = "Array";

        description =
            "Current array state during execution.";

        badge = "ARRAY";
    }


    return (
        <section className="
            flex
            h-[490px]
            min-h-0
            flex-col
            overflow-hidden
            rounded-lg
            border
            border-[#30363d]
            bg-[#0d1117]
        ">

            {/* HEADER */}

            <div className="
                flex
                shrink-0
                items-center
                justify-between
                border-b
                border-[#30363d]
                bg-[#161b22]
                px-3
                py-2
            ">

                <div>

                    <h2 className="
                        text-xs
                        font-semibold
                        text-[#e6edf3]
                    ">
                        {title}
                    </h2>

                    <p className="
                        mt-0.5
                        text-[10px]
                        text-[#8b949e]
                    ">
                        {description}
                    </p>

                </div>


                <span className="
                    rounded
                    border
                    border-[#30363d]
                    bg-[#0d1117]
                    px-2
                    py-1
                    text-[9px]
                    font-semibold
                    text-[#8b949e]
                ">
                    {badge}
                </span>

            </div>


            {/* CONTENT */}

            <div className="
                min-h-0
                flex-1
                overflow-hidden
            ">

                {showArray ? (

                    <div className="
                        h-full
                        overflow-auto
                        p-3
                    ">

                        <ArrayVisualizer
                            event={currentState}
                        />

                    </div>

                ) : (

                    <CallTree
                        callTree={callTree}
                        events={events}
                        selectedCallId={
                            selectedCallId
                        }
                        onSelect={
                            onSelect
                        }
                    />

                )}

            </div>

        </section>
    );
}